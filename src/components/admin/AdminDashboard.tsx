import { useProgress } from '@/hooks/useProgress'

export default function AdminDashboard() {
  const { progress } = useProgress()

  const stats = [
    { label: '已学字词', value: progress.learnedWords.length, icon: '🔤', color: 'from-cyan-400 to-blue-500' },
    { label: '数学完成', value: progress.mathCompleted, icon: '🔢', color: 'from-purple-400 to-pink-500' },
    { label: '故事阅读', value: progress.storiesRead.length, icon: '📖', color: 'from-green-400 to-emerald-500' },
    { label: '游戏最高分', value: progress.gameRecords.memoryScore, icon: '🎮', color: 'from-orange-400 to-red-500' },
    { label: '涂色作品', value: progress.coloringSaves, icon: '🎨', color: 'from-pink-400 to-rose-500' },
    { label: '学习时长', value: `${Math.floor(progress.totalPlayMinutes)}分钟`, icon: '⏱️', color: 'from-blue-400 to-indigo-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">概览</h1>
        <p className="text-sm text-gray-500 mt-1">
          {progress.name} 的学习统计
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
