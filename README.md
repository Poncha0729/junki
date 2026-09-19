# EKICHO — 東京の駅エリアガイド

駅ごとの雰囲気・家賃相場・出口情報・周辺スポットをまとめて見られる Web アプリです。
外出先ではタブレットから、自宅では PC から同じ内容を確認できます。

- **Next.js 14（App Router）/ TypeScript / Tailwind CSS / React 18**
- 日本語・英語のバイリンガル対応（`next-intl`）

---

## 🆕 新しいPCでこれから始める方へ

**→ [`setup/README.md`](setup/README.md) を最初に読んでください。**

新PCのセットアップ、現PCとの同期、外出先タブレットからの閲覧、
不要ソフトの整理までを一通りまとめてあります。

---

## 起動手順

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

> **Node.js 20 以上が必要です**（`.nvmrc` は 22 を指定）。
> パッケージマネージャは **npm** を使ってください（`package-lock.json` を採用しています）。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバを起動（http://localhost:3000） |
| `npm run dev:lan` | 同一Wi-Fi内の端末からも見られる形で起動（タブレット確認用） |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番ビルドを起動 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript の型チェック |
| `npm run verify` | **typecheck → lint → build を通しで実行。push 前に必ずこれ** |

## プロジェクト構造

```
src/
  app/
    layout.tsx            # ルートレイアウト（i18n プロバイダ・グローバルCSS）
    page.tsx              # ホーム（駅検索・おすすめ駅）
    globals.css           # Tailwind のエントリポイント
    stations/[slug]/      # 駅ごとの詳細ページ
  components/             # UI コンポーネント
    StationPage.tsx       #   駅詳細の本体
    PinballTable.tsx      #   Matter.js のピンボール（おまけ）
  lib/
    stations.ts           # 駅データ（現状はサンプルデータ）
  locales/
    ja.json / en.json     # 表示文言
  i18n/
    request.ts            # next-intl の設定（既定=日本語）
public/
  images/                 # 駅の写真を置く場所
setup/                    # 新PCセットアップ・2台運用のキット
legacy/                   # 使っていない旧ポートフォリオ雛形（下記参照）
```

## 多言語の切り替え

既定は日本語です。`NEXT_LOCALE` クッキーを `en` にすると英語表示になります
（URL でロケールを分けない構成なので、外出先のタブレットでも同じURLのまま使えます）。
切り替えの仕組みは [`src/i18n/request.ts`](src/i18n/request.ts) にあります。

## デプロイ

Vercel に GitHub 連携でインポートすれば、設定はすべて自動検出されます。
以後は `git push` するだけで公開URLが更新されます。
手順は [`setup/tablet/TABLET.md`](setup/tablet/TABLET.md) を参照してください。

---

## 既知の未対応事項

- **駅データはサンプルです。** `src/lib/stations.ts` の内容は実データではありません。
- **駅の写真が未配置です。** `src/lib/stations.ts` が参照している
  `/images/stations/...` のファイルがまだ無いため、写真枠は空で表示されます。
  `public/images/` に配置すると表示されます。
- **地図は未実装です。** `src/components/MapShowcase.tsx` は Mapbox を入れる
  想定の枠だけがあり、初期化処理はコメントのままです。

## `legacy/` について

`legacy/portfolio/` には、以前この repo のルートに置かれていた
**別プロジェクトのポートフォリオ雛形**（`app/` と `components/`）が入っています。

Next.js は `app/` と `src/app/` が同時に存在すると `app/` を優先するため、
この雛形があると EKICHO 側のページが一切表示されない状態でした。
削除はせず `legacy/` に退避し、ビルドと型チェックの対象から外してあります。
不要だと判断できたらフォルダごと削除して構いません。
