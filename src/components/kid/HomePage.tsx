import { useProgress } from '@/hooks/useProgress'
import EntryCard from './EntryCard'

export default function HomePage() {
  const { progress } = useProgress()

  return (
    <div className="flex flex-col gap-6">
      {/* 欢迎语 */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-black text-purple-700 mb-2">
          {progress.name}，欢迎来玩！🎉
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span>📚 学了 {progress.learnedWords.length} 个字</span>
          <span>⏱️ 玩了 {Math.floor(progress.totalPlayMinutes)} 分钟</span>
          <span>⭐ 完成了 {progress.mathCompleted + progress.gameRecords.puzzleCompleted} 个关卡</span>
        </div>
      </div>

      {/* 6 个入口卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <EntryCard
          to="/words"
          emoji="🔤"
          title="认字识字"
          color="red"
          description="学汉字"
        />
        <EntryCard
          to="/games"
          emoji="🎮"
          title="趣味游戏"
          color="orange"
          description="玩中学"
        />
        <EntryCard
          to="/stories"
          emoji="📖"
          title="有声故事"
          color="green"
          description="听故事"
        />
        <EntryCard
          to="/coloring"
          emoji="🎨"
          title="画画涂色"
          color="blue"
          description="涂颜色"
        />
        <EntryCard
          to="/math"
          emoji="🔢"
          title="数学启蒙"
          color="purple"
          description="学数学"
        />
        <EntryCard
          to="/admin"
          emoji="⚙️"
          title="家长管理"
          color="pink"
          description="看记录"
        />
      </div>
    </div>
  )
}
