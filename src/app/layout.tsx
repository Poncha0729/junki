import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'EKICHO - 東京駅情報ガイド',
  description: '各駅周辺の雰囲気・家賃相場・出口情報をまとめた駅エリアガイド',
  applicationName: 'EKICHO',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  // iPad/iPhone でホーム画面から開いたときにアプリとして全画面表示する
  appleWebApp: {
    capable: true,
    title: 'EKICHO',
    statusBarStyle: 'default',
  },
  formatDetection: {
    // 家賃の数字が勝手に電話番号リンクにならないようにする
    telephone: false,
  },
}

// 外出先のタブレット/スマホで見ることを前提にした表示設定
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FF4E4E',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
