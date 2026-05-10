/**
 * 语音朗读工具
 *
 * 方案：
 * 1. Web Speech API（浏览器原生，优先）
 * 2. TTS 代理（Cloudflare Function 后备）
 */

let speakingId = 0
let currentAudio: HTMLAudioElement | null = null

function calcTimeout(text: string): number {
  return Math.max(text.length * 400 + 3000, 6000)
}

/** 通过 TTS 代理请求语音 */
function playProxyTTS(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const clean = text.replace(/[^\u4e00-\u9fff0-9]/g, ' ').trim() || text
      const proxyUrl = `/tts?audio=${encodeURIComponent(clean)}&type=0`

      fetch(proxyUrl)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.blob()
        })
        .then(blob => {
          if (blob.size < 100) throw new Error('Audio too small')
          if (id !== speakingId) { resolve(false); return }

          const audioUrl = URL.createObjectURL(blob)
          const audio = new Audio(audioUrl)
          audio.volume = 1
          currentAudio = audio

          let audioValid = true
          audio.addEventListener('loadedmetadata', () => {
            if (audio.duration < 0.3) {
              audioValid = false
            }
          })

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            currentAudio = null
            if (!audioValid && id === speakingId) {
              console.warn(`[语音] 代理 TTS 音频无效（时长 ${audio.duration.toFixed(2)}s），跳过`)
              resolve(false)
            } else {
              resolve(true)
            }
          }
          audio.onerror = () => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false) }

          audio.play().then(() => {
            if (id === speakingId) console.log(`[语音] 代理 TTS: "${clean.substring(0, 20)}" (${(blob.size / 1024).toFixed(0)}KB)`)
          }).catch(() => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false) })
        })
        .catch(e => {
          if (id === speakingId) console.warn('[语音] 代理 TTS 请求失败:', e.message)
          resolve(false)
        })

      setTimeout(() => resolve(false), calcTimeout(text) + 5000)
    } catch { resolve(false) }
  })
}

/** Web Speech API（浏览器原生语音） */
function playWebSpeech(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis
      if (!synth) { resolve(false); return }

      // 确保 voices 已加载
      if (synth.getVoices().length === 0) {
        synth.getVoices()
      }

      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      u.rate = 0.85
      u.pitch = 1.0

      let started = false
      const timeout = calcTimeout(text)
      u.onstart = () => {
        started = true
        if (id === speakingId) console.log(`[语音] Web Speech (超时 ${(timeout / 1000).toFixed(0)}s)`)
      }
      u.onend = () => { if (id === speakingId) resolve(true) }
      u.onerror = () => { if (id === speakingId) resolve(false) }

      synth.speak(u)
      setTimeout(() => { if (!started) resolve(false) }, 3000)
      setTimeout(() => { if (started && id === speakingId) resolve(false) }, timeout)
    } catch { resolve(false) }
  })
}

let initialized = false

export function initSpeech() {
  if (initialized) return
  initialized = true
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }
}

export async function speak(text: string) {
  if (!text || text.trim().length === 0) return

  const id = ++speakingId

  // 停止正在播放的音频（只停 HTMLAudioElement，不动 speechSynthesis）
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = '' } catch {}
    currentAudio = null
  }

  // ⚠️ 重要：Chrome 中 cancel() 后立刻 speak() 会导致无声，
  // 因此先把 cancel 推迟到 speak 之前的一个微任务
  await new Promise(r => setTimeout(r, 0))

  // Web Speech API 优先
  const ok = await playWebSpeech(text, id)
  // 代理 TTS 作为后备
  if (ok && id === speakingId) {
    console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
  } else if (id === speakingId) {
    console.warn(`[语音] Web Speech 不可用，尝试代理 TTS...`)
    const proxyOk = await playProxyTTS(text, id)
    if (proxyOk && id === speakingId) {
      console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
    } else if (id === speakingId) {
      console.warn(`[语音] ✗ 全部失败: "${text.substring(0, 20)}"`)
    }
  }
}

export function stopSpeaking() {
  speakingId++
  try {
    window.speechSynthesis?.cancel()
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
  } catch {}
}
