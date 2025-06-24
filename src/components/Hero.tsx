import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

interface HeroProps {
  language: 'ja' | 'en'
}

export default function Hero({ language }: HeroProps) {
  const catchCopy = {
    ja: '駅から始まる、新しい旅',
    en: 'Journeys Begin at Stations',
  }

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/hero-loop.mp4" type="video/mp4" />
        <source src="/videos/hero-loop.webm" type="video/webm" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-ekicho-primary to-ekicho-accent opacity-60" />

      {/* Navigation */}
      <nav className="fixed top-6 left-6 right-6 flex justify-between px-4">
        <div className="text-2xl font-bold text-white">EKICHO</div>
        <button className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Letter-by-letter reveal */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="max-w-2xl text-center"
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            {catchCopy[language]}
          </h1>
          <button
            onClick={() => {
              // Language toggle logic
            }}
            className="text-white text-sm"
          >
            {language === 'ja' ? 'EN' : 'JP'}
          </button>
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 px-8 py-4 bg-white text-ekicho-primary rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Explore Stations
      </motion.button>
    </section>
  )
}
