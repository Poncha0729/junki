# メール文テンプレート生成ツール

### 概要
メール文テンプレートを自動生成するツールです。入力フォームで項目を入力すると、リアルタイムでメール文が生成され、コピーできます。

### テクノロジースタック
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

### 起動手順
1. プロジェクトルートで以下のコマンドを実行：
```bash
npm install
npm run dev
```

2. ブラウザで http://localhost:3000 にアクセス

### カスタマイズ方法
1. プレースホルダーの追加/変更：
   - `/lib/template.ts` の `placeholders` 配列を編集
   - テンプレート文字列内の `{{N}}` を対応する位置に追加

2. メール文テンプレートの変更：
   - `/lib/template.ts` の `emailTemplate` 文字列を編集
   - `{{N}}` の形式でプレースホルダーを参照可能

### デザイン特徴
- レスポンシブデザイン（md 以上で左右2カラム、sm 以下で縦並び）
- ホワイトベースのUIに淡いグリーンアクセント
- Roundedカードデザイン
- リアルタイムプレビュー機能
- クリップボード

### 2. プロジェクトのセットアップ
1. 依存関係のインストール:
```bash
pnpm install
```

2. 開発サーバーの起動:
```bash
pnpm dev
```

### 3. ポートの変更
デフォルトでは、開発サーバーはポート 3000 を使用します。他のアプリケーションがポート 3000 を使用している場合は、以下のコマンドで別のポートを指定できます：

```bash
pnpm dev --port 3001
```

### 4. トラブルシューティング
#### エラー: `ERR_CONNECTION_REFUSED`
1. 開発サーバーが起動しているか確認してください。
2. ターミナルで `pnpm dev` の実行結果を確認し、エラーがないか確認してください。
3. ファイアウォールがブロックしていないか確認してください。
4. ポート 3000 が他のアプリケーションで使用されていないか確認してください。

#### エラー: `pnpm: コマンドが見つかりません`
1. pnpm がインストールされているか確認してください。
2. システムの PATH に pnpm のインストール場所が含まれているか確認してください。
3. ターミナルを再起動して、環境変数の変更を反映させてください。

#### エラー: `Cannot find module` エラー
1. `pnpm install` を実行して依存関係を再インストールしてください。
2. `node_modules` フォルダを削除し、`pnpm install` を再度実行してください。
3. TypeScript のエラーメッセージを確認し、必要なパッケージを追加してください。

## 機能

- バイリンガル対応（日本語/英語）
- 駅周辺エリアの可視化
- インタラクティブな出口マップとPOI情報
- 家賃比較
- 生活スナップショット
- モバイル対応デザイン

## プロジェクト構造

```
app/
  page.tsx          # ホームページ
  stations/
    [slug]/page.tsx # 動的駅ページ
components/
  StationPage.tsx   # 駅ページコンポーネント
lib/
  stations.ts       # 偽データ
public/
  images/           # 駅の写真
styles/
  globals.css       # グローバルスタイル
```

## ピンボールゲーム

React 18 + Next.js 14 (App Router)、Tailwind CSS、TypeScriptを使用したMatter.jsによる物理シミュレーションを搭載した、シンプルなWebベースのピンボールゲームです。

## ピンボールゲームのセットアップ
## Pinball Game Getting Started

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the game.

## Pinball Game Controls

- Left Arrow: Left flipper
- Right Arrow: Right flipper
- Space: Launch ball
- F5: Reset score

## Pinball Game Features

- Neon-dark aesthetic with gradient background
- Physics-based ball movement using Matter.js
- Score tracking
- Interactive flippers
- Bumpers with high restitution
- Responsive canvas

## Deployment

To deploy this project to Vercel:

1. Push to GitHub
2. Import to Vercel
3. Connect your GitHub repository
4. Deploy
