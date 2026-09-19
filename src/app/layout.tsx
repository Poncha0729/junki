import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

export const metadata: Metadata = {
  title: 'EKICHO - 東京駅情報ガイド',
  description: '各駅周辺の雰囲気・家賃相場・出口情報をまとめた駅エリアガイド',
}

// 外出先のタブレット/スマホで見ることを前提にした表示設定
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
