interface StationMapProps {
  lat: number
  lng: number
  stationName: string
}

/**
 * 駅周辺の地図。
 *
 * OpenStreetMap の埋め込みを使う。APIキーもアカウントも不要なので、
 * 新しいPCでもタブレットでも設定なしでそのまま表示できる。
 * （Mapbox などを使う場合はトークンの発行と環境変数の設定が必要になる）
 */
export default function StationMap({ lat, lng, stationName }: StationMapProps) {
  // 駅を中心に半径 500m 程度が入る範囲
  const dLat = 0.0045
  const dLng = 0.0055
  const bbox = [lng - dLng, lat - dLat, lng + dLng, lat + dLat]
    .map((n) => n.toFixed(5))
    .join(',')

  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  const fullMapHref = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow">
      <iframe
        title={`${stationName}駅周辺の地図`}
        src={embedSrc}
        loading="lazy"
        className="h-[320px] w-full border-0 md:h-[420px]"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <p className="text-xs text-gray-500">
          地図: OpenStreetMap contributors
        </p>
        <a
          href={fullMapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap text-sm font-medium text-ekicho-primary underline underline-offset-4"
        >
          大きな地図で見る →
        </a>
      </div>
    </div>
  )
}
