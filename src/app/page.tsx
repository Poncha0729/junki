import { useState } from 'react'
import { stations } from '@/lib/stations'
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')

  const featuredStations = Object.values(stations).slice(0, 3)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFAF3] to-[#FFE6E6]">
      <div className="container mx-auto px-4 py-8">
        {/* ヘローセクション */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('subtitle')}
          </p>
        </section>

        {/* 検索バー */}
        <div className="mb-12">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 駅を検索..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* おすすめ駅 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredStations.map((station) => (
            <div key={station.slug} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow">
              <h3 className="text-xl font-semibold mb-2">
                {station.name.ja}
              </h3>
              <p className="text-gray-600 mb-4">{station.line}</p>
              <div className="flex gap-4">
                <span className="text-sm text-green-600">💰 {station.avgRent.studio.toLocaleString()}¥</span>
                <span className="text-sm text-blue-600">💰 {station.avgRent.oneK.toLocaleString()}¥</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
