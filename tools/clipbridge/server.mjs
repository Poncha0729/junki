#!/usr/bin/env node
// ClipBridge — PC とスマホの間で文字をやり取りする、依存パッケージなしの小さなサーバ。
//
//   npm run clipbridge
//
// PC でこれを起動し、表示された URL をスマホのブラウザで開くだけ。
// スマホ側にアプリを入れる必要はない（iPhone / Android どちらでも同じ）。
//
//   PC → スマホ : PC のキーボードで打った文字がスマホの画面にリアルタイムで映る。
//                 スマホ側で「コピー」を押せば、どのアプリにも貼り付けられる。
//   スマホ → PC : スマホで送った文字が、そのまま PC のクリップボードに入る。
//                 PC 側は Ctrl+V するだけ。
//
// 詳しくは docs/CLIPBRIDGE.md。

import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { networkInterfaces, hostname } from 'node:os';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.CLIPBRIDGE_PORT || 8787);
const NO_CLIPBOARD = process.argv.includes('--no-clipboard');
const TOKEN_FILE = path.join(__dirname, '.token');

// 合言葉（URL の ?t=）。同じ Wi-Fi にいる他人が勝手に PC のクリップボードへ
// 書き込めないようにするためのもの。
//   - CLIPBRIDGE_TOKEN があればそれを使う
//   - 無ければ初回にランダムに作って tools/clipbridge/.token に保存し、次回以降も同じものを使う
//     （iPhone のショートカットやホーム画面のブックマークが起動のたびに壊れないように）
//   - --new-token を付けて起動すると作り直す
async function loadToken() {
  if (process.env.CLIPBRIDGE_TOKEN) return process.env.CLIPBRIDGE_TOKEN.trim();
  if (!process.argv.includes('--new-token')) {
    try {
      const saved = (await readFile(TOKEN_FILE, 'utf8')).trim();
      if (/^[A-Za-z0-9_-]{4,64}$/.test(saved)) return saved;
    } catch {}
  }
  // 64 ビット。同じ Wi-Fi からの総当たりが現実的でない長さ（QR / ブックマーク経由で使うので手打ちは想定しない）
  const fresh = randomBytes(8).toString('hex');
  await writeFile(TOKEN_FILE, fresh + '\n', 'utf8');
  return fresh;
}
const TOKEN = await loadToken();
const MAX_HISTORY = 50;
const MAX_TEXT_BYTES = 200_000;

// ---------------------------------------------------------------------------
// PC のクリップボード読み書き（OS ごとに標準のコマンドを使う）
// ---------------------------------------------------------------------------

function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    } catch (err) {
      reject(err);
      return;
    }
    let out = '';
    let err = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(err.trim() || `${cmd} exited with code ${code}`));
    });
    child.stdin.on('error', () => {});
    if (input !== undefined) child.stdin.end(input, 'utf8');
    else child.stdin.end();
  });
}

// Windows: clip.exe は標準入力を ANSI (Shift-JIS) として読むので日本語が化ける。
// PowerShell に UTF-8 で渡して Set-Clipboard する。
const PS_ARGS = ['-NoProfile', '-NonInteractive', '-Command'];
const PS_SET =
  '[Console]::InputEncoding = [System.Text.Encoding]::UTF8; ' +
  '$t = [Console]::In.ReadToEnd(); Set-Clipboard -Value $t';
const PS_GET =
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ' +
  '$t = Get-Clipboard -Raw; if ($null -ne $t) { [Console]::Out.Write($t) }';

async function firstThatWorks(attempts) {
  let lastError;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('clipboard command not available');
}

async function writePcClipboard(text) {
  switch (process.platform) {
    case 'win32':
      return run('powershell', [...PS_ARGS, PS_SET], text);
    case 'darwin':
      return run('pbcopy', [], text);
    default:
      return firstThatWorks([
        () => run('wl-copy', [], text),
        () => run('xclip', ['-selection', 'clipboard'], text),
        () => run('xsel', ['--clipboard', '--input'], text),
      ]);
  }
}

async function readPcClipboard() {
  switch (process.platform) {
    case 'win32':
      return run('powershell', [...PS_ARGS, PS_GET]);
    case 'darwin':
      return run('pbpaste', []);
    default:
      return firstThatWorks([
        () => run('wl-paste', ['--no-newline']),
        () => run('xclip', ['-selection', 'clipboard', '-o']),
        () => run('xsel', ['--clipboard', '--output']),
      ]);
  }
}

