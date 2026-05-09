import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, ChevronRight, Volume2, Pause, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { stories } from '@/data/stories'
import { speak, stopSpeaking } from '@/utils/speech'
import { useProgress } from '@/hooks/useProgress'

export default function StoryReader() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const { readStory } = useProgress()

  const story = stories.find(s => s.id === id)

  useEffect(() => {
    if (story) {
      readStory(story.id)
    }
  }, [story, readStory])

  if (!story) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">故事没找到 😅</p>
        <button onClick={() => navigate('/stories')} className="mt-4 text-purple-500 underline">返回</button>
      </div>
    )
  }

  const currentPage = story.pages[page]
  const totalPages = story.pages.length

  const togglePlay = async () => {
    stopSpeaking()
    setPlaying(true)
    await speak(currentPage.text)
    setPlaying(false)
  }

  const goPrev = () => {
    stopSpeaking()
    setPlaying(false)
    setPage(p => Math.max(0, p - 1))
  }

  const goNext = () => {
    stopSpeaking()
    setPlaying(false)
    if (page < totalPages - 1) {
      setPage(p => p + 1)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* 顶部导航 */}
      <div className="w-full flex items-center gap-3">
        <button
          onClick={() => navigate('/stories')}
          className="p-2 hover:bg-white/50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-purple-500" />
        </button>
        <h2 className="text-2xl font-bold text-purple-700">{story.emoji} {story.title}</h2>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-300"
          style={{ width: `${((page + 1) / totalPages) * 100}%` }}
        />
      </div>

      {/* 故事内容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg min-h-[250px] flex flex-col items-center justify-center"
        >
          <p className="text-xl md:text-2xl leading-relaxed text-gray-700 text-center">
            {currentPage.text}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* 控制按钮 */}
      <div className="flex items-center gap-6">
        <button
          onClick={goPrev}
          disabled={page === 0}
          className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-7 h-7 text-purple-500" />
        </button>

        <button
          onClick={togglePlay}
          className="bg-gradient-to-r from-purple-400 to-pink-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all"
        >
          {playing ? <Pause className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
        </button>

        <button
          onClick={goNext}
          disabled={page === totalPages - 1}
          className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-7 h-7 text-purple-500" />
        </button>
      </div>

      <span className="text-sm text-gray-400">
        第 {page + 1} 页 / 共 {totalPages} 页
      </span>

      {page === totalPages - 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-2"
        >
          <button
            onClick={() => navigate('/stories')}
            className="bg-green-500 text-white px-6 py-3 rounded-full font-bold hover:bg-green-600 transition-colors"
          >
            🎉 故事讲完啦！再看别的
          </button>
        </motion.div>
      )}
    </div>
  )
}
