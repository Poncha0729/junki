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
import { readFile } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.CLIPBRIDGE_PORT || 8787);
// 起動ごとにランダムな合言葉を作る。同じ Wi-Fi にいる他人が勝手に
// PC のクリップボードへ書き込めないようにするため。固定したいときは
// CLIPBRIDGE_TOKEN を設定する。
const TOKEN = (process.env.CLIPBRIDGE_TOKEN || randomBytes(3).toString('hex')).trim();
const NO_CLIPBOARD = process.argv.includes('--no-clipboard');
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

function tokenOk(req, url) {
  const given = req.headers['x-token'] || url.searchParams.get('t') || '';
  const a = Buffer.from(String(given));
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

function readJson(req) {
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
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
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
<p>ClipBridge は起動するたびに合言葉が変わります。<br>
PC のターミナルに表示されている URL（<code>?t=</code> 付き）を、そのままスマホで開いてください。</p>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      if (!tokenOk(req, url)) return html(res, 403, DENIED_PAGE);
      const page = await readFile(path.join(__dirname, 'index.html'), 'utf8');
      return html(res, 200, page);
    }

    if (!url.pathname.startsWith('/api/')) return json(res, 404, { error: 'not found' });
    if (!tokenOk(req, url)) return json(res, 403, { error: 'bad token' });

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
          urls: lanAddresses().map((ip) => `http://${ip}:${PORT}/?t=${TOKEN}`),
        })}\n\n`,
      );
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' });

    if (url.pathname === '/api/send') {
      const body = await readJson(req);
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
      const body = await readJson(req);
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
  const lan = lanAddresses();
  console.log('');
  console.log('  ClipBridge が起動しました');
  console.log('');
  console.log(`  PC で開く   : http://localhost:${PORT}/?t=${TOKEN}`);
  if (lan.length === 0) {
    console.log('  スマホで開く: （LAN の IPv4 アドレスが見つかりません。Wi-Fi に接続していますか？）');
  } else {
    for (const [i, ip] of lan.entries()) {
      console.log(`  ${i === 0 ? 'スマホで開く' : '            '}: http://${ip}:${PORT}/?t=${TOKEN}`);
    }
  }
  console.log('');
  console.log('  ・スマホは PC と同じ Wi-Fi につないでください');
  console.log('  ・PC で開いたページに QR コードが出るので、それを読み取ると早いです');
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
