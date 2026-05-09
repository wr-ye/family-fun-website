import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { KidProgress, DEFAULT_PROGRESS } from '@/types'

export function useProgress() {
  const [progress, setProgress] = useLocalStorage<KidProgress>('kid-progress', DEFAULT_PROGRESS)

  const learnWord = useCallback((wordId: string) => {
    setProgress(prev => {
      if (prev.learnedWords.includes(wordId)) return prev
      return { ...prev, learnedWords: [...prev.learnedWords, wordId] }
    })
  }, [setProgress])

  const addPlayTime = useCallback((minutes: number) => {
    setProgress(prev => ({ ...prev, totalPlayMinutes: prev.totalPlayMinutes + minutes }))
  }, [setProgress])

  const completeMath = useCallback(() => {
    setProgress(prev => ({ ...prev, mathCompleted: prev.mathCompleted + 1 }))
  }, [setProgress])

  const readStory = useCallback((storyId: string) => {
    setProgress(prev => {
      if (prev.storiesRead.includes(storyId)) return prev
      return { ...prev, storiesRead: [...prev.storiesRead, storyId] }
    })
  }, [setProgress])

  const updateGameRecord = useCallback((update: Partial<KidProgress['gameRecords']>) => {
    setProgress(prev => ({
      ...prev,
      gameRecords: { ...prev.gameRecords, ...update }
    }))
  }, [setProgress])

  const incrementColoring = useCallback(() => {
    setProgress(prev => ({ ...prev, coloringSaves: prev.coloringSaves + 1 }))
  }, [setProgress])

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS)
  }, [setProgress])

  return {
    progress,
    learnWord,
    addPlayTime,
    completeMath,
    readStory,
    updateGameRecord,
    incrementColoring,
    resetProgress,
    setProgress,
  }
}
