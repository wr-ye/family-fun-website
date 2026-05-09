export interface WordCard {
  id: string
  chinese: string
  pinyin: string
  english: string
  category: 'animals' | 'fruits' | 'colors' | 'numbers' | 'daily'
  emoji: string
}

export interface Story {
  id: string
  title: string
  emoji: string
  pages: StoryPage[]
}

export interface StoryPage {
  text: string
  image?: string
}

export interface MathQuestion {
  id: string
  type: 'count' | 'compare' | 'addsub'
  question: string
  emojis?: string
  options: number[]
  answer: number
}

export interface GameRecord {
  memoryScore: number
  puzzleCompleted: number
  spotDifferenceCompleted: number
}

export interface KidProgress {
  name: string
  learnedWords: string[]
  gameRecords: GameRecord
  totalPlayMinutes: number
  mathCompleted: number
  storiesRead: string[]
  coloringSaves: number
}

export interface AdminSettings {
  kidName: string
  pinCode: string
}

export const DEFAULT_PROGRESS: KidProgress = {
  name: '宝宝',
  learnedWords: [],
  gameRecords: { memoryScore: 0, puzzleCompleted: 0, spotDifferenceCompleted: 0 },
  totalPlayMinutes: 0,
  mathCompleted: 0,
  storiesRead: [],
  coloringSaves: 0,
}

export const DEFAULT_ADMIN: AdminSettings = {
  kidName: '宝宝',
  pinCode: '1234',
}
