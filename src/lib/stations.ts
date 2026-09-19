/**
 * 駅データ。
 *
 * 方針:
 * - 路線名・所在区・出口名・座標は、変わりにくい事実のみを載せる。
 * - 家賃相場は出典が確認できたものだけ `avgRent` に入れる。
 *   未取得なら undefined にしておくこと（0 や推測値で埋めないこと）。
 *   UI 側は未登録を「未登録」として表示し、数字をでっち上げない。
 * - 周辺店舗の具体名・徒歩分数は出典なしに書かない。
 *   代わりに駅ページの地図から実際の周辺を見られるようにしている。
 *
 * データの増やし方は docs/STATION-DATA.md を参照。
 */

/** 間取り別の家賃相場（円／月）。 */
export interface RentEstimate {
  /** ワンルーム */
  studio: number
  /** 1K */
  oneK: number
  /** 1LDK */
  oneLdk: number
}

/** 数値の出所。家賃のように変動する値には必ず付ける。 */
export interface DataSource {
  /** 表示名。例: "SUUMO 家賃相場" */
  label: string
  /** 出典URL。確認できない場合は空文字 */
  url: string
  /** 取得日 YYYY-MM-DD */
  retrievedAt: string
}

export interface Station {
  slug: string
  name: {
    en: string
    ja: string
  }
  /** 乗り入れ路線 */
  lines: string[]
  /** 所在する区・市 */
  ward: string
  /** 地図の中心に使うおおよその座標（駅舎の中心を厳密に指すものではない） */
  coords: {
    lat: number
    lng: number
  }
  /** 主な出口 */
  exits: string[]
  pros: string[]
  cons: string[]
  /** 家賃相場。出典が確認できていない場合は undefined のままにする */
  avgRent?: RentEstimate
  /** avgRent の出所。avgRent があるときは必ず設定する */
  rentSource?: DataSource
  /**
   * 駅周辺の写真。`public/images/stations/<slug>/` にファイルを置き、
   * そのパスをここに列挙すると表示される。空配列なら代替表示になる。
   */
  photos: string[]
  lastUpdated: string
}

