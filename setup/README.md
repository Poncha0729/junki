# 新PC セットアップ / 2台＋タブレット運用キット

このディレクトリは、**新しく買ったPCを現在のPCと同じ状態に揃え、2台＋タブレットで
運用できるようにする**ための手順書と自動化スクリプトです。

---

## ⚠️ 最初に読んでください（このキットの前提）

このキットを作った Claude は、**クラウド上の隔離されたコンテナの中で、この Git リポジトリだけ**を
見て動いています。**あなたのPC（現行機・新機）やタブレットには一切アクセスできません。**

そのため、以下は**物理的に実行できません**:

| できないこと | 理由 |
|---|---|
| 新PCへのソフトのインストール | あなたのPCに接続する手段がない |
| 現PCの設定の読み取り・コピー | 同上 |
| 不要ソフトのアンインストール | 同上 |
| タブレットの設定 | 同上 |

代わりに用意したのが、**あなたが新PCで1回コマンドを叩けば同じ状態になる**この自動化キットです。
実行するのはあなたですが、中身（入れるもの・順番・設定値）は全部こちらで決めて書いてあります。

---

## 全体構成（この3台で何をするか）

```
┌──────────────────┐        ┌──────────────────┐
│  現PC（母艦）      │        │  新PC             │
│  AI 作業メイン     │        │  開発・事務作業    │
│  - Claude Code     │        │  - 同じ開発環境    │
│  - 重い生成処理     │        │  - 同じVS Code設定 │
└─────────┬────────┘        └─────────┬────────┘
          │                            │
          │      GitHub（唯一の正）      │
          └────────────┬───────────────┘
                       │  git push / pull
                       ▼
              ┌─────────────────┐
              │  Vercel（公開URL） │
              └─────────┬───────┘
                        │ HTTPS
                        ▼
              ┌─────────────────┐
              │ タブレット（外出先） │
              │ 物件・駅エリアを閲覧 │
              └─────────────────┘
```

**設計の要点**

1. **コードの正は GitHub 1か所だけ。** PC間でフォルダを直接同期しない
   （node_modules や .next をクラウド同期すると必ず壊れます → [SYNC.md](sync/SYNC.md)）。
2. **外出先のタブレットは Vercel の公開URLを見る。** 自宅LANの `localhost:3000` は
   外からは届きません → [TABLET.md](tablet/TABLET.md)。
3. **現PCはAIメイン、新PCは開発。** どちらでも同じコマンドが動くよう環境を揃えます。

---

## 手順

### STEP 0 ── 現PC（今使っているPC）でやること

新PCに持っていく必要があるものを確認します。所要 5分。

1. このリポジトリに未 push の変更がないか確認する
   ```bash
   git status
   git push
   ```
2. `.env` / `.env.local` があるかを確認する（あれば**手でコピー**します。Git には乗りません）
   ```bash
   ls -a | grep env
   ```
3. VS Code の設定を GitHub アカウントに同期しておく
   `VS Code → 左下の歯車 → Backup and Sync Settings → GitHub でサインイン`

### STEP 1 ── 新PC の初期設定（OSの手順）

OS標準のセットアップを済ませてください（ここだけは画面操作が必要です）。

- Windows: Microsoft アカウントでサインイン → Windows Update を「更新なし」になるまで繰り返す
- macOS: Apple ID でサインイン → システム設定 → 一般 → ソフトウェアアップデート

### STEP 2 ── 自動セットアップの実行 ★ここが本体

新PCで**管理者権限のターミナル**を開いて、OSに合う方を実行します。

<details>
<summary><b>Windows の場合</b></summary>

PowerShell を「管理者として実行」で開き:

```powershell
# 1) スクリプトの実行を一時的に許可
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# 2) リポジトリを取得（git が無ければスクリプトが先に入れます）
winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
git clone https://github.com/Poncha0729/junki.git $HOME\dev\junki
cd $HOME\dev\junki

# 3) セットアップ実行
.\setup\new-pc\setup-windows.ps1
```
</details>

<details>
<summary><b>macOS の場合</b></summary>