// ---------------------------------------------------------------------------
// 状態（メモリ上だけ。サーバを止めると消える）
// ---------------------------------------------------------------------------

const history = []; // { id, text, from: 'pc' | 'phone', at, copiedToPc }
let nextId = 1;
const sseClients = new Set();

function addItem(text, from, extra = {}) {
  const item = { id: nextId++, text, from, at: Date.now(), ...extra };
  history.push(item);
  while (history.length > MAX_HISTORY) history.shift();
  broadcast({ type: 'item', item });
  return item;
}

function latestItem(from) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (!from || history[i].from === from) return history[i];
  }
  return null;
}

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) res.write(payload);
}

setInterval(() => {
  for (const res of sseClients) res.write(': ping\n\n');
}, 25_000).unref();

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function lanAddresses() {
  const out = [];
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      // 仮想アダプタ（WSL / VirtualBox / VPN）は後ろに回す
      const virtual = /vEthernet|WSL|VirtualBox|VMware|Hyper-V|docker|tailscale|zt/i.test(name);
      out.push({ name, address: a.address, virtual });
    }
  }
  out.sort((a, b) => Number(a.virtual) - Number(b.virtual));
  return out.map((a) => a.address);
}

// スマホから開く URL の候補。IP アドレスの後に「PC名.local」も出す。
// Windows 10 以降と iPhone はどちらも mDNS に対応しているので、
// Wi-Fi ルータが IP を割り当て直しても .local の方は変わらない。
function phoneUrls() {
  const urls = lanAddresses().map((ip) => `http://${ip}:${PORT}/?t=${TOKEN}`);
  const name = hostname().toLowerCase().replace(/\.local$/, '');
  if (name && name !== 'localhost') urls.push(`http://${name}.local:${PORT}/?t=${TOKEN}`);
  return urls;
}

