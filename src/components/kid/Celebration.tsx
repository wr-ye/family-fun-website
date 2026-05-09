import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const emojis = ['🎉', '🎊', '⭐', '🌟', '✨', '🎈', '🎀', '💫']

interface Particle {
  id: number
  emoji: string
  x: number
  delay: number
  duration: number
}

export default function Celebration() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const items: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1 + Math.random() * 1.5,
    }))
    setParticles(items)
    const timer = setTimeout(() => setParticles([]), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: -50, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
            animate={{ y: '100vh', opacity: 0, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
            className="absolute text-2xl"
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
