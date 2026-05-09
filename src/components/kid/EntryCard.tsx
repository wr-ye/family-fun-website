import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { playClickSound } from '@/utils/sounds'

interface EntryCardProps {
  to: string
  emoji: string
  title: string
  color: string
  description?: string
}

const colorMap: Record<string, string> = {
  red: 'bg-kid-red',
  orange: 'bg-kid-orange',
  yellow: 'bg-kid-yellow text-gray-800',
  green: 'bg-kid-green',
  blue: 'bg-kid-blue',
  purple: 'bg-kid-purple',
  pink: 'bg-kid-pink',
}

export default function EntryCard({ to, emoji, title, color, description }: EntryCardProps) {
  const navigate = useNavigate()

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => { playClickSound(); navigate(to) }}
      className={`${colorMap[color] || 'bg-kid-blue'} rounded-kid p-6 shadow-lg hover:shadow-xl transition-shadow flex flex-col items-center justify-center gap-2 min-h-[160px] w-full`}
    >
      <span className="text-5xl">{emoji}</span>
      <span className="text-xl font-bold text-white drop-shadow-md">{title}</span>
      {description && (
        <span className="text-sm text-white/80">{description}</span>
      )}
    </motion.button>
  )
}
