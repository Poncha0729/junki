import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

interface StationSearchProps {
  language: 'ja' | 'en'
}

export default function StationSearch({ language }: StationSearchProps) {
  const categories = [
    { id: 'cost', icon: '💰', label: 'Cost' },
    { id: 'commute', icon: '🚈', label: 'Commute' },
    { id: 'vibe', icon: '🎨', label: 'Vibe' },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search stations..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-ekicho-primary focus:border-transparent"
            />
          </div>

          {/* Category Pills */}
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05, rotate: -3 }}
                className="px-6 py-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <span className="text-xl mr-2">{category.icon}</span>
                {category.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
