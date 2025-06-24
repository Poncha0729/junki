import { motion } from 'framer-motion'
import Image from 'next/image'

interface Station {
  id: string
  name: string
  lineColor: string
  summary: string[]
  image: string
}

const stations: Station[] = [
  {
    id: '1',
    name: 'Tokyo Station',
    lineColor: '#0000FF',
    summary: ['Iconic red brick architecture', 'Central hub of Japan', 'Luxury shopping'],
    image: '/images/stations/tokyo.jpg',
  },
  // Add more stations
]

export default function FeaturedStations() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Featured Stations</h2>

        <div className="snap-x snap-mandatory overflow-x-auto scroll-smooth hide-scrollbar">
          {stations.map((station) => (
            <motion.div
              key={station.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="snap-center min-w-[300px] mr-8 last:mr-0"
            >
              <div className="card">
                <div className="relative h-[200px] mb-4">
                  <Image
                    src={station.image}
                    alt={station.name}
                    fill
                    className="object-cover rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{station.name}</h3>
                  <div className="w-8 h-2 rounded-full" style={{ backgroundColor: station.lineColor }} />
                  <ul className="space-y-1">
                    {station.summary.map((item, index) => (
                      <li key={index} className="text-gray-600 flex items-center">
                        <span className="mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
