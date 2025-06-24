import { motion } from 'framer-motion'

interface Testimonial {
  id: string
  name: string
  photo: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Yuki S.',
    photo: '/images/testimonials/yuki.jpg',
    quote: 'EKICHO helped me discover hidden gems in Tokyo I never knew existed!',
  },
  // Add more testimonials
]

export default function UserVoices() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">What People Say</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card"
            >
              <div className="relative w-full h-[200px] mb-4">
                <Image
                  src={testimonial.photo}
                  alt={testimonial.name}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">{testimonial.quote}</p>
                <h3 className="font-semibold">{testimonial.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