ターミナルを開き:

```bash
# 1) リポジトリを取得（git が無ければ Xcode CLT の導入を促されます）
mkdir -p ~/dev && git clone https://github.com/Poncha0729/junki.git ~/dev/junki
cd ~/dev/junki

# 2) セットアップ実行
bash setup/new-pc/setup-macos.sh
```
</details>

スクリプトがやること（両OS共通）:

- パッケージマネージャ（winget / Homebrew）の確認
- Git, Node.js 22 LTS, VS Code, ブラウザ, Claude デスクトップ等のインストール
- `git config`（ユーザー名・メール・改行コード・既定ブランチ）
- VS Code 拡張機能の一括インストール（[dotfiles/vscode-extensions.txt](dotfiles/vscode-extensions.txt)）
- このプロジェクトの `npm install`
- タブレットからLAN経由で見るためのファイアウォール穴あけ（任意・確認あり）

**既に入っているものはスキップします**（何度実行しても壊れません）。

### STEP 3 ── 検証

```bash
# Windows
.\setup\new-pc\verify-windows.ps1

# macOS
bash setup/new-pc/verify-macos.sh
```

すべて `OK` になれば完了です。仕上げに、プロジェクトが動くことを確認します:

```bash
npm run verify   # 型チェック + Lint + ビルド
npm run dev      # http://localhost:3000
```

### STEP 4 ── 2台の同期設定

→ **[sync/SYNC.md](sync/SYNC.md)** を参照。
何を GitHub で同期し、何を手でコピーし、**何を絶対にクラウド同期してはいけないか**を書いてあります。

### STEP 5 ── 外出先のタブレットから物件を見られるようにする

→ **[tablet/TABLET.md](tablet/TABLET.md)** を参照。
Vercel への公開とタブレットのホーム画面登録まで。

### STEP 6 ── 不要ソフトの整理

→ **[cleanup/CLEANUP.md](cleanup/CLEANUP.md)** を参照。
**既定は「表示するだけ」で何も消しません。** 一覧を見て、消すものをあなたが選びます。

---

## ✋ あなたにしかできないこと（Claude側では代行不可）

| # | 作業 | 場所 |
|---|---|---|
| 1 | OS初期設定・Windows Update / macOS アップデート | 新PC |
| 2 | 各種アカウントへのサインイン（Microsoft/Apple/Google/GitHub/Anthropic） | 新PC |
| 3 | `.env` / `.env.local` など秘密情報の移送 | 現PC → 新PC |
| 4 | Vercel でのデプロイ承認（GitHub 連携の許可） | ブラウザ |
| 5 | 不要ソフトの最終的な削除判断 | 新PC |
| 6 | タブレットのホーム画面登録 | タブレット |

---

## ドキュメント一覧

| ファイル | 内容 |
|---|---|
| [new-pc/setup-windows.ps1](new-pc/setup-windows.ps1) | Windows 用 自動セットアップ |
| [new-pc/setup-macos.sh](new-pc/setup-macos.sh) | macOS 用 自動セットアップ |
| [new-pc/verify-windows.ps1](new-pc/verify-windows.ps1) | Windows 用 セットアップ検証 |
| [new-pc/verify-macos.sh](new-pc/verify-macos.sh) | macOS 用 セットアップ検証 |
| [sync/SYNC.md](sync/SYNC.md) | 2台運用の同期設計 |
| [tablet/TABLET.md](tablet/TABLET.md) | 外出先タブレットからの閲覧 |
| [cleanup/CLEANUP.md](cleanup/CLEANUP.md) | 不要ソフト整理の手順 |
| [cleanup/cleanup-windows.ps1](cleanup/cleanup-windows.ps1) | 導入済みソフトの棚卸し（既定=表示のみ） |
| [dotfiles/](dotfiles/) | VS Code 設定・拡張機能・git 設定 |
| [`../CLAUDE.md`](../CLAUDE.md) | Claude Code がこのリポジトリで守る前提（2台で共有） |
| [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml) | push のたびに型チェック・Lint・ビルドを自動実行 |
