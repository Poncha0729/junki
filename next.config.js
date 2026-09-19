const createNextIntlPlugin = require('next-intl/plugin')

// next-intl の設定ファイルを App Router に登録する。
// ※ Pages Router 用の `i18n` キーは App Router では無効なため使っていない。
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = withNextIntl(nextConfig)
