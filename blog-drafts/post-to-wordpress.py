#!/usr/bin/env python3
"""
下書きHTMLを WordPress に「下書き」として投稿するスクリプト。

Claude の実行環境からは ponchablog.com に接続できないため、
ご自身のPCで1回実行していただくためのものです。

■ 事前準備（初回のみ）
  1. WordPress 管理画面 → ユーザー → プロフィール
  2. 一番下の「アプリケーションパスワード」で新規発行
     （名前は "claude-post" など何でもOK）
  3. 表示された "xxxx xxxx xxxx xxxx" を控える
     ※ ログインパスワードとは別物です。後から失効させられます。

■ 使い方（Mac / Linux）
  export WP_URL="https://ponchablog.com"
  export WP_USER="あなたのログインID"
  export WP_APP_PASSWORD="xxxx xxxx xxxx xxxx"
  python3 post-to-wordpress.py 2026-09-20-housing-loan-3numbers.html

■ 使い方（Windows PowerShell）
  $env:WP_URL="https://ponchablog.com"
  $env:WP_USER="あなたのログインID"
  $env:WP_APP_PASSWORD="xxxx xxxx xxxx xxxx"
  python post-to-wordpress.py 2026-09-20-housing-loan-3numbers.html

必ず「下書き(draft)」で作成します。いきなり公開はしません。
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

TITLE = ("【住宅ローン】金利0.1%・期間1年・借入100万円で返済はいくら変わる？"
         "｜数字が苦手な方へ早見表で解説 Ponchablog 建築・不動産相談所")


def die(msg):
    print(f"\n[エラー] {msg}\n", file=sys.stderr)
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        die("記事HTMLのパスを指定してください。\n"
            "  例) python3 post-to-wordpress.py 2026-09-20-housing-loan-3numbers.html")

    html_path = sys.argv[1]
    if not os.path.exists(html_path):
        die(f"ファイルが見つかりません: {html_path}")

    site = os.environ.get("WP_URL", "").rstrip("/")
    user = os.environ.get("WP_USER", "")
    app_pw = os.environ.get("WP_APP_PASSWORD", "")

    missing = [n for n, v in
               (("WP_URL", site), ("WP_USER", user), ("WP_APP_PASSWORD", app_pw)) if not v]
    if missing:
        die("環境変数が未設定です: " + ", ".join(missing) +
            "\nスクリプト冒頭のコメントに設定方法があります。")

    if not site.startswith("https://"):
        die("WP_URL は https:// で始めてください（パスワードが平文で流れるのを防ぐため）。")

    with open(html_path, encoding="utf-8") as f:
        content = f.read()

    # 差し替え漏れの検知
    leftovers = []
    if "【要差し替え" in content:
        leftovers.append("【要差し替え】の目印")
    if "【ここに公式LINEのURL" in content:
        leftovers.append("公式LINEのURL")
    if 'href="#【URL】"' in content:
        leftovers.append("関連記事のURL")
    if leftovers:
        print("\n⚠️  差し替えがまだ残っています: " + " / ".join(leftovers))
        print("   （下書きなので投稿しても問題ありませんが、公開前に必ず直してください）")
        if input("\n   このまま下書きとして投稿しますか？ [y/N]: ").strip().lower() != "y":
            print("中止しました。")
            return

    payload = json.dumps({
        "title": TITLE,
        "content": content,
        "status": "draft",          # ← 必ず下書き。公開はしません
        "comment_status": "closed",
    }).encode("utf-8")

    token = base64.b64encode(f"{user}:{app_pw}".encode("utf-8")).decode("ascii")
    req = urllib.request.Request(
        f"{site}/wp-json/wp/v2/posts",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "poncha-blog-poster/1.0",
        },
    )

    print(f"\n投稿先 : {site}")
    print(f"記事   : {html_path} ({len(content):,} bytes)")
    print("状態   : 下書き(draft)\n送信中...")

    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            data = json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:600]
        if e.code == 401:
            die("認証に失敗しました(401)。WP_USER とアプリケーションパスワードをご確認ください。\n"
                "  ※ ログインパスワードではなく、専用に発行したアプリケーションパスワードです。")
        if e.code == 403:
            die(f"権限がありません(403)。投稿権限のあるユーザーかご確認ください。\n{body}")
        die(f"HTTP {e.code}\n{body}")
    except urllib.error.URLError as e:
        die(f"接続できませんでした: {e.reason}")

    print("\n✅ 下書きを作成しました")
    print(f"   記事ID : {data.get('id')}")
    print(f"   編集   : {site}/wp-admin/post.php?post={data.get('id')}&action=edit")
    print("\n   カテゴリ（不動産記事）とアイキャッチは、管理画面で設定してください。")


if __name__ == "__main__":
    main()
