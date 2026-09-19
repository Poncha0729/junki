# 新PC（Windows）セットアップ / 2台＋タブレット運用キット

**対象機種: ThinkPad X1 Yoga Gen 7（32GB / 1TB）**

新しく買った Windows PC を現在のPCと同じ状態に揃え、
**現PC（AIメイン）＋新PC＋外出先のタブレット**で運用するための手順書と自動化スクリプトです。

---

## ⚠️ 最初に読んでください

このキットを作った Claude は、**クラウド上の隔離されたコンテナの中で、この Git リポジトリだけ**を
見て動いています。**あなたのPC（現行機・新機）やタブレットには一切アクセスできません。**

そのため、ソフトのインストール・設定のコピー・不要ソフトの削除は、**こちらでは実行できません。**
代わりに用意したのが、**あなたが新PCで1回コマンドを叩けば同じ状態になる**この自動化キットです。
実行するのはあなたですが、中身（入れるもの・順番・設定値）は全部こちらで決めて書いてあります。

---

## 全体構成

```
┌──────────────────┐        ┌──────────────────┐
│  現PC（母艦）      │        │  新PC（Windows）   │
│  AI 作業メイン     │        │  日常作業・物件検討 │
│  - Claude          │        │  - Chrome / VS Code│
│  - 重い生成処理     │        │  - OneDrive        │
└─────────┬────────┘        └─────────┬────────┘
          │                            │
          │  ① コード → GitHub          │
          │  ② ファイル → OneDrive      │
          │  ③ ブラウザ → Google 同期    │
          └────────────┬───────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ タブレット（外出先） │
              │ 物件サイトで検索    │
              │ Chrome 同期でPCと往復│
              └─────────────────┘
```

**設計の要点**

1. **コードの正は GitHub 1か所だけ。** リポジトリを OneDrive の中に置かない
   （`node_modules` と `.git` が壊れます → [sync/SYNC.md](sync/SYNC.md)）
2. **ファイルは OneDrive、ブラウザは Google アカウント。** 役割を分ける
   → [sync/FILES-AND-ACCOUNTS.md](sync/FILES-AND-ACCOUNTS.md)
3. **外出先のタブレットは Chrome 同期でPCとつながる**
   → [tablet/PROPERTY-SEARCH.md](tablet/PROPERTY-SEARCH.md)

---

## 手順

### STEP 0 ── 現PC（今使っているPC）でやること

所要 5分。新PCに持っていくものを確認します。

1. 未 push の変更がないか確認する
   ```bash
   git status
   git push
   ```
2. `.env` / `.env.local` があるか確認する（あれば**手でコピー**します。Git には乗りません）
3. VS Code の設定を GitHub アカウントに同期しておく
   `VS Code → 左下の歯車 → Backup and Sync Settings → GitHub でサインイン`
4. Chrome が Google アカウントでログイン済みか確認する

### STEP 1 ── 新PC の初期設定

ここだけは画面操作が必要です。

1. Microsoft アカウントでサインイン
2. **Windows Update を「更新なし」になるまで繰り返す**（再起動を挟んで数回かかります）
3. Wi-Fi に接続

### STEP 2 ── 自動セットアップの実行 ★ここが本体

**PowerShell を「管理者として実行」**で開いて、上から順に貼り付けてください。

```powershell
# 1) このセッション中だけスクリプト実行を許可
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# 2) Git を入れる
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements

# 3) PowerShell を開き直してから、リポジトリを取得
git clone https://github.com/Poncha0729/junki.git $HOME\dev\junki
cd $HOME\dev\junki
git checkout claude/new-pc-setup-sync-8iilyg

# 4) セットアップ実行
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\setup\new-pc\setup-windows.ps1
```

> **`$HOME\dev\junki` に置いてください。** OneDrive の中に置くとリポジトリが壊れます。

スクリプトがやること:

| | 内容 |
|---|---|
| 1 | winget の確認 |
| 2 | Git / Node.js 22 / VS Code / PowerShell 7 / Windows Terminal / Chrome / Claude デスクトップ / PowerToys / 7-Zip を導入 |
| 3 | `git config`（名前・メール・改行コード・rebase・日本語ファイル名） |
| 4 | VS Code 拡張機能の一括インストール |
| 5 | このプロジェクトの `npm install` |
| 6 | （任意）タブレットからLAN経由で見るためのポート開放 |

**既に入っているものはスキップします。**何度実行しても壊れません。**何も削除しません。**

不要なアプリがあれば、`setup\new-pc\setup-windows.ps1` の `$Packages` から行を消すか
先頭に `#` を付けてください。

### STEP 3 ── 検証

```powershell
.\setup\new-pc\verify-windows.ps1
```

すべて `[OK]` になれば完了です。仕上げに:

```powershell
npm run verify   # 型チェック + Lint + ビルド
npm run dev      # http://localhost:3000
```

### STEP 3.5 ── 機種固有の設定（ThinkPad X1 Yoga Gen 7）

→ **[new-pc/THINKPAD-X1-YOGA.md](new-pc/THINKPAD-X1-YOGA.md)**

汎用のセットアップでは触れていない、この機種だから必要な設定です。

- **持ち歩く機体なのでディスクの暗号化は必須**（回復キーの保存を忘れずに）
- Windows Hello は顔と指紋を**両方**登録する（外では指紋が失敗しやすい）
- **Lenovo Vantage は消さない**（BIOS・ドライバ更新の唯一の経路）
- ペンとタッチを物件資料の書き込みに使う
- 32GB あるので、AI作業を新PC側でやる選択肢もある

### STEP 4 ── 2台の同期設定

- コードの同期 → **[sync/SYNC.md](sync/SYNC.md)**
- ファイルとアカウントの同期 → **[sync/FILES-AND-ACCOUNTS.md](sync/FILES-AND-ACCOUNTS.md)**

OneDrive・Chrome・VS Code Settings Sync・GitHub の**どれが何を運ぶか**を整理してあります。

### STEP 5 ── タブレットで物件を探せるようにする

→ **[tablet/PROPERTY-SEARCH.md](tablet/PROPERTY-SEARCH.md)**

要点は3つだけです。

1. 物件サイトで**必ずアカウントを作ってログイン**する（しないとお気に入りが端末内保存）
2. タブレットとPCで**同じ Chrome アカウント**にする（iPad なら Chrome を入れる）
3. **横断メモを1か所**に決める

### STEP 6 ── 不要ソフトの整理

→ **[cleanup/CLEANUP.md](cleanup/CLEANUP.md)**

```powershell
# まず一覧を見る（何も消えません）
.\setup\cleanup\cleanup-windows.ps1

# 見たうえで、1件ずつ確認しながら消す
.\setup\cleanup\cleanup-windows.ps1 -Remove
```

**既定は表示のみです。** ランタイムやドライバなど消してはいけないものは除外してあります。

---

## ✋ あなたにしかできないこと

| # | 作業 | 場所 |
|---|---|---|
| 1 | Windows の初期設定・Windows Update | 新PC |
| 2 | 各アカウントへのサインイン（Microsoft / Google / GitHub / Anthropic） | 新PC |
| 3 | `.env` など秘密情報の移送 | 現PC → 新PC |
| 4 | 物件サイトのアカウント作成 | ブラウザ |
| 5 | 不要ソフトの最終的な削除判断 | 新PC |
| 6 | タブレットへの Chrome 導入とログイン | タブレット |

---

## ドキュメント一覧

| ファイル | 内容 |
|---|---|
| [new-pc/setup-windows.ps1](new-pc/setup-windows.ps1) | **Windows 用 自動セットアップ** |
| [new-pc/verify-windows.ps1](new-pc/verify-windows.ps1) | **Windows 用 セットアップ検証** |
| [new-pc/THINKPAD-X1-YOGA.md](new-pc/THINKPAD-X1-YOGA.md) | **機種固有の設定**（暗号化・Hello・Vantage・ペン） |
| [sync/SYNC.md](sync/SYNC.md) | コードの同期（GitHub 運用） |
| [sync/FILES-AND-ACCOUNTS.md](sync/FILES-AND-ACCOUNTS.md) | ファイルとアカウントの同期（OneDrive・Chrome ほか） |
| [tablet/PROPERTY-SEARCH.md](tablet/PROPERTY-SEARCH.md) | **外出先のタブレットで物件を探す** |
| [tablet/TABLET.md](tablet/TABLET.md) | （参考）このリポジトリのアプリをタブレットで見る場合 |
| [cleanup/CLEANUP.md](cleanup/CLEANUP.md) | 不要ソフト整理の手順 |
| [cleanup/cleanup-windows.ps1](cleanup/cleanup-windows.ps1) | 導入済みソフトの棚卸し（既定=表示のみ） |
| [dotfiles/](dotfiles/) | VS Code 拡張機能リスト・git 設定 |
| [`../CLAUDE.md`](../CLAUDE.md) | Claude Code がこのリポジトリで守る前提（2台で共有） |

---

## macOS について

新PCは Windows とのことなので、上の手順は Windows 前提で書いてあります。
macOS 用のスクリプト（[new-pc/setup-macos.sh](new-pc/setup-macos.sh) /
[new-pc/verify-macos.sh](new-pc/verify-macos.sh) /
[cleanup/cleanup-macos.sh](cleanup/cleanup-macos.sh)）も残してありますが、
**今回は使いません。** 将来 Mac を足す場合はそちらを実行してください。
