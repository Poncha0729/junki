'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { searchStations, stationList, type Station } from '@/lib/stations'

const yen = new Intl.NumberFormat('ja-JP')

function StationCard({ station }: { station: Station }) {
  const shownLines = station.lines.slice(0, 3)
  const restCount = station.lines.length - shownLines.length

  return (
    <Link
      href={`/stations/${station.slug}`}
      className="block rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ekicho-primary"
    >
      <div className="mb-1 flex items-baseline gap-2">
        <h3 className="text-xl font-semibold text-gray-800">{station.name.ja}</h3>
        <span className="text-sm text-gray-500">{station.ward}</span>
      </div>

      <ul className="mb-4 flex flex-wrap gap-1.5">
        {shownLines.map((line) => (
          <li
            key={line}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {line}
          </li>
        ))}
        {restCount > 0 && (
          <li className="px-1 py-0.5 text-xs text-gray-500">ほか{restCount}路線</li>
        )}
      </ul>

      {station.avgRent ? (
        <p className="text-sm text-gray-700">
          ワンルーム{' '}
          <span className="font-medium tabular-nums">
            {yen.format(station.avgRent.studio)} 円
          </span>
          <span className="mx-1.5 text-gray-300">/</span>
          1K{' '}
          <span className="font-medium tabular-nums">
            {yen.format(station.avgRent.oneK)} 円
          </span>
        </p>
      ) : (
        <p className="text-sm text-gray-400">家賃相場は未登録</p>
      )}
    </Link>
  )
}

export default function HomePage() {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')

  const results = useMemo(() => searchStations(searchQuery), [searchQuery])

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFAF3] to-[#FFE6E6]">
      <div className="container mx-auto px-4 py-8">
        <section className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-800">{t('title')}</h1>
          <p className="text-xl text-gray-600">{t('subtitle')}</p>
        </section>

        <div className="mx-auto mb-4 max-w-2xl">
          <label htmlFor="station-search" className="sr-only">
            {t('search')}
          </label>
          <input
            id="station-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`🔍 ${t('search')}`}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ekicho-primary"
          />
          <p className="mt-2 text-center text-sm text-gray-500" aria-live="polite">
            {t('resultCount', { count: results.length, total: stationList.length })}
          </p>
        </div>

        {results.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((station) => (
              <StationCard key={station.slug} station={station} />
            ))}
          </section>
        ) : (
          <p className="py-16 text-center text-gray-500">{t('noResults')}</p>
        )}
      </div>
    </main>
  )
}
