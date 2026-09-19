'use client'

import { useState } from 'react'
import { Station } from '@/lib/stations'
import { useTranslations } from 'next-intl'

interface StationPageProps {
  station: Station
}

export default function StationPage({ station }: StationPageProps) {
  const t = useTranslations()
  const [activeExit, setActiveExit] = useState(0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFAF3] to-[#FFE6E6]">
      {/* ヘローセクション */}
      <section className="relative h-[400px]">
        <img
          src={station.photos[0]}
          alt={`${station.name.ja}駅周辺エリア`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
          <h1 className="text-4xl font-bold mb-4">{station.name.ja}</h1>
          <p className="text-2xl mb-8">{station.line}</p>
          <div className="flex gap-4">
            <span className="text-lg">💰 {station.avgRent.studio.toLocaleString()}¥</span>
            <span className="text-lg">💰 {station.avgRent.oneK.toLocaleString()}¥</span>
            <span className="text-lg">💰 {station.avgRent.oneLdk.toLocaleString()}¥</span>
          </div>
        </div>
      </section>

      {/* メリット・デメリットセクション */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">{t('prosCons')}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">{t('pros')}</h3>
            <ul className="space-y-2">
              {station.pros.map((pro, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-500">✨</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">{t('cons')}</h3>
            <ul className="space-y-2">
              {station.cons.map((con, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-red-500">❌</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 出口セクション */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">{t('exits')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {station.exits.map((exit, index) => (
            <div
              key={exit.name}
              className={`p-6 rounded-xl transition-transform hover:scale-105 ${
                activeExit === index ? 'shadow-lg' : 'shadow'
              }`}
              onClick={() => setActiveExit(index)}
            >
              <h3 className="text-xl font-semibold mb-4">{exit.name}</h3>
              <div className="space-y-2">
                {exit.poi.map((poi) => (
                  <div key={poi.name} className="flex items-center gap-2">
                    <span className="text-sm">
                      {poi.type === 'supermarket' ? '🛒' : poi.type === 'cafe' ? '☕' : poi.type === 'park' ? '🌳' : poi.type === 'gym' ? '💪' : '📍'}
                    </span>
                    <span className="text-sm">{poi.name}</span>
                    <span className="text-sm text-gray-600">({poi.distance})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 家賃グラフセクション */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">{t('rentPrices')}</h2>
        <div className="bg-white rounded-xl p-6 shadow">
          {/* 価格グラフコンポーネントを追加 */}
        </div>
      </section>

      {/* 生活スナップショット */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">{t('livingSnapshots')}</h2>
        <div className="carousel">
          {station.photos.slice(1).map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`${station.name.ja}駅周辺の街並み`}
              className="w-full h-[400px] object-cover rounded-lg"
            />
          ))}
        </div>
      </section>

      {/* ソースセクション */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-6 shadow">
          <p className="text-sm text-gray-600">
            {t('lastUpdated', { date: station.lastUpdated })}
          </p>
        </div>
      </section>
    </main>
  )
}
