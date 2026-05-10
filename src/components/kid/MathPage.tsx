import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgress } from '@/hooks/useProgress'
import { generateCountQuestion, generateCompareQuestion, generateAddSubQuestion } from '@/data/math'
import { playCorrectSound, playWrongSound, playClickSound } from '@/utils/sounds'
import { speak } from '@/utils/speech'
import { MathQuestion } from '@/types'

type GameType = 'count' | 'compare' | 'addsub'

const gameConfig = [
  { type: 'count' as GameType, label: '🔢 看看', desc: '看看有几个' },
  { type: 'compare' as GameType, label: '⚖️ 比大小', desc: '哪边更多' },
  { type: 'addsub' as GameType, label: '🧮 加减法', desc: '简单加减' },
]

function generateQuestion(type: GameType): MathQuestion {
  switch (type) {
    case 'count': return generateCountQuestion()
    case 'compare': return generateCompareQuestion()
    case 'addsub': return generateAddSubQuestion()
  }
}

export default function MathPage() {
  const [gameType, setGameType] = useState<GameType | null>(null)
  const [question, setQuestion] = useState<MathQuestion>(() => generateCountQuestion())
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [score, setScore] = useState(0)
  const { completeMath } = useProgress()

  const startGame = useCallback((type: GameType) => {
    setGameType(type)
    const q = generateQuestion(type)
    setQuestion(q)
    setFeedback(null)
    // 朗读题目
    setTimeout(() => speak(q.question), 400)
  }, [])

  const handleAnswer = useCallback((answer: number) => {
    if (feedback === 'correct') return
    if (answer === question.answer) {
      setFeedback('correct')
      setScore(s => s + 1)
      completeMath()
      playCorrectSound()
      setTimeout(() => speak('答对了，真棒'), 300)
      setTimeout(() => {
        const newQ = generateQuestion(gameType!)
        setQuestion(newQ)
        setFeedback(null)
        // 朗读下一题（等待上一句 TTS 播完约 1.5s）
        setTimeout(() => speak(newQ.question), 1600)
      }, 2500)
    } else {
      setFeedback('wrong')
      playWrongSound()
      setTimeout(() => speak('再想想哦'), 200)
      setTimeout(() => setFeedback(null), 2000)
    }
  }, [question, feedback, gameType, completeMath])

  if (!gameType) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <h1 className="text-3xl font-black text-purple-700">🔢 数学启蒙</h1>
        <p className="text-gray-500">选择一个游戏开始吧！</p>
        <div className="grid grid-cols-1 gap-4 mt-4 w-full max-w-sm">
          {gameConfig.map(g => (
            <button
              key={g.type}
              onClick={() => { playClickSound(); startGame(g.type) }}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all text-center hover:scale-[1.02]"
            >
              <span className="text-3xl font-bold text-gray-800">{g.label}</span>
              <p className="text-sm text-gray-400 mt-1">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const handleBack = () => {
    setGameType(null)
    setScore(0)
    setFeedback(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="flex items-center gap-3 w-full">
        <button onClick={handleBack} className="text-purple-500 underline text-sm">返回</button>
        <span className="text-lg font-bold text-purple-700">
          {gameConfig.find(g => g.type === gameType)?.label}
        </span>
        <span className="ml-auto text-sm text-gray-400">得分：{score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm flex flex-col items-center gap-6"
        >
          {/* 题目：显示用 display（数学符号），语音用 question（中文朗读） */}
          <p className="text-2xl font-bold text-gray-700 text-center">
            {question.display || question.question}
          </p>

          {/* Emoji 展示 */}
          {question.emojis && (
            <p className="text-4xl text-center leading-relaxed">{question.emojis}</p>
          )}

          {/* 选项 */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="bg-gradient-to-br from-purple-100 to-pink-100 text-3xl font-black text-purple-700 p-4 rounded-2xl shadow hover:shadow-lg hover:scale-105 transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 反馈 */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-green-100 text-green-700 px-6 py-3 rounded-full text-lg font-bold"
          >
            🎉 答对了！真棒！
          </motion.div>
        )}
        {feedback === 'wrong' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="bg-red-100 text-red-500 px-6 py-3 rounded-full text-lg font-bold"
          >
            🤔 再想想哦！
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
