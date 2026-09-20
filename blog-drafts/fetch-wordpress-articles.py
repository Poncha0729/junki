#!/usr/bin/env python3
"""
既存記事を WordPress REST API で取得し、テンプレート解析用に保存する。

これが動くようになると、Claude が
「普段の冒頭文」「LINE誘導の文面」「ボックスのCSS」「アフィリエイトタグ」
を実物から読み取って、新しい記事を同じ型で書けるようになる。

■ 環境変数（post-to-wordpress.py と同じ）
  WP_URL / WP_USER / WP_APP_PASSWORD

■ 使い方
  python3 fetch-wordpress-articles.py                # 最新10件
  python3 fetch-wordpress-articles.py --ids 7014     # ID指定
  python3 fetch-wordpress-articles.py --search 住宅ローン --limit 5
"""
import argparse
import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

OUT_DIR = "fetched-articles"


def die(msg):
    print(f"\n[エラー] {msg}\n", file=sys.stderr)
    sys.exit(1)


def api(site, token, path, params=None):
    url = f"{site}/wp-json/wp/v2/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Authorization": f"Basic {token}",
        "User-Agent": "poncha-blog-fetcher/1.0",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        if e.code == 401:
            die("認証に失敗(401)。WP_USER とアプリケーションパスワードを確認してください。")
        die(f"HTTP {e.code} — {url}\n{body}")
    except urllib.error.URLError as e:
        die(f"接続できません: {e.reason}\n"
            "（Claudeのクラウド環境から実行している場合、ネットワーク許可が必要です）")


def analyze(html):
    """テンプレート要素を抽出する"""
    found = {}
    # インラインstyleの色
    colors = re.findall(r'#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b', html)
    found["使われている色"] = sorted(set(c.lower() for c in colors))
    # CSSクラス
    classes = re.findall(r'class="([^"]+)"', html)
    cls = sorted({c for group in classes for c in group.split()})
    found["CSSクラス"] = [c for c in cls if not c.startswith("wp-block-")]
    found["Gutenbergブロック"] = sorted(set(re.findall(r'<!-- wp:([a-z0-9/-]+)', html)))
    # ショートコード
    found["ショートコード"] = sorted(set(re.findall(r'\[([a-z0-9_-]+)[\s\]]', html)))
    # 広告/アフィリエイトらしきもの
    ads = re.findall(r'<a[^>]+href="([^"]*(?:a8\.net|rentracks|valuecommerce|afi-b|'
                     r'accesstrade|linksynergy|moshimo|amazon|rakuten|px\.a8)[^"]*)"', html, re.I)
    found["アフィリエイトらしきリンク"] = sorted(set(ads))[:10]
    # LINE
    found["LINEらしきリンク"] = sorted(set(
        re.findall(r'href="([^"]*(?:line\.me|lin\.ee)[^"]*)"', html, re.I)))
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", nargs="*", type=int, help="取得する記事ID")
    ap.add_argument("--search", help="キーワード検索")
    ap.add_argument("--limit", type=int, default=10)
    args = ap.parse_args()

    site = os.environ.get("WP_URL", "").rstrip("/")
    user = os.environ.get("WP_USER", "")
    pw = os.environ.get("WP_APP_PASSWORD", "")
    miss = [n for n, v in (("WP_URL", site), ("WP_USER", user),
                           ("WP_APP_PASSWORD", pw)) if not v]
    if miss:
        die("環境変数が未設定: " + ", ".join(miss))

    token = base64.b64encode(f"{user}:{pw}".encode()).decode("ascii")

    if args.ids:
        posts = [api(site, token, f"posts/{i}", {"context": "edit"}) for i in args.ids]
    else:
        p = {"per_page": args.limit, "context": "edit", "status": "publish"}
        if args.search:
            p["search"] = args.search
        posts = api(site, token, "posts", p)

    os.makedirs(OUT_DIR, exist_ok=True)
    summary = []

    for post in posts:
        pid = post.get("id")
        title = (post.get("title") or {}).get("raw") or ""
        # context=edit なら raw（エディタと同じ生HTML）が取れる
        content = (post.get("content") or {}).get("raw") \
            or (post.get("content") or {}).get("rendered") or ""

        path = os.path.join(OUT_DIR, f"{pid}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        info = analyze(content)
        summary.append({
            "id": pid, "title": title, "link": post.get("link"),
            "date": post.get("date"), "file": path,
            "chars": len(content), **info,
        })
        print(f"✔ {pid}: {title[:50]}  ({len(content):,} bytes) → {path}")

    with open(os.path.join(OUT_DIR, "_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n{len(posts)}件を {OUT_DIR}/ に保存しました。")
    print(f"解析結果: {OUT_DIR}/_summary.json")
    print("\nこのフォルダを Claude に渡せば、テンプレートを再現できます。")


if __name__ == "__main__":
    main()
