import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const locales = ['ja', 'en'] as const
export const defaultLocale = 'ja'

export type Locale = (typeof locales)[number]

/**
 * App Router 用の next-intl 設定。
 * 既定は日本語。`NEXT_LOCALE` クッキーが 'en' の場合だけ英語に切り替える。
 * （URL でロケールを切る構成にはしていないので、外出先のタブレットでも
 *   同じ URL のまま日本語で表示される）
 */
export default getRequestConfig(async () => {
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
  }
})
