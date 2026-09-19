# EKICHO — 東京の駅エリアガイド

駅ごとの雰囲気・家賃相場・出口情報・周辺スポットをまとめて見られる Web アプリです。
自宅でも外出先でも、同じ内容をブラウザから確認できます。

- **Next.js 14（App Router）/ TypeScript / Tailwind CSS / React 18**
- 日本語・英語のバイリンガル対応（`next-intl`）

---

## 🆕 新しいPCでこれから始める方へ

**→ [`setup/README.md`](setup/README.md) を最初に読んでください。**

新PCのセットアップ、現PCとの同期、物件探しの環境づくり、
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
    page.tsx              # ホーム（駅の検索・一覧）
    manifest.ts           # Web アプリマニフェスト（タブレットのホーム画面用）
    globals.css           # Tailwind のエントリポイント
    stations/[slug]/      # 駅ごとの詳細ページ
  components/
    StationPage.tsx       # 駅詳細の本体
    RentChart.tsx         # 間取り別の家賃比較
    StationMap.tsx        # 駅周辺の地図（OpenStreetMap 埋め込み）
    StationImage.tsx      # 写真が無いときに代替表示へ切り替える画像
  lib/
    stations.ts           # 駅データと検索ロジック
  locales/
    ja.json / en.json     # 表示文言
  i18n/
    request.ts            # next-intl の設定（既定=日本語）
public/
  images/stations/        # 駅の写真を置く場所
  icons/                  # アプリアイコン（生成物）
scripts/
  generate-icons.py       # アイコン生成（標準ライブラリのみ・依存なし）
docs/
  STATION-DATA.md         # 駅データの増やし方
setup/                    # 新PCセットアップ・2台運用のキット
legacy/                   # 使っていない旧コード（下記参照）
```

## 駅データ

駅の情報は [`src/lib/stations.ts`](src/lib/stations.ts) の1ファイルにまとまっています。
ここに駅を追加すると、一覧・検索・詳細ページが自動で増えます。

**家賃相場は出典が確認できたものだけを載せる方針**です。未登録の駅は画面上で
「まだ登録されていません」と表示され、推測値は出しません。
追加の手順は [`docs/STATION-DATA.md`](docs/STATION-DATA.md) を参照してください。

## 地図

駅周辺の地図は OpenStreetMap の埋め込みを使っています。
**APIキーもアカウントも不要**なので、新しいPCでもタブレットでも設定なしで表示されます。

## タブレット対応（PWA）

`src/app/manifest.ts` を持っているため、タブレットで「ホーム画面に追加」すると
アドレスバーのない全画面のアプリとして起動します。アイコンは iPad（apple-touch-icon）と
Android（maskable 含む）の両方に対応したものを `public/icons/` に同梱済みです。

配色や形を変えたい場合:

```bash
python3 scripts/generate-icons.py
```

外部ライブラリを使っていないので、どちらのPCでもそのまま実行できます。

## CI

`.github/workflows/ci.yml` で、push のたびに型チェック・Lint・ビルドが走ります。
2台のPCから交互に push する運用のため、**壊れた状態がもう片方のPCに渡る前に検知する**のが目的です。

## 多言語の切り替え

既定は日本語です。`NEXT_LOCALE` クッキーを `en` にすると英語表示になります
（URL でロケールを分けない構成なので、外出先のタブレットでも同じURLのまま使えます）。
切り替えの仕組みは [`src/i18n/request.ts`](src/i18n/request.ts) にあります。

## デプロイ

Vercel に GitHub 連携でインポートすれば、設定はすべて自動検出されます。
以後は `git push` するだけで公開URLが更新されます。

---

## 既知の未対応事項

- **家賃相場が入っているのは渋谷のみ**で、その値もリポジトリに元から入っていた
  サンプルです（画面上でもその旨を表示しています）。他の9駅は未登録です。
  実データへの差し替え手順は [`docs/STATION-DATA.md`](docs/STATION-DATA.md) にあります。
- **駅の写真が未配置です。** `public/images/stations/<slug>/` に画像を置き、
  `stations.ts` の `photos` に追記すると表示されます。
  それまでは壊れた画像ではなく代替表示が出ます。
- **収録は10駅のみ**です（渋谷・新宿・池袋・東京・品川・上野・恵比寿・中目黒・
  吉祥寺・三軒茶屋）。

## `legacy/` について

ビルドと型チェックの対象外にした、使われていないコードの置き場です。
削除はしていないので、必要なら戻せます。不要だと判断できたらフォルダごと消して構いません。

- `legacy/portfolio/` — 以前ルートに置かれていた**別プロジェクトのポートフォリオ雛形**。
  Next.js は `app/` と `src/app/` が同時にあると `app/` を優先するため、
  これがあると EKICHO 側のページが一切表示されない状態でした。
- `legacy/components/` — どこからも import されていなかったコンポーネント群
  （Hero, Footer, About, CTASection, UserVoices, FeaturedStations, StationSearch,
  MapShowcase, PinballTable）。存在しない動画ファイルを参照していたり、
  `stations.ts` とは無関係な固定データを持っていたりと、いずれも未完成のものです。
