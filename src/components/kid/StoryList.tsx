import { useNavigate } from 'react-router'
import { stories } from '@/data/stories'
import { useProgress } from '@/hooks/useProgress'

export default function StoryList() {
  const navigate = useNavigate()
  const { progress } = useProgress()

  return (
    <div className="flex flex-col gap-4 py-4">
      <h1 className="text-3xl font-black text-center text-purple-700">📖 有声故事</h1>
      <p className="text-center text-gray-500">选择想听的故事吧！</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {stories.map(story => (
          <button
            key={story.id}
            onClick={() => navigate(`/stories/${story.id}`)}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all flex items-center gap-4 hover:scale-[1.02]"
          >
            <span className="text-5xl">{story.emoji}</span>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-800">{story.title}</h3>
              <p className="text-sm text-gray-400">{story.pages.length} 页</p>
            </div>
            {progress.storiesRead.includes(story.id) && (
              <span className="ml-auto text-green-500 text-lg">✅</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
