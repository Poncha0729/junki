'use client'

import { useState } from 'react'

type Variant = 'card' | 'hero'

interface StationImageProps {
  src?: string
  alt: string
  className?: string
  /**
   * 写真が無いときの見せ方。
   * - card: 「写真は未登録です」と分かる代替カード
   * - hero: ページ上部の帯。暗いオーバーレイが重なるため、
   *         文言は出さずブランド色のグラデーションで埋める
   */
  variant?: Variant
}

function CardFallback({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label}（写真未登録）`}
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#FFFAF3] to-[#FFE6E6]"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-10 w-10 text-ekicho-primary/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10" r="1.5" />
        <path d="m21 16-5-5-6 6-2-2-5 5" />
      </svg>
      <span className="text-sm text-gray-500">写真は未登録です</span>
    </div>
  )
}

function HeroFallback({ label }: { label: string }) {
  return (
    <div
      role="img"
      aria-label={`${label}（写真未登録）`}
      className="h-full w-full bg-gradient-to-br from-ekicho-primary to-ekicho-accent"
    />
  )
}

/**
 * 駅の写真。
 *
 * このリポジトリには駅写真の実ファイルがまだ無いため、
 * 壊れた画像アイコンを出さずに代替表示へ切り替える。
 * `public/images/stations/<slug>/` に画像を置き、stations.ts の
 * `photos` に列挙すると実際の写真が表示される。
 */
export default function StationImage({
  src,
  alt,
  className,
  variant = 'card',
}: StationImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={className}>
        {variant === 'hero' ? <HeroFallback label={alt} /> : <CardFallback label={alt} />}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element --
          読み込み失敗を onError で拾って代替表示に切り替えたいので img を使う */}
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
