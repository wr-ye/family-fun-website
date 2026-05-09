import { Routes, Route, Navigate } from 'react-router'
import KidLayout from '@/components/kid/KidLayout'
import HomePage from '@/components/kid/HomePage'
import WordLearning from '@/components/kid/WordLearning'
import GamesHub from '@/components/kid/GamesHub'
import MemoryGame from '@/components/kid/MemoryGame'
import PuzzleGame from '@/components/kid/PuzzleGame'
import SpotDifference from '@/components/kid/SpotDifference'
import StoryList from '@/components/kid/StoryList'
import StoryReader from '@/components/kid/StoryReader'
import ColoringPage from '@/components/kid/ColoringPage'
import MathPage from '@/components/kid/MathPage'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/components/admin/AdminDashboard'
import AdminContent from '@/components/admin/AdminContent'
import AdminSettings from '@/components/admin/AdminSettings'

export default function AppRoutes() {
  return (
    <Routes>
      {/* 孩子端 */}
      <Route element={<KidLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/words" element={<WordLearning />} />
        <Route path="/games" element={<GamesHub />} />
        <Route path="/games/memory" element={<MemoryGame />} />
        <Route path="/games/puzzle" element={<PuzzleGame />} />
        <Route path="/games/spot" element={<SpotDifference />} />
        <Route path="/stories" element={<StoryList />} />
        <Route path="/stories/:id" element={<StoryReader />} />
        <Route path="/coloring" element={<ColoringPage />} />
        <Route path="/math" element={<MathPage />} />
      </Route>

      {/* 家长端 */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
