import { useState, useRef, useCallback } from 'react'
import { Download, RotateCcw, Eraser } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

const colors = [
  '#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C',
  '#74C0FC', '#B197FC', '#F783AC', '#FF8787',
  '#20C997', '#748FFC', '#F06595', '#845EF7',
]

const templates = [
  { id: 'apple', name: '🍎 苹果', path: 'M50 10 C55 10 60 15 60 25 C65 25 70 30 68 38 C66 46 58 50 50 55 C42 50 34 46 32 38 C30 30 35 25 40 25 C40 15 45 10 50 10Z' },
  { id: 'star', name: '⭐ 星星', path: 'M50 5 L63 38 L98 38 L70 60 L80 95 L50 75 L20 95 L30 60 L2 38 L37 38Z' },
  { id: 'heart', name: '❤️ 爱心', path: 'M50 88 C20 60 0 40 0 20 C0 5 15 0 25 5 C35 10 45 25 50 35 C55 25 65 10 75 5 C85 0 100 5 100 20 C100 40 80 60 50 88Z' },
  { id: 'cloud', name: '☁️ 云朵', path: 'M30 70 C10 70 0 55 10 40 C15 30 30 25 40 25 C45 10 60 5 75 15 C85 20 90 35 85 45 C95 50 95 70 80 70Z' },
]

export default function ColoringPage() {
  const [selectedColor, setSelectedColor] = useState(colors[0])
  const [useEraser, setUseEraser] = useState(false)
  const [filledRegions, setFilledRegions] = useState<Record<string, string>>({})
  const svgRef = useRef<SVGSVGElement>(null)
  const [activeTemplate, setActiveTemplate] = useState(templates[0])
  const { incrementColoring } = useProgress()

  const handleFill = useCallback((regionId: string) => {
    if (useEraser) {
      setFilledRegions(prev => {
        const next = { ...prev }
        delete next[regionId]
        return next
      })
    } else {
      setFilledRegions(prev => ({ ...prev, [regionId]: selectedColor }))
    }
  }, [selectedColor, useEraser])

  const clearAll = () => setFilledRegions({})

  const saveImage = () => {
    const svg = svgRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `涂色-${activeTemplate.name}.svg`
    a.click()
    URL.revokeObjectURL(url)
    incrementColoring()
  }

  // 将模板拆成多个可填色区域
  const getRegions = (template: typeof templates[0]) => {
    const regions: { id: string; d: string }[] = []
    const parts = template.path.match(/M[^MZ]+[Z]/g)
    if (parts) {
      parts.forEach((part, i) => {
        regions.push({ id: `${template.id}-${i}`, d: part })
      })
    } else {
      regions.push({ id: `${template.id}-0`, d: template.path })
    }
    return regions
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <h2 className="text-2xl font-bold text-purple-700">🎨 画画涂色</h2>

      {/* 模板选择 */}
      <div className="flex flex-wrap justify-center gap-2">
        {templates.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTemplate(t); setFilledRegions({}) }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTemplate.id === t.id
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-600 hover:bg-purple-100'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* 画布 */}
      <div className="bg-white rounded-3xl shadow-xl p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className="w-64 h-64 md:w-80 md:h-80"
          xmlns="http://www.w3.org/2000/svg"
        >
          {getRegions(activeTemplate).map(region => (
            <path
              key={region.id}
              d={region.d}
              fill={filledRegions[region.id] || '#f0f0f0'}
              stroke="#333"
              strokeWidth="1.5"
              strokeLinejoin="round"
              onClick={() => handleFill(region.id)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          ))}
        </svg>
      </div>

      {/* 调色板 */}
      <div className="flex flex-wrap justify-center gap-2">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => { setSelectedColor(color); setUseEraser(false) }}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedColor === color && !useEraser ? 'border-gray-800 scale-125' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
        <button
          onClick={() => setUseEraser(e => !e)}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
            useEraser ? 'border-red-500 bg-red-100' : 'border-gray-300 bg-white'
          }`}
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={clearAll}
          className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full font-bold hover:bg-gray-300 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" /> 清空
        </button>
        <button
          onClick={saveImage}
          className="bg-green-500 text-white px-4 py-2 rounded-full font-bold hover:bg-green-600 transition-colors flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> 保存
        </button>
      </div>
    </div>
  )
}
