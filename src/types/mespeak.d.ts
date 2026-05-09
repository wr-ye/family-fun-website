declare module 'mespeak' {
  interface SpeakOptions {
    amplitude?: number
    pitch?: number
    speed?: number
    voice?: string
    wordgap?: number
    volume?: number
    rawdata?: string
  }

  interface MeSpeakStatic {
    speak(str: string, options?: SpeakOptions): void
    loadConfig(config: string | object, callback?: () => void): void
    loadVoice(voice: string | object, callback?: (success: boolean, id: string) => void): void
    setDefaultVoice(voice: string): void
    getDefaultVoice(): string
    isConfigLoaded(): boolean
    isVoiceLoaded(voice?: string): boolean
    resetQueue(): void
    canPlay(): boolean
    setVolume(volume: number): void
    getVolume(): number
    play(stream: any, volume?: number): void
  }

  const meSpeak: MeSpeakStatic
  export default meSpeak
}
