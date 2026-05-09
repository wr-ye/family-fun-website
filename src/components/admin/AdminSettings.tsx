import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useProgress } from '@/hooks/useProgress'

export default function AdminSettings() {
  const { progress, resetProgress } = useProgress()
  const [name, setName] = useState(progress.name)
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const saveName = () => {
    if (name.trim()) {
      progress.name = name.trim()
      localStorage.setItem('kid-progress', JSON.stringify(progress))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleReset = () => {
    resetProgress()
    setShowReset(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">设置</h1>

      {/* 孩子名字 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <label className="text-sm text-gray-400 block mb-2">👶 孩子名字</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            placeholder="输入名字"
          />
          <button
            onClick={saveName}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg text-sm transition-colors"
          >
            {saved ? '✅ 已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* 数据重置 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <label className="text-sm text-gray-400 block mb-2">⚠️ 数据管理</label>
        <p className="text-xs text-gray-500 mb-3">重置后会清除所有学习记录</p>
        {!showReset ? (
          <button
            onClick={() => setShowReset(true)}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
          >
            🗑️ 重置所有数据
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
            >
              确认重置
            </button>
            <button
              onClick={() => setShowReset(false)}
              className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:text-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 关于 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <label className="text-sm text-gray-400 block mb-2">ℹ️ 关于</label>
        <p className="text-xs text-gray-500">🌈 家庭趣味学习乐园 v1.0</p>
        <p className="text-xs text-gray-500">为 3-6 岁儿童设计</p>
      </div>
    </div>
  )
}