export const stations: Record<string, Station> = {
  shibuya: {
    slug: 'shibuya',
    name: { en: 'Shibuya', ja: '渋谷' },
    lines: [
      'JR山手線',
      'JR埼京線',
      'JR湘南新宿ライン',
      '東急東横線',
      '東急田園都市線',
      '京王井の頭線',
      '東京メトロ銀座線',
      '東京メトロ半蔵門線',
      '東京メトロ副都心線',
    ],
    ward: '渋谷区',
    coords: { lat: 35.658, lng: 139.7016 },
    exits: ['ハチ公口', '宮益坂口', '南口', '新南口'],
    pros: [
      '9路線が乗り入れ、都内のどこへ出るにも乗り換えが少ない',
      '深夜まで営業する店が多く、帰宅が遅くても食事に困らない',
      '再開発で駅直結の商業施設が増え、雨に濡れずに移動できる範囲が広い',
    ],
    cons: [
      '家賃・物価ともに都内でも高い部類',
      '駅周辺は終日人が多く、休日は特に混雑する',
      '繁華街に近い区画は夜間の騒音が気になることがある',
    ],
    // ↓ リポジトリに元から入っていたサンプル値。実測に基づくものではない。
    avgRent: { studio: 125000, oneK: 150000, oneLdk: 180000 },
    rentSource: {
      label: 'サンプルデータ（実測値ではありません）',
      url: '',
      retrievedAt: '2025-06-23',
    },
    photos: [],
    lastUpdated: '2025-06-23',
  },

  shinjuku: {
    slug: 'shinjuku',
    name: { en: 'Shinjuku', ja: '新宿' },
    lines: [
      'JR山手線',
      'JR中央線',
      'JR総武線',
      'JR埼京線',
      'JR湘南新宿ライン',
      '小田急小田原線',
      '京王線',
      '東京メトロ丸ノ内線',
      '都営新宿線',
      '都営大江戸線',
    ],
    ward: '新宿区',
    coords: { lat: 35.6896, lng: 139.7006 },
    exits: ['東口', '西口', '南口', '新南口'],
    pros: [
      '私鉄・地下鉄を含め乗り入れ路線が非常に多く、郊外へのアクセスが良い',
      '大型商業施設・家電量販店・病院が駅前に揃っている',
      '新宿御苑など大きな緑地が徒歩圏にある',
    ],
    cons: [
      '駅構内が広く複雑で、乗り換えに時間がかかることがある',
      '人通りが多く、落ち着いた住環境を求める場合は駅から離れる必要がある',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  ikebukuro: {
    slug: 'ikebukuro',
    name: { en: 'Ikebukuro', ja: '池袋' },
    lines: [
      'JR山手線',
      'JR埼京線',
      'JR湘南新宿ライン',
      '東武東上線',
      '西武池袋線',
      '東京メトロ丸ノ内線',
      '東京メトロ有楽町線',
      '東京メトロ副都心線',
    ],
    ward: '豊島区',
    coords: { lat: 35.7295, lng: 139.7109 },
    exits: ['東口', '西口', '北口', '南口'],
    pros: [
      '東武東上線・西武池袋線の始発駅で、座って帰れる路線がある',
      '同規模のターミナルの中では家賃が比較的抑えめとされる',
      '大型書店・劇場・水族館など駅前で用事が完結しやすい',
    ],
    cons: [
      '北口側の一部エリアは繁華街の性格が強く、住環境の好みが分かれる',
      '駅前の自転車・歩行者の通行量が多い',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  tokyo: {
    slug: 'tokyo',
    name: { en: 'Tokyo', ja: '東京' },
    lines: [
      'JR東海道新幹線',
      'JR東北・上越・北陸新幹線',
      'JR山手線',
      'JR京浜東北線',
      'JR中央線',
      'JR東海道線',
      'JR横須賀線',
      'JR総武線快速',
      '東京メトロ丸ノ内線',
    ],
    ward: '千代田区',
    coords: { lat: 35.6812, lng: 139.7671 },
    exits: ['丸の内口', '八重洲口', '日本橋口'],
    pros: [
      '新幹線が発着し、出張や帰省が多い場合の利便性が高い',
      '空港へのアクセス手段が複数ある',
      'オフィス街のため休日は比較的静か',
    ],
    cons: [
      '住宅は少なく、賃貸の選択肢が限られる',
      '日用品の買い物先が休日に閉まっていることがある',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  shinagawa: {
    slug: 'shinagawa',
    name: { en: 'Shinagawa', ja: '品川' },
    lines: [
      'JR東海道新幹線',
      'JR山手線',
      'JR京浜東北線',
      'JR東海道線',
      'JR横須賀線',
      '京急本線',
    ],
    ward: '港区',
    coords: { lat: 35.6284, lng: 139.7387 },
    exits: ['高輪口', '港南口'],
    pros: [
      '京急線で羽田空港へ乗り換えなしで行ける',
      '新幹線が停車し、西方面への移動が速い',
      '港南口側はオフィス・タワーマンションが多く歩道が広い',
    ],
    cons: [
      '通勤時間帯の山手線・京浜東北線の混雑が激しい',
      '再開発エリアは家賃が高めになりやすい',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  ueno: {
    slug: 'ueno',
    name: { en: 'Ueno', ja: '上野' },
    lines: [
      'JR東北・上越・北陸新幹線',
      'JR山手線',
      'JR京浜東北線',
      'JR宇都宮線',
      'JR高崎線',
      'JR常磐線',
      '東京メトロ銀座線',
      '東京メトロ日比谷線',
    ],
    ward: '台東区',
    coords: { lat: 35.7138, lng: 139.777 },
    exits: ['公園口', '不忍口', '広小路口', '入谷口'],
    pros: [
      '上野公園・美術館・博物館が徒歩圏にある',
      'アメ横など生鮮の安い商店街が近い',
      '北関東・東北方面への在来線と新幹線が揃っている',
    ],
    cons: [
      '観光客が多く、休日の駅周辺は混雑する',
      'エリアによって街の雰囲気の差が大きい',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  ebisu: {
    slug: 'ebisu',
    name: { en: 'Ebisu', ja: '恵比寿' },
    lines: ['JR山手線', 'JR埼京線', 'JR湘南新宿ライン', '東京メトロ日比谷線'],
    ward: '渋谷区',
    coords: { lat: 35.6467, lng: 139.71 },
    exits: ['東口', '西口'],
    pros: [
      '渋谷・目黒へ1駅で、山手線内でも落ち着いた住環境',
      '恵比寿ガーデンプレイスなど駅直結の商業施設がある',
      '飲食店の質が高く選択肢が広い',
    ],
    cons: [
      '人気エリアのため家賃相場が高い',
      '坂が多く、駅から離れると徒歩の負担がある',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  nakameguro: {
    slug: 'nakameguro',
    name: { en: 'Nakameguro', ja: '中目黒' },
    lines: ['東急東横線', '東京メトロ日比谷線'],
    ward: '目黒区',
    coords: { lat: 35.6441, lng: 139.6989 },
    exits: ['正面口', '南口'],
    pros: [
      '日比谷線の始発があり、都心方面へ座って通勤しやすい',
      '目黒川沿いに個人店が多く、生活圏が歩いて完結する',
      '渋谷まで1駅',
    ],
    cons: [
      '桜の時期は目黒川周辺が大変混雑する',
      '人気エリアで家賃は高めに推移しやすい',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  kichijoji: {
    slug: 'kichijoji',
    name: { en: 'Kichijoji', ja: '吉祥寺' },
    lines: ['JR中央線', 'JR総武線', '京王井の頭線'],
    ward: '武蔵野市',
    coords: { lat: 35.703, lng: 139.58 },
    exits: ['北口', '南口（公園口）'],
    pros: [
      '井の頭公園が徒歩圏にあり、緑地へのアクセスが良い',
      '商店街が発達していて日常の買い物先が多い',
      '井の頭線で渋谷へ直通',
    ],
    cons: [
      '中央線快速の朝の混雑が激しい',
      '人気が高く、都心から離れる割に家賃は下がりにくい',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },

  sangenjaya: {
    slug: 'sangenjaya',
    name: { en: 'Sangenjaya', ja: '三軒茶屋' },
    lines: ['東急田園都市線', '東急世田谷線'],
    ward: '世田谷区',
    coords: { lat: 35.6434, lng: 139.6716 },
    exits: ['北口', '南口'],
    pros: [
      '渋谷まで2駅と近く、都心アクセスが良い',
      '商店街と飲食店が多く、生活費を抑えやすい',
      '世田谷線沿線に住宅街が広がり、静かな区画を選びやすい',
    ],
    cons: [
      '田園都市線の朝の混雑が激しい',
      '駅前の道路が狭く、車での移動はしにくい',
    ],
    photos: [],
    lastUpdated: '2026-09-19',
  },
}

/** 一覧表示用。日本語名の五十音ではなく、登録順を保つ。 */
export const stationList: Station[] = Object.values(stations)

/**
 * 駅名（日本語・英語）・路線名・区名のいずれかに対する部分一致検索。
 * 検索欄が空のときは全件返す。
 */
export function searchStations(query: string): Station[] {
  const q = query.trim().toLowerCase()
  if (!q) return stationList

  return stationList.filter((station) => {
    const haystack = [
      station.name.ja,
      station.name.en,
      station.ward,
      ...station.lines,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
}
