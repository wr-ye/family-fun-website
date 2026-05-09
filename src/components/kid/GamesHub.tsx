import EntryCard from './EntryCard'

export default function GamesHub() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black text-center text-purple-700">🎮 趣味游戏</h1>
      <p className="text-center text-gray-500">选择一个游戏开始玩吧！</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <EntryCard
          to="/games/memory"
          emoji="🃏"
          title="配对记忆"
          color="orange"
          description="翻卡片找相同"
        />
        <EntryCard
          to="/games/puzzle"
          emoji="🧩"
          title="拼图游戏"
          color="green"
          description="拖动拼完整图"
        />
        <EntryCard
          to="/games/spot"
          emoji="🔍"
          title="找不同"
          color="blue"
          description="找出不同之处"
        />
      </div>
    </div>
  )
}