function text(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function tokenOk(req, url) {
  const given = req.headers['x-token'] || url.searchParams.get('t') || '';
  const a = Buffer.from(String(given));
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

// 合言葉が違うときは少し待ってから返す（総当たりを遅くする）
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BAD_TOKEN_DELAY_MS = 300;

// JSON でも text/plain でも受け取る。text/plain のときは { text } に包む
// （iPhone のショートカットからは text/plain の方が組みやすい）。
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_TEXT_BYTES + 1024) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const type = String(req.headers['content-type'] || '');
      if (!type.includes('json')) {
        resolve({ text: raw });
        return;
      }
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function html(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const DENIED_PAGE = `<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ClipBridge</title>
<body style="font-family:system-ui,sans-serif;padding:24px;line-height:1.7">
<h1 style="font-size:20px">この URL では開けません</h1>
<p>合言葉（URL の <code>?t=</code>）が無いか、違っています。<br>
PC のターミナルに表示されている URL を、そのままスマホで開いてください。</p>
</body></html>`;

const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    return json(res, 400, { error: 'bad request' });
  }

  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      if (!tokenOk(req, url)) {
        await sleep(BAD_TOKEN_DELAY_MS);
        return html(res, 403, DENIED_PAGE);
      }
      const page = await readFile(path.join(__dirname, 'index.html'), 'utf8');
      return html(res, 200, page);
    }

    // QR 生成ライブラリ（同梱。CDN に頼らない）
    if (req.method === 'GET' && url.pathname === '/vendor/qrcode.min.js') {
      const js = await readFile(path.join(__dirname, 'vendor', 'qrcode.min.js'));
      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      });
      return res.end(js);
    }

    if (!url.pathname.startsWith('/api/')) return json(res, 404, { error: 'not found' });
    if (!tokenOk(req, url)) {
      await sleep(BAD_TOKEN_DELAY_MS);
      return json(res, 403, { error: 'bad token' });
    }

    if (req.method === 'GET' && url.pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write(
        `data: ${JSON.stringify({
          type: 'hello',
          history,
          platform: process.platform,
          clipboard: !NO_CLIPBOARD,
          urls: phoneUrls(),
        })}\n\n`,
      );
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    // ---- iPhone ショートカット向け（GET で text/plain を返す） ----
    // PC のクリップボードの中身をそのまま返す（履歴にも残す）
    if (req.method === 'GET' && url.pathname === '/api/clipboard') {
      if (NO_CLIPBOARD) return text(res, 400, '');
      try {
        const clip = await readPcClipboard();
        if (clip) addItem(clip, 'pc', { pulled: true });
        return text(res, 200, clip || '');
      } catch (err) {
        console.warn(`[clipbridge] PC のクリップボードを読めませんでした: ${err.message}`);
        return text(res, 500, '');
      }
    }
    // 最後に「送る」で届いた文字を返す。?from=pc で PC から送ったものに限定
    if (req.method === 'GET' && url.pathname === '/api/latest') {
      const from = url.searchParams.get('from');
      const item = latestItem(from === 'pc' || from === 'phone' ? from : undefined);
      return text(res, 200, item ? item.text : '');
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });

    if (url.pathname === '/api/send') {
      const body = await readBody(req);
      const text = typeof body.text === 'string' ? body.text : '';
      const from = body.from === 'pc' ? 'pc' : 'phone';
      if (!text) return json(res, 400, { error: 'empty' });
      if (Buffer.byteLength(text) > MAX_TEXT_BYTES) return json(res, 413, { error: 'too large' });

      let copiedToPc = false;
      let clipboardError;
      if (from === 'phone' && !NO_CLIPBOARD) {
        try {
          await writePcClipboard(text);
          copiedToPc = true;
        } catch (err) {
          clipboardError = err.message;
          console.warn(`[clipbridge] PC のクリップボードに書き込めませんでした: ${err.message}`);
        }
      }
      const item = addItem(text, from, { copiedToPc });
      return json(res, 200, { ok: true, item, clipboardError });
    }

    if (url.pathname === '/api/live') {
      const body = await readBody(req);
      const text = typeof body.text === 'string' ? body.text : '';
      if (Buffer.byteLength(text) > MAX_TEXT_BYTES) return json(res, 413, { error: 'too large' });
      broadcast({ type: 'live', text, from: body.from === 'pc' ? 'pc' : 'phone' });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/pull') {
      if (NO_CLIPBOARD) return json(res, 400, { error: 'clipboard disabled' });
      try {
        const text = await readPcClipboard();
        if (!text) return json(res, 200, { ok: true, empty: true });
        const item = addItem(text, 'pc', { pulled: true });
        return json(res, 200, { ok: true, item });
      } catch (err) {
        console.warn(`[clipbridge] PC のクリップボードを読めませんでした: ${err.message}`);
        return json(res, 500, { error: err.message });
      }
    }

    if (url.pathname === '/api/clear') {
      history.length = 0;
      broadcast({ type: 'clear' });
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { error: 'not found' });
  } catch (err) {
    console.error('[clipbridge]', err);
    if (!res.headersSent) json(res, 500, { error: err.message });
    else res.end();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const urls = phoneUrls();
  console.log('');
  console.log('  ClipBridge が起動しました');
  console.log('');
  console.log(`  PC で開く   : http://localhost:${PORT}/?t=${TOKEN}`);
  if (urls.length === 0) {
    console.log('  スマホで開く: （LAN の IPv4 アドレスが見つかりません。Wi-Fi に接続していますか？）');
  } else {
    for (const [i, u] of urls.entries()) {
      console.log(`  ${i === 0 ? 'スマホで開く' : '            '}: ${u}`);
    }
  }
  console.log('');
  console.log(`  合言葉（?t=）: ${TOKEN}  ${process.env.CLIPBRIDGE_TOKEN ? '（CLIPBRIDGE_TOKEN で指定）' : '（tools/clipbridge/.token に保存。作り直すには --new-token）'}`);
  console.log('  ・スマホは PC と同じ Wi-Fi につないでください');
  console.log('  ・PC で開いたページに QR コードが出るので、それを読み取ると早いです');
  console.log('  ・iPhone のショートカットから使う手順は docs/CLIPBRIDGE-IPHONE.md');
  console.log(`  ・PC のクリップボード連携: ${NO_CLIPBOARD ? 'オフ（--no-clipboard）' : 'オン'}`);
  console.log('  ・終了は Ctrl+C');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[clipbridge] ポート ${PORT} は使用中です。CLIPBRIDGE_PORT=8788 のように別のポートを指定してください。`);
  } else {
    console.error('[clipbridge]', err);
  }
  process.exit(1);
});
