import { motion } from 'framer-motion'
import { Twitter, Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">EKICHO</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-ekicho-primary">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-ekicho-primary">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-ekicho-primary">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="flex justify-center md:justify-start space-x-6">
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="#"
              className="text-gray-600 hover:text-ekicho-primary"
            >
              <Twitter className="w-6 h-6" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="#"
              className="text-gray-600 hover:text-ekicho-primary"
            >
              <Instagram className="w-6 h-6" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="#"
              className="text-gray-600 hover:text-ekicho-primary"
            >
              <Facebook className="w-6 h-6" />
            </motion.a>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-600">© 2025 Poncha. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
