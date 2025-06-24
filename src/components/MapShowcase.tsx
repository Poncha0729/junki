import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface MapShowcaseProps {
  language: 'ja' | 'en'
}

export default function MapShowcase({ language }: MapShowcaseProps) {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mapbox GL JS initialization
    // This would be implemented with Mapbox GL JS
    // const map = new mapboxgl.Map({
    //   container: mapContainer.current!,
    //   style: 'mapbox://styles/mapbox/dark-v11',
    //   center: [139.6917, 35.6895], // Tokyo
    //   zoom: 12
    // })
  }, [])

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8">Station Map</h2>
          
          <div className="relative h-[600px] bg-gray-100 rounded-2xl overflow-hidden">
            <div ref={mapContainer} className="w-full h-full" />
          </div>

          {/* Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="absolute top-4 right-4 px-4 py-2 bg-white rounded-full shadow-md"
          >
            {language === 'ja' ? 'EN' : 'JP'}
          </motion.button>
        </div>
      </div>
    </section>
  )
}
