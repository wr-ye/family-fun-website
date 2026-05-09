import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgress } from '@/hooks/useProgress'
import { memoryCards, shuffleArray } from '@/data/games'
import { playFlipSound, playMatchSound, playCelebrationSound } from '@/utils/sounds'

interface Card {
  id: string
  emoji: string
  flipped: boolean
  matched: boolean
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(() =>
    shuffleArray([...memoryCards, ...memoryCards]).map((c, i) => ({
      ...c,
      id: `${c.id}-${i}`,
      flipped: false,
      matched: false,
    }))
  )
  const [selected, setSelected] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const { updateGameRecord } = useProgress()

  const matchedCount = cards.filter(c => c.matched).length
  const allMatched = matchedCount === cards.length && cards.length > 0

  useEffect(() => {
    if (allMatched) {
      setWon(true)
      playCelebrationSound()
      const score = Math.max(100 - moves * 2, 10)
      updateGameRecord({ memoryScore: score })
    }
  }, [allMatched, moves, updateGameRecord])

  const handleCardClick = useCallback((cardId: string) => {
    if (locked || won) return
    const card = cards.find(c => c.id === cardId)
    if (!card || card.flipped || card.matched) return

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, flipped: true } : c))

    playFlipSound()
    if (selected.length === 0) {
      setSelected([cardId])
    } else if (selected.length === 1) {
      setMoves(m => m + 1)
      setLocked(true)
      const firstId = selected[0]
      const first = cards.find(c => c.id === firstId)!

      if (first.emoji === card.emoji) {
        playMatchSound()
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === cardId ? { ...c, matched: true } : c
          ))
          setSelected([])
          setLocked(false)
        }, 500)
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === cardId ? { ...c, flipped: false } : c
          ))
          setSelected([])
          setLocked(false)
        }, 800)
      }
    }
  }, [cards, selected, locked, won])

  const restart = () => {
    setCards(shuffleArray([...memoryCards, ...memoryCards]).map((c, i) => ({
      ...c,
      id: `${c.id}-${Math.random()}-${i}`,
      flipped: false,
      matched: false,
    })))
    setSelected([])
    setLocked(false)
    setMoves(0)
    setWon(false)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h2 className="text-2xl font-bold text-purple-700">🃏 配对记忆</h2>
      <div className="flex gap-4 text-sm text-gray-500">
        <span>步数：{moves}</span>
        <span>已配对：{matchedCount / 2} / 8</span>
      </div>

      {won && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-yellow-100 text-yellow-700 px-6 py-3 rounded-full text-lg font-bold"
        >
          🎉 太棒了！你赢了！
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-3 max-w-sm">
        <AnimatePresence>
          {cards.map(card => (
            <motion.button
              key={card.id}
              layout
              onClick={() => handleCardClick(card.id)}
              whileTap={{ scale: 0.95 }}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl text-3xl flex items-center justify-center font-bold transition-all ${
                card.matched
                  ? 'bg-green-100 opacity-60'
                  : card.flipped
                    ? 'bg-white shadow-md'
                    : 'bg-gradient-to-br from-purple-400 to-pink-400 shadow-md hover:shadow-lg cursor-pointer'
              }`}
            >
              {card.flipped || card.matched ? card.emoji : '?'}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {won && (
        <button
          onClick={restart}
          className="mt-4 bg-purple-500 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-600 transition-colors"
        >
          🔄 再玩一次
        </button>
      )}
    </div>
  )
}
