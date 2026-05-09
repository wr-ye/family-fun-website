import { useState } from 'react'
import { words } from '@/data/words'
import { stories } from '@/data/stories'

type Tab = 'words' | 'stories'

export default function AdminContent() {
  const [tab, setTab] = useState<Tab>('words')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">内容管理</h1>

      {/* Tab 切换 */}
      <div className="flex gap-2 bg-gray-900 p-1 rounded-lg w-fit border border-gray-800">
        <button
          onClick={() => setTab('words')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'words' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🔤 认字卡片 ({words.length})
        </button>
        <button
          onClick={() => setTab('stories')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'stories' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📖 故事 ({stories.length})
        </button>
      </div>

      {/* 认字卡片列表 */}
      {tab === 'words' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500">
                  <th className="text-left p-3">图标</th>
                  <th className="text-left p-3">中文</th>
                  <th className="text-left p-3">拼音</th>
                  <th className="text-left p-3">英文</th>
                  <th className="text-left p-3">分类</th>
                </tr>
              </thead>
              <tbody>
                {words.map(w => (
                  <tr key={w.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-3 text-xl">{w.emoji}</td>
                    <td className="p-3 text-white font-medium">{w.chinese}</td>
                    <td className="p-3 text-gray-400">{w.pinyin}</td>
                    <td className="p-3 text-gray-400">{w.english}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{w.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 故事列表 */}
      {tab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.map(s => (
            <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{s.emoji}</span>
                <h3 className="text-white font-bold">{s.title}</h3>
              </div>
              <p className="text-sm text-gray-500">{s.pages.length} 页</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
