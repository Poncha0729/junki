# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業するときの前提をまとめたものです。
現PC・新PC のどちらで Claude を動かしても同じ判断になるよう、両方のPCで共有されます。

## プロジェクト概要

**EKICHO** — 東京の駅ごとに、雰囲気・家賃相場・出口情報・周辺スポットをまとめて見られる Web アプリ。
自宅でも外出先でも、同じ内容をブラウザから参照する想定。

Next.js 14（App Router）/ TypeScript / Tailwind CSS / React 18 / next-intl。

## コマンド

```bash
npm run dev        # 開発サーバ http://localhost:3000
npm run dev:lan    # 同一Wi-Fi内の端末からも見える形で起動（タブレット確認用）
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
npm run verify     # typecheck → lint → build。★push 前に必ず実行する
npm run build      # 本番ビルド
```

**パッケージマネージャは npm に固定。** `package-lock.json` を採用しているため、
pnpm / yarn を混ぜるとロックファイルが分裂して2台で依存関係がずれる。

Node.js は 20 以上（`.nvmrc` は 22）。

## ディレクトリ構成

```
src/app/            App Router のルート。ここが唯一のルーターである
  layout.tsx        globals.css の読み込み + NextIntlClientProvider
  page.tsx          ホーム（駅の検索・一覧）
  manifest.ts       Web アプリマニフェスト
  stations/[slug]/  駅詳細
src/components/     StationPage / RentChart / StationMap / StationImage
src/lib/stations.ts 駅データ + 検索ロジック
src/locales/        ja.json / en.json
src/i18n/request.ts next-intl 設定
docs/STATION-DATA.md 駅データの増やし方
docs/founders-playbook.md 経営者の思考と戦略（読み物。アプリのビルドとは無関係）
scripts/            アイコン生成など
setup/              新PCセットアップ・2台運用のキット
legacy/             使っていない旧コード。ビルド対象外
```

## このリポジトリ特有の注意点

### 1. `app/` をリポジトリルートに作らない

Next.js は `app/` と `src/app/` が同時に存在すると **`app/` を優先**し、
`src/app/` 配下が丸ごと無視される。過去にこれで駅サイトが一切表示されない状態になっていた。
ルーターは `src/app/` のみ。ルートに `app/` を作らないこと。

### 2. hooks / framer-motion を使うコンポーネントには `'use client'` が必須

App Router の既定はサーバーコンポーネント。
`useState` / `useEffect` / `useRef` / `useTranslations` / `framer-motion` の
`motion.*` を使うファイルは、先頭に `'use client'` を書く。
忘れるとビルドではなく**実行時**に落ちるので気付きにくい。

### 3. 翻訳文字列は ICU 構文（波括弧は1つ）

`src/locales/*.json` のプレースホルダは `{date}` と書く。`{{date}}` は不正。
使う側は `t('lastUpdated', { date: ... })`。

### 4. ロケールは URL で分けていない

既定は日本語。`NEXT_LOCALE` クッキーが `en` のときだけ英語。
外出先でも同じURLのまま使えるようにするための構成。
`/ja/...` `/en/...` のようなパス分割を導入する場合は、
ブックマークが変わる点に注意すること。

### 5. `legacy/` は触らない

`tsconfig.json` と `.eslintrc.json` の対象外。退避してあるだけなので、
ここを編集しても本番には影響しない。

### 6. `.ps1` は必ず UTF-8 **BOM付き** で保存する

`setup/` 配下の PowerShell スクリプトには日本語コメントが入っている。
Windows PowerShell 5.1 は **BOM の無い `.ps1` を Shift-JIS として読む**ため、
日本語が文字化けする。そのとき化けた文字列の中に `<#` ができると
ブロックコメントが入れ子になり、**ファイル全体がコメント扱いになる。**

この壊れ方は「実行しても出力もエラーも一切出ない」という形で現れ、
原因に辿り着きにくい。実際に一度これで詰まっている。

新しく `.ps1` を追加するとき、または既存のものを書き換えるときは、
BOM が残っているか必ず確認すること。

```bash
head -c 3 setup/new-pc/setup-windows.ps1 | od -An -tx1   # efbbbf なら OK
```

`.gitattributes` で `*.ps1 text eol=crlf` も指定してある（Windows で実行するため）。
`*.sh` は `eol=lf`。CRLF だとシェルスクリプトが動かない。

### 7. 家賃など変動する数字は、出典が取れたものだけ載せる

`Station.avgRent` は optional。**出典が確認できない場合は undefined のままにし、
推測値で埋めないこと。** 埋めると画面上は本物の相場に見えてしまい、
物件選びの判断を誤らせる。未登録は UI 側が「まだ登録されていません」と
明示して調べるリンクを出すようになっている。
`avgRent` を入れるときは `rentSource`（出典名・URL・取得日）を必ずセットにする。

同じ理由で、周辺店舗の具体名や徒歩分数を出典なしに書かない。
周辺の様子は `StationMap`（OpenStreetMap 埋め込み、APIキー不要）で見られる。

詳しい手順は `docs/STATION-DATA.md`。

## 作業の流れ（2台運用のため）

```bash
git pull           # 作業前に必ず
# ... 編集 ...
npm run verify     # 通らないうちは push しない
git add -A && git commit -m "..." && git push
```

`pull.rebase = true` を設定済み（`setup/dotfiles/gitconfig.example`）。
**壊れた状態を push すると、もう片方のPCで原因不明の不具合として現れる**ため、
`npm run verify` は省略しない。

## 既知の未対応事項

- 収録は10駅のみ。`avgRent` が入っているのは渋谷だけで、その値も元からあった
  サンプル（`rentSource` にその旨を明記済み）。
- 駅写真（`public/images/stations/<slug>/`）が未配置。`StationImage` が
  代替表示に切り替えるため、壊れた画像は出ない。
- `StationImage` だけは `next/image` ではなく `<img>` を使っている。
  読み込み失敗を `onError` で拾って代替表示へ切り替えるため。
  ESLint はその行だけ disable コメントで抑止している。
