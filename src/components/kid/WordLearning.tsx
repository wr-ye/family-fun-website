import { useState } from 'react'
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { words } from '@/data/words'
import { playClickSound } from '@/utils/sounds'
import { speak } from '@/utils/speech'
import { useProgress } from '@/hooks/useProgress'

const categories = [
  { key: 'animals', label: '动物', emoji: '🐱' },
  { key: 'fruits', label: '水果', emoji: '🍎' },
  { key: 'colors', label: '颜色', emoji: '🎨' },
  { key: 'numbers', label: '数字', emoji: '123' },
  { key: 'daily', label: '日用品', emoji: '🏠' },
] as const

type Category = typeof categories[number]['key']

export default function WordLearning() {
  const [category, setCategory] = useState<Category>('animals')
  const [index, setIndex] = useState(0)
  const { learnWord } = useProgress()

  const filteredWords = words.filter(w => w.category === category)
  const current = filteredWords[index] || filteredWords[0]

  const prev = () => {
    setIndex(i => (i > 0 ? i - 1 : filteredWords.length - 1))
  }

  const next = () => {
    setIndex(i => (i < filteredWords.length - 1 ? i + 1 : 0))
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* 分类选择 */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => { playClickSound(); setCategory(cat.key); setIndex(0) }}
            className={`px-5 py-2.5 rounded-full text-lg font-bold transition-all ${
              category === cat.key
                ? 'bg-purple-500 text-white shadow-lg scale-110'
                : 'bg-white text-gray-600 hover:bg-purple-100 shadow'
            }`}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* 单词卡片 */}
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={`${category}-${index}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center gap-4"
          >
            {/* 大图标 */}
            <span className="text-8xl">{current.emoji}</span>

            {/* 中文 */}
            <h2 className="text-5xl font-black text-gray-800">{current.chinese}</h2>

            {/* 拼音 */}
            <p className="text-xl text-gray-400">{current.pinyin}</p>

            {/* 英文 */}
            <p className="text-lg text-gray-300">{current.english}</p>

            {/* 发音按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                playClickSound()
                speak(current.chinese)
                learnWord(current.id)
              }}
              className="mt-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white p-4 rounded-full hover:shadow-lg hover:scale-110 transition-all"
            >
              <Volume2 className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 导航按钮 */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => { playClickSound(); prev() }}
          className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        >
          <ChevronLeft className="w-8 h-8 text-purple-500" />
        </button>
        <span className="text-lg font-bold text-gray-400">
          {index + 1} / {filteredWords.length}
        </span>
        <button
          onClick={() => { playClickSound(); next() }}
          className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        >
          <ChevronRight className="w-8 h-8 text-purple-500" />
        </button>
      </div>
    </div>
  )
}
