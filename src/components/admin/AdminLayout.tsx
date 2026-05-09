import { Outlet, useNavigate, useLocation } from 'react-router'
import { LayoutDashboard, FileText, Settings, ArrowLeft } from 'lucide-react'

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: '概览' },
  { path: '/admin/content', icon: FileText, label: '内容管理' },
  { path: '/admin/settings', icon: Settings, label: '设置' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">
      {/* 侧边栏 - COSMIC-UI 暗色风格 */}
      <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              家长管理
            </h1>
          </div>
          <p className="text-xs text-gray-500">COSMIC 控制台</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回儿童端
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
