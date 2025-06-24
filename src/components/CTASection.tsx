import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-ekicho-primary to-ekicho-accent text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-lg">
              Get the latest station stories and travel tips straight to your inbox
            </p>

            {/* Newsletter Form */}
            <form className="max-w-md mx-auto">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-3 bg-white text-ekicho-primary rounded-full hover:bg-white/90 transition-colors"
                >
                  Subscribe
                </button>
              </div>
            </form>

            {/* Sparkle Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white"
                  initial={{
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    opacity: 0,
                    scale: 0.5,
                  }}
                  animate={{
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
