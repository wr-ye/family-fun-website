import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { Home } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'
import { initAudio } from '@/utils/sounds'
import { initSpeech } from '@/utils/speech'

export default function KidLayout() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  // 首次点击页面时初始化音频和语音
  useEffect(() => {
    const handler = () => {
      initAudio()
      initSpeech()
      document.removeEventListener('click', handler)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      {/* 顶部导航 */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-2xl font-bold text-purple-600 hover:text-purple-500 transition-colors"
          >
            🌈 趣味学习乐园
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
              👋 {progress.name}
            </span>
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors"
            >
              <Home className="w-5 h-5 text-purple-500" />
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
