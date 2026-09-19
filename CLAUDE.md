# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業するときの前提をまとめたものです。
現PC・新PC のどちらで Claude を動かしても同じ判断になるよう、両方のPCで共有されます。

## プロジェクト概要

**EKICHO** — 東京の駅ごとに、雰囲気・家賃相場・出口情報・周辺スポットをまとめて見られる Web アプリ。
自宅ではPCから、外出先ではタブレットから同じ内容を参照する想定。

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
  page.tsx          ホーム
  stations/[slug]/  駅詳細
src/components/     UI コンポーネント
src/lib/stations.ts 駅データ（現状はサンプル）
src/locales/        ja.json / en.json
src/i18n/request.ts next-intl 設定
setup/              新PCセットアップ・2台運用のキット
legacy/             使っていない旧ポートフォリオ雛形。ビルド対象外
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
外出先のタブレットでも同じURLのまま使えるようにするための構成なので、
`/ja/...` `/en/...` のようなパス分割を導入する場合は
`setup/tablet/TABLET.md` に書いたブックマーク運用も合わせて見直すこと。

### 5. `legacy/` は触らない

`tsconfig.json` と `.eslintrc.json` の対象外。退避してあるだけなので、
ここを編集しても本番には影響しない。

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

- `src/lib/stations.ts` の駅データは**サンプル**。実データではない。
- 駅写真（`public/images/stations/...`）が未配置。写真枠は空で表示される。
- `src/components/MapShowcase.tsx` の地図は未実装（Mapbox を入れる枠だけがある）。
- `StationPage.tsx` は `<img>` を使っており `next/image` の警告が2件出る（ビルドは通る）。
