# 2台運用の同期設計（コード編）

現PC（据え置き）と新PC（AIメイン・持ち出し）を、**壊さずに**同じ状態で使うための取り決めです。

> **このページはコード（Git リポジトリ）の同期についてです。**
> 書類・写真・アカウントの同期は
> **[FILES-AND-ACCOUNTS.md](FILES-AND-ACCOUNTS.md)** を参照してください。

---

## 1. 何をどこで同期するか

| 対象 | 同期手段 | 理由 |
|---|---|---|
| **ソースコード** | **GitHub（この repo）** | 履歴が残り、衝突を検知できる唯一の方法 |
| VS Code の個人設定（テーマ・キーバインド） | VS Code **Settings Sync**（GitHubアカウント） | 純正機能。自動で双方向 |
| VS Code のプロジェクト設定・推奨拡張 | **この repo の `.vscode/`** | どちらのPCで開いても同じ整形・同じ拡張になる |
| git の設定 | `setup/dotfiles/gitconfig.example` | セットアップスクリプトが自動適用 |
| ブラウザのタブ・ブックマーク・パスワード | Chrome の**プロファイル同期** | Googleアカウントでログインするだけ |
| **`.env` / APIキー** | **手動コピー（1回だけ）** | Git に乗せてはいけない。下記 §4 参照 |
| 写真・PDF・契約書など | OneDrive / iCloud Drive / Google Drive | コードとは別フォルダに置く |

---

## 2. ⚠️ これだけは絶対にやらないでください

### ❌ リポジトリのフォルダをクラウド同期の中に置く

`OneDrive\dev\junki` や `iCloud Drive/dev/junki` のような配置は**必ず壊れます**。

理由:

- `node_modules` は**数万ファイル**あり、同期クライアントが延々とスキャンして CPU とバッテリーを食い尽くす
- `.next`（ビルド生成物）は毎回中身が入れ替わるので、同期の衝突ファイル（`junki-競合コピー.js` 等）が量産される
- `.git` の内部ファイルが**半端に同期されるとリポジトリが破損**し、履歴ごと失われることがある

**正しい置き場所:**

| OS | パス |
|---|---|
| Windows | `C:\Users\<あなた>\dev\junki` |
| macOS | `~/dev/junki` |

クラウド同期フォルダの**外側**です。コードの同期は GitHub が担当します。

### ❌ 2台で同じブランチを同時に編集して放置する

片方で作業したら**必ず push**してから、もう片方で**必ず pull**。これを守るだけで衝突はほぼ起きません。

---

## 3. 日々の運用フロー

### 役割分担（推奨）

| | 現PC（据え置き） | 新PC = X1 Yoga |
|---|---|---|
| 主な用途 | サブ。据え置きでの作業・確認 | **AIメイン**（Claude、生成・調査）＋持ち出し |
| 常駐 | ブラウザ / VS Code | Claude デスクトップ / VS Code |
| 重い処理 | 避ける | **こちらに寄せる**（32GB） |

AI にコードを書かせるのは新PCに寄せ、**成果物は必ず GitHub 経由**で現PCに渡します。
「現PCの画面で直接コピペ」は履歴が残らないので避けてください。

> **AIメイン機が持ち出し機でもある**点に注意してください。
> AI に投げた内容はこのPCに残り、そのPCを外に持ち出します。
> ディスク暗号化と自動ロックは必須です
> （[../new-pc/THINKPAD-X1-YOGA.md](../new-pc/THINKPAD-X1-YOGA.md)）。

### 作業を始めるとき（どちらのPCでも）

```bash
cd ~/dev/junki        # Windows は cd $HOME\dev\junki
git pull              # ← 最初に必ず
npm install           # package.json が変わっていたときだけ効く（速い）
npm run dev
```

### 作業を終えるとき

```bash
npm run verify        # 型チェック + Lint + ビルド。壊れたまま push しない
git add -A
git commit -m "何をしたか"
git push
```

`npm run verify` が通らないうちは push しない、を徹底すると、
**もう片方のPCで「なぜか動かない」が起きません。**

### 「向こうのPCで作業したのを忘れた」を防ぐ

`git config --global pull.rebase true` を入れてあるので、
pull したときに履歴が枝分かれせず一本に繋がります（セットアップ済み）。

---

## 4. `.env` など秘密情報の移し方

`.env` / `.env.local` は `.gitignore` 済みで、**GitHub には絶対に乗りません**（正しい挙動です）。
新PCへは1回だけ手で移します。

**やってよい方法**

1. **パスワードマネージャのセキュアノート**（1Password / Bitwarden など）に貼って、新PCで取り出す ← 推奨
2. USBメモリで直接コピー
3. 各サービスの管理画面（Vercel等）で**新PC用に鍵を再発行**する ← 最も安全

**やってはいけない方法**

- 自分宛てのメールやチャットに貼る（履歴が半永久的に残り、検索で掘り出されます）
- スクリーンショットで撮ってクラウドアルバムに入れる

移し終えたら、新PCで中身が読めることだけ確認してください:

```bash
# Windows
type .env.local
# macOS
cat .env.local
```

---

## 5. 衝突（コンフリクト）が起きたとき

```bash
git pull
# → CONFLICT (content): Merge conflict in src/....tsx と出たら
```

1. VS Code で該当ファイルを開く（衝突箇所に色が付きます）
2. 「現在の変更を取り込む / 入力側の変更を取り込む / 両方」から選ぶ
3. 解決したら:

```bash
git add -A
git rebase --continue   # pull.rebase = true のため rebase
npm run verify          # 解決後にビルドが通るか必ず確認
git push
```

**分からなくなったら、慌てず作業中の内容を退避してやり直せます:**

```bash
git rebase --abort      # rebase を中止して、pull 前の状態に戻す
```

---

## 6. チェックリスト

新PCで一通り終わったら、以下が全部 ✅ になることを確認してください。

- [ ] `~/dev/junki`（クラウド同期フォルダの外）にリポジトリがある
- [ ] `git pull` / `git push` が両方のPCで通る
- [ ] `npm run verify` が両方のPCで通る
- [ ] VS Code で開くと「推奨拡張をインストールしますか」が出る（または導入済み）
- [ ] VS Code の Settings Sync が両方でオンになっている
- [ ] Chrome が両方のPCで同じ Google アカウントにログインしている
- [ ] `.env.local` が必要なら新PCにも置いてある
- [ ] 現PCに未 push の変更が残っていない（`git status` がきれい）
