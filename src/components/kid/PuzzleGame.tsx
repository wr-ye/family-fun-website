import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useProgress } from '@/hooks/useProgress'
import { playMoveSound, playCelebrationSound } from '@/utils/sounds'

const GRID = 3
const TOTAL = GRID * GRID

const emojis = ['🐱', '🐶', '🐰', '🐼', '🦁', '🐸', '🐟', '🦋', '🐷']

function countInversions(arr: number[]): number {
  let inv = 0
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] && arr[j] && arr[i] > arr[j]) inv++
    }
  }
  return inv
}

function isSolvable(arr: number[]): boolean {
  return countInversions(arr) % 2 === 0
}

function createPuzzle(): number[] {
  // 重复洗牌直到可解（50% 概率，平均 2 次）
  for (;;) {
    const arr = Array.from({ length: TOTAL }, (_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    if (isSolvable(arr)) return arr
  }
}

function isSolved(arr: number[]): boolean {
  for (let i = 0; i < TOTAL - 1; i++) {
    if (arr[i] !== i + 1) return false
  }
  return arr[TOTAL - 1] === 0
}

export default function PuzzleGame() {
  const [tiles, setTiles] = useState<number[]>(createPuzzle)
  const [won, setWon] = useState(false)
  const [moves, setMoves] = useState(0)
  const { updateGameRecord } = useProgress()

  const handleClick = useCallback((index: number) => {
    if (won) return
    if (tiles[index] === 0) return

    const emptyIdx = tiles.indexOf(0)
    const row = Math.floor(index / GRID)
    const col = index % GRID
    const emptyRow = Math.floor(emptyIdx / GRID)
    const emptyCol = emptyIdx % GRID

    if (
      (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
      (col === emptyCol && Math.abs(row - emptyRow) === 1)
    ) {
      const newTiles = [...tiles]
      ;[newTiles[index], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[index]]
      setTiles(newTiles)
      setMoves(m => m + 1)
      playMoveSound()

      if (isSolved(newTiles)) {
        setWon(true)
        playCelebrationSound()
        updateGameRecord({ puzzleCompleted: 1 })
      }
    }
  }, [tiles, won, updateGameRecord])

  const restart = () => {
    setTiles(createPuzzle())
    setWon(false)
    setMoves(0)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h2 className="text-2xl font-bold text-purple-700">🧩 拼图游戏</h2>
      <p className="text-sm text-gray-500">点击方块移到空格位置</p>

      {/* 参考图：拼好后的样子 */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-gray-400">完成后的样子 👇</span>
        <div className="grid grid-cols-3 gap-0.5 bg-purple-200/30 p-1 rounded-xl">
          {emojis.map((e, i) => (
            <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white/50 flex items-center justify-center text-lg md:text-xl">
              {e}
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-400">步数：{moves}</p>

      {/* 拼图区域 */}
      <div
        className="grid gap-1 bg-purple-100 p-2 rounded-2xl shadow-lg"
        style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
      >
        {tiles.map((tile, idx) => (
          <motion.button
            key={idx}
            layout
            onClick={() => handleClick(idx)}
            whileTap={{ scale: 0.9 }}
            className={`relative w-20 h-20 md:w-24 md:h-24 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${
              tile === 0
                ? 'bg-transparent cursor-default'
                : 'bg-white shadow-md hover:shadow-lg cursor-pointer hover:bg-purple-50 active:bg-purple-100'
            }`}
          >
            {tile !== 0 && (
              <>
                <span className="text-3xl md:text-4xl">{emojis[tile - 1]}</span>
                {/* 小数字序号帮助孩子识别顺序 */}
                <span className="absolute bottom-0.5 right-1.5 text-[10px] text-gray-300 font-mono">
                  {tile}
                </span>
              </>
            )}
          </motion.button>
        ))}
      </div>

      {won && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="bg-green-100 text-green-700 px-6 py-3 rounded-full text-lg font-bold">
            🎉 拼好了！真棒！
          </div>
          <button
            onClick={restart}
            className="bg-purple-500 text-white px-6 py-3 rounded-full font-bold hover:bg-purple-600 transition-colors"
          >
            🔄 再玩一次
          </button>
        </motion.div>
      )}
    </div>
  )
}
