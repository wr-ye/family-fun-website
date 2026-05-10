/**
 * 语音朗读工具
 *
 * 策略：
 * 1. preload() 提前下载音频（不播放）
 * 2. speak() 播放已缓存的音频，无网络延迟
 */

let speakingId = 0
let currentAudio: HTMLAudioElement | null = null

// 预加载缓存
const audioCache = new Map<string, Blob>()
let cacheId = 0

/** 预加载 TTS 音频（只下载不播放） */
export function preload(text: string) {
  if (audioCache.has(text)) return
  const clean = text.replace(/[^\u4e00-\u9fff0-9]/g, ' ').trim()
  const id = ++cacheId
  fetch(`/tts?audio=${encodeURIComponent(clean)}`)
    .then(r => r.blob())
    .then(blob => { if (blob.size >= 100) audioCache.set(text, blob) })
    .catch(() => {})
}

/** 播放预缓存或实时下载的 TTS 音频 */
function playFromCache(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tryPlay = (blob: Blob) => {
      if (id !== speakingId) { resolve(false); return }
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      audio.volume = 1
      currentAudio = audio

      let audioValid = true
      audio.addEventListener('loadedmetadata', () => { if (audio.duration < 0.3) audioValid = false })
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); currentAudio = null
        if (!audioValid && id === speakingId) {
          console.warn(`[语音] TTS 无声`)
          resolve(false)
        } else { resolve(true) }
      }
      audio.onerror = () => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false) }
      audio.play().then(() => {
        if (id === speakingId) console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
      }).catch(() => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false) })
    }

    // 有缓存 → 立即播放
    const cached = audioCache.get(text)
    if (cached) { tryPlay(cached); return }

    // 无缓存 → 实时下载
    const clean = text.replace(/[^\u4e00-\u9fff0-9]/g, ' ').trim()
    fetch(`/tts?audio=${encodeURIComponent(clean)}`)
      .then(r => r.blob())
      .then(blob => {
        if (blob.size >= 100) audioCache.set(text, blob)
        tryPlay(blob)
      })
      .catch(e => {
        if (id === speakingId) console.warn('[语音] TTS 失败:', e.message)
        resolve(false)
      })
  })
}

let initialized = false

export function initSpeech() {
  if (initialized) return
  initialized = true
  const synth = window.speechSynthesis
  if (synth) {
    synth.getVoices()
    synth.onvoiceschanged = () => {
      const voices = synth.getVoices()
      const zh = voices.find(v => v.lang.includes('zh'))
      console.log('[语音] voices loaded:', zh ? `${zh.name}(${zh.lang})` : 'no zh voice')
    }
  }
}

export function speak(text: string) {
  if (!text || text.trim().length === 0) return

  const id = ++speakingId

  // 停止正在播放的音频
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = '' } catch {}
    currentAudio = null
  }

  // 播放（优先用缓存，没有则实时下载）
  playFromCache(text, id)

  // Web Speech 200ms 后备用
  setTimeout(() => {
    if (id !== speakingId) return
    const synth = window.speechSynthesis
    if (!synth || synth.speaking) return
    if (currentAudio) return

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1.0; u.volume = 1
    let started = false
    u.onstart = () => { started = true; if (id === speakingId) console.log('[语音] Web Speech ✓') }
    u.onend = () => { if (id === speakingId && started) console.log(`[语音] ✓ "${text.substring(0, 20)}"`) }
    u.onerror = () => { if (started || id !== speakingId) return; console.warn('[语音] Web Speech 失败') }
    synth.speak(u)
  }, 200)
}

export function stopSpeaking() {
  speakingId++
  try {
    window.speechSynthesis?.cancel()
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
  } catch {}
}
