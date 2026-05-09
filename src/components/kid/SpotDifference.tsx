import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProgress } from '@/hooks/useProgress'
import { playCorrectSound, playWrongSound, playClickSound } from '@/utils/sounds'

interface DiffItem {
  x: number   // 百分比位置
  y: number
  left: string
  right: string
}

interface LevelConfig {
  /** 背景填充的 emoji（5行3列=15个） */
  bg: string[]
  /** 5 处差异 */
  diffs: DiffItem[]
}

const levels: LevelConfig[] = [
  {
    bg: ['🌳', '🌿', '☀️', '🌸', '🏠', '🦋', '🍀', '🌺', '⭐', '🍎', '🍐', '🌈', '🌙', '🌻', '🍃'],
    diffs: [
      { x: 12, y: 15, left: '🟡', right: '🟢' },
      { x: 65, y: 30, left: '🌸', right: '🌺' },
      { x: 35, y: 65, left: '⭐', right: '🌟' },
      { x: 82, y: 20, left: '🍎', right: '🍐' },
      { x: 50, y: 80, left: '🔵', right: '🟣' },
    ],
  },
  {
    bg: ['🐱', '🌸', '🌙', '🐰', '☀️', '🍕', '🍔', '🚗', '🎈', '🎉', '🌊', '🏀', '🎵', '💡', '🐟'],
    diffs: [
      { x: 15, y: 25, left: '🐱', right: '🐶' },
      { x: 70, y: 45, left: '🌙', right: '☀️' },
      { x: 30, y: 75, left: '🍕', right: '🍔' },
      { x: 85, y: 12, left: '🚗', right: '🚕' },
      { x: 50, y: 60, left: '🎈', right: '🎉' },
    ],
  },
]

/** 生成某一侧的图片网格（5行×3列） */
function buildGrid(bg: string[], diffs: DiffItem[], useRight: boolean): string[] {
  const grid = [...bg]
  diffs.forEach(d => {
    // 将百分比位置转换到 5×3 网格索引
    const row = Math.floor(d.y / 20)
    const col = Math.floor(d.x / 33)
    const idx = Math.min(row * 3 + col, grid.length - 1)
    grid[idx] = useRight ? d.right : d.left
  })
  return grid
}

export default function SpotDifference() {
  const [level, setLevel] = useState(0)
  const [found, setFound] = useState<Set<number>>(new Set())
  const [showHint, setShowHint] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const { updateGameRecord } = useProgress()

  const config = levels[level]
  const totalDiffs = config.diffs.length
  const isWon = found.size === totalDiffs
  const leftGrid = buildGrid(config.bg, config.diffs, false)
  const rightGrid = buildGrid(config.bg, config.diffs, true)

  const handleLeftClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isWon || feedback !== null) return
    playClickSound()

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // 找最近的未找到差异（15% 半径内）
    let bestIdx = -1
    let bestDist = 25
    for (let i = 0; i < config.diffs.length; i++) {
      if (found.has(i)) continue
      const d = config.diffs[i]
      const dist = Math.hypot(x - d.x, y - d.y)
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }

    if (bestIdx >= 0) {
      setFound(prev => {
        const next = new Set(prev)
        next.add(bestIdx)
        if (next.size === totalDiffs) {
          updateGameRecord({ spotDifferenceCompleted: 1 })
        }
        return next
      })
      setFeedback('correct')
      playCorrectSound()
      setTimeout(() => setFeedback(null), 800)
    } else {
      setFeedback('wrong')
      playWrongSound()
      setTimeout(() => setFeedback(null), 600)
    }
  }, [isWon, feedback, config.diffs, found, totalDiffs, updateGameRecord])

  const nextLevel = () => {
    if (level < levels.length - 1) setLevel(l => l + 1)
    else setLevel(0)
    setFound(new Set())
    setShowHint(false)
    setFeedback(null)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h2 className="text-2xl font-bold text-purple-700">🔍 找不同</h2>
      <div className="flex gap-4 text-sm text-gray-500">
        <span>找到 {found.size} / {totalDiffs}</span>
        <span>关卡 {level + 1} / {levels.length}</span>
      </div>

      {/* 反馈 */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            key="ok"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-green-100 text-green-700 px-5 py-2 rounded-full font-bold text-lg"
          >
            ✅ 找到了！
          </motion.div>
        )}
        {feedback === 'wrong' && (
          <motion.div
            key="no"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-red-100 text-red-500 px-5 py-2 rounded-full font-bold text-lg"
          >
            ❌ 不在这里哦
          </motion.div>
        )}
      </AnimatePresence>

      {isWon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-green-100 text-green-700 px-6 py-3 rounded-full text-lg font-bold"
        >
          🎉 全部找到啦！
        </motion.div>
      )}

      {/* 左右对照图 */}
      <div className="flex gap-3">
        {/* 左图：可点击 */}
        <div
          onClick={handleLeftClick}
          className="relative w-44 h-64 md:w-56 md:h-72 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-md overflow-hidden cursor-pointer"
        >
          <div className="grid grid-cols-3 grid-rows-5 w-full h-full p-2 gap-0.5">
            {leftGrid.map((emoji, i) => (
              <div key={i} className="flex items-center justify-center text-xl md:text-2xl">
                {emoji}
              </div>
            ))}
          </div>
          {/* 已找到标记 */}
          {Array.from(found).map(i => {
            const d = config.diffs[i]
            return (
              <div key={`f-${i}`}
                className="absolute w-5 h-5 bg-green-400/60 rounded-full border-2 border-green-500 pointer-events-none"
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
              />
            )
          })}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 bg-white/60 px-2 rounded-full">
            点击这里
          </div>
        </div>

        {/* 右图：静态对照 */}
        <div className="relative w-44 h-64 md:w-56 md:h-72 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl shadow-md overflow-hidden">
          <div className="grid grid-cols-3 grid-rows-5 w-full h-full p-2 gap-0.5">
            {rightGrid.map((emoji, i) => (
              <div key={i} className="flex items-center justify-center text-xl md:text-2xl">
                {emoji}
              </div>
            ))}
          </div>
          {/* 提示标记 */}
          {showHint && !isWon && config.diffs.map((d, i) => (
            !found.has(i) && (
              <div key={`h-${i}`}
                className="absolute w-5 h-5 bg-red-400/50 rounded-full border-2 border-red-500 animate-ping pointer-events-none"
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
              />
            )
          ))}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 bg-white/60 px-2 rounded-full">
            对照图
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowHint(h => !h)}
          className="bg-yellow-400 text-white px-4 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors"
        >
          {showHint ? '🙈 隐藏提示' : '💡 提示'}
        </button>
        {isWon && (
          <button onClick={nextLevel}
            className="bg-purple-500 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-600 transition-colors"
          >
            {level < levels.length - 1 ? '👉 下一关' : '🔄 重新开始'}
          </button>
        )}
      </div>
    </div>
  )
}
