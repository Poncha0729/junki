import type { DataSource, RentEstimate } from '@/lib/stations'

/**
 * 同一指標（家賃）の大小比較なので、系列は1つ・単一色相のシーケンシャル配色。
 * 金額が高いほど濃くなる。明度は単調に下がる並びで、
 * 明度バンドは検証済み（最も明るい段は対サーフェスのコントラストが 3:1 未満のため、
 * 全バーに数値を直接ラベルすることを必須の代替手段としている）。
 */
const RAMP = ['#FB7C6A', '#E8452F', '#A32017'] as const

const ROWS: { key: keyof RentEstimate; label: string }[] = [
  { key: 'studio', label: 'ワンルーム' },
  { key: 'oneK', label: '1K' },
  { key: 'oneLdk', label: '1LDK' },
]

const yen = new Intl.NumberFormat('ja-JP')

interface RentChartProps {
  rent?: RentEstimate
  source?: DataSource
  stationName: string
}

/** 家賃相場が未登録のときの表示。数字を推測で埋めない。 */
function NotAvailable({ stationName }: { stationName: string }) {
  const query = encodeURIComponent(`${stationName}駅 家賃相場`)
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <p className="text-gray-700">この駅の家賃相場はまだ登録されていません。</p>
      <p className="mt-2 text-sm text-gray-500">
        推測値を表示すると判断を誤るため、出典を確認できたものだけを載せています。
        登録の手順は <code className="rounded bg-gray-100 px-1">docs/STATION-DATA.md</code> を参照してください。
      </p>
      <a
        href={`https://www.google.com/search?q=${query}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-sm font-medium text-ekicho-primary underline underline-offset-4"
      >
        {stationName}駅の家賃相場を調べる →
      </a>
    </div>
  )
}

export default function RentChart({ rent, source, stationName }: RentChartProps) {
  if (!rent) return <NotAvailable stationName={stationName} />

  const max = Math.max(...ROWS.map((r) => rent[r.key]))

  return (
    <figure className="rounded-xl bg-white p-6 shadow">
      <figcaption className="mb-1 text-sm font-medium text-gray-700">
        {stationName}駅の間取り別 家賃相場（月額）
      </figcaption>

      {source && (
        <p className="mb-5 text-xs text-gray-500">
          出典:{' '}
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {source.label}
            </a>
          ) : (
            source.label
          )}
          <span className="ml-1">（{source.retrievedAt} 時点）</span>
        </p>
      )}

      {/* バーを表の中に置くことで、そのまま表形式の代替表示にもなる */}
      <table className="w-full border-collapse">
        <caption className="sr-only">
          {stationName}駅の間取り別の家賃相場
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">間取り</th>
            <th scope="col">家賃</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => {
            const value = rent[row.key]
            const pct = max > 0 ? (value / max) * 100 : 0
            return (
              <tr key={row.key}>
                <th
                  scope="row"
                  className="w-24 py-2 pr-4 text-left align-middle text-sm font-normal text-gray-600"
                >
                  {row.label}
                </th>
                <td className="py-2 align-middle">
                  <div className="flex items-center gap-3">
                    {/* 左端の1本の基線から伸びる。データ側の端だけ角を丸める */}
                    <div
                      className="h-5 rounded-r-[4px]"
                      style={{ width: `${pct}%`, backgroundColor: RAMP[i] }}
                    />
                    <span className="whitespace-nowrap text-sm font-medium tabular-nums text-gray-800">
                      {yen.format(value)} 円
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* 目盛りの代わりの控えめな基線 */}
      <div className="mt-1 h-px w-full bg-gray-200" aria-hidden="true" />
    </figure>
  )
}
