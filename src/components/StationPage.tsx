import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import type { Station } from '@/lib/stations'
import RentChart from './RentChart'
import StationImage from './StationImage'
import StationMap from './StationMap'

interface StationPageProps {
  station: Station
}

export default async function StationPage({ station }: StationPageProps) {
  const t = await getTranslations()
  const heroPhoto = station.photos[0]
  // 写真の上では文字を読ませるために暗く落とすが、
  // 写真が無くブランド色のグラデーションを敷く場合は濃く被せる必要がない
  const heroOverlay = heroPhoto ? 'bg-black/45' : 'bg-black/10'

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FFFAF3] to-[#FFE6E6]">
      {/* ヘローセクション */}
      <section className="relative h-[320px] md:h-[400px]">
        <StationImage
          src={heroPhoto}
          alt={`${station.name.ja}駅周辺エリア`}
          variant="hero"
          className="h-full w-full"
        />
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white ${heroOverlay}`}
        >
          <h1 className="mb-2 text-4xl font-bold">{station.name.ja}</h1>
          <p className="mb-4 text-sm opacity-90">
            {station.name.en}
            <span aria-hidden="true" className="mx-2 opacity-60">
              ｜
            </span>
            {station.ward}
          </p>
          <ul className="flex max-w-3xl flex-wrap justify-center gap-1.5">
            {station.lines.map((line) => (
              <li
                key={line}
                className="rounded-full bg-white/20 px-2.5 py-1 text-xs backdrop-blur-sm"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/"
          className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-800 shadow transition-colors hover:bg-white"
        >
          ← {t('backToList')}
        </Link>
      </section>

      {/* メリット・デメリット */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{t('prosCons')}</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xl font-semibold">{t('pros')}</h3>
            <ul className="space-y-2">
              {station.pros.map((pro) => (
                <li key={pro} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-0.5 text-green-600">
                    ✓
                  </span>
                  <span className="text-gray-700">{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-xl font-semibold">{t('cons')}</h3>
            <ul className="space-y-2">
              {station.cons.map((con) => (
                <li key={con} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-0.5 text-ekicho-primary">
                    !
                  </span>
                  <span className="text-gray-700">{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 出口 */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{t('exits')}</h2>
        <ul className="flex flex-wrap gap-2">
          {station.exits.map((exit) => (
            <li
              key={exit}
              className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow"
            >
              {exit}
            </li>
          ))}
        </ul>
      </section>

      {/* 家賃相場 */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{t('rentPrices')}</h2>
        <RentChart
          rent={station.avgRent}
          source={station.rentSource}
          stationName={station.name.ja}
        />
      </section>

      {/* 周辺の地図 */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{t('aroundStation')}</h2>
        <StationMap
          lat={station.coords.lat}
          lng={station.coords.lng}
          stationName={station.name.ja}
        />
      </section>

      {/* 生活スナップショット */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">{t('livingSnapshots')}</h2>
        {station.photos.length > 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {station.photos.slice(1).map((photo) => (
              <StationImage
                key={photo}
                src={photo}
                alt={`${station.name.ja}駅周辺の街並み`}
                className="h-[240px] w-full overflow-hidden rounded-lg md:h-[300px]"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white p-6 shadow">
            <p className="text-gray-700">この駅の写真はまだ登録されていません。</p>
            <p className="mt-2 text-sm text-gray-500">
              <code className="rounded bg-gray-100 px-1">
                public/images/stations/{station.slug}/
              </code>{' '}
              に画像を置き、<code className="rounded bg-gray-100 px-1">src/lib/stations.ts</code>{' '}
              の <code className="rounded bg-gray-100 px-1">photos</code> に追記すると表示されます。
            </p>
          </div>
        )}
      </section>

      {/* 更新日 */}
      <section className="container mx-auto px-4 pb-12 pt-8">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-600">
            {t('lastUpdated', { date: station.lastUpdated })}
          </p>
        </div>
      </section>
    </main>
  )
}
