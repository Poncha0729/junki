import { motion } from 'framer-motion'
import Image from 'next/image'

interface AboutProps {
  language: 'ja' | 'en'
}

export default function About({ language }: AboutProps) {
  const content = {
    ja: {
      title: 'EKICHOについて',
      description: '日本全国の駅をご紹介するウェブメディア。駅から始まる新しい旅を発見してください。',
    },
    en: {
      title: 'About EKICHO',
      description: 'A web media introducing railway stations across Japan. Discover new journeys starting from stations.',
    },
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Image Carousel */}
          <div className="relative h-[400px]">
            <Image
              src="/images/about.jpg"
              alt={content[language].title}
              fill
              className="object-cover rounded-2xl"
            />
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">{content[language].title}</h2>
            <p className="text-lg text-gray-600">{content[language].description}</p>
            
            {/* Language Tabs */}
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  // Language toggle logic
                }}
                className="px-4 py-2 rounded-full text-sm font-medium"
              >
                {language === 'ja' ? 'EN' : 'JP'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
