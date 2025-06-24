export interface Station {
  slug: string;
  name: {
    en: string;
    ja: string;
  };
  line: string;
  avgRent: {
    studio: number;
    oneK: number;
    oneLdk: number;
  };
  pros: string[];
  cons: string[];
  exits: {
    name: string;
    poi: {
      type: string;
      name: string;
      distance: string;
    }[];
  }[];
  photos: string[];
  lastUpdated: string;
}

export const stations: Record<string, Station> = {
  "shibuya": {
    slug: "shibuya",
    name: {
      en: "Shibuya",
      ja: "渋谷"
    },
    line: "JR 山手線",
    avgRent: {
      studio: 125000,
      oneK: 150000,
      oneLdk: 180000
    },
    pros: [
      "✨ 24時間営業の店舗と飲食店",
      "🚇 5つの地下鉄路線への直結",
      "📸 象徴的なスクランブル交差点"
    ],
    cons: [
      "💰 生活費が高い",
      "👥 高峰時の混雑",
      "🚗 交通渋滞"
    ],
    exits: [
      {
        name: "ハチ公口",
        poi: [
          { type: "supermarket", name: "渋谷東京ミッドタウン", distance: "徒歩1分" },
          { type: "cafe", name: "スターバックスリザーブ", distance: "徒歩2分" },
          { type: "park", name: "渋谷中央公園", distance: "徒歩3分" }
        ]
      },
      {
        name: "東口",
        poi: [
          { type: "supermarket", name: "ドン・キホーテ", distance: "徒歩1分" },
          { type: "cafe", name: "カフェ・ド・アンブル", distance: "徒歩3分" },
          { type: "gym", name: "エニタイムフィットネス", distance: "徒歩4分" }
        ]
      }
    ],
    photos: [
      "/images/stations/shibuya/night.jpg",
      "/images/stations/shibuya/scramble.jpg",
      "/images/stations/shibuya/street.jpg"
    ],
    lastUpdated: "2025-06-23"
  }
}
