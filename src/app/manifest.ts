import type { MetadataRoute } from 'next'

/**
 * Web アプリマニフェスト（/manifest.webmanifest として配信される）。
 *
 * 外出先のタブレットで「ホーム画面に追加」したときに、
 * ブラウザのブックマークではなくアプリとして開くための設定。
 * アイコンは `python3 scripts/generate-icons.py` で再生成できる。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EKICHO - 東京駅情報ガイド',
    short_name: 'EKICHO',
    description: '各駅周辺の雰囲気・家賃相場・出口情報をまとめた駅エリアガイド',
    lang: 'ja',
    start_url: '/',
    scope: '/',
    // アドレスバーを隠してアプリのように表示する
    display: 'standalone',
    background_color: '#FFFAF3',
    theme_color: '#FF4E4E',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Android はアイコンを円や角丸に切り抜くため、余白を広く取った版を渡す
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
