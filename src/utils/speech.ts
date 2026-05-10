/**
 * 语音朗读工具
 *
 * 方案：
 * 1. Web Speech API（浏览器原生，同步触发）
 * 2. TTS 代理（有道中文语音 type=1，后备）
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
      // type=1 为中文语音
      const proxyUrl = `/tts?audio=${encodeURIComponent(clean)}&type=1`

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
            if (audio.duration < 0.3) audioValid = false
          })

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl)
            currentAudio = null
            if (!audioValid && id === speakingId) {
              console.warn(`[语音] 代理 TTS 无声, 时长 ${audio.duration.toFixed(2)}s`)
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

let initialized = false

export function initSpeech() {
  if (initialized) return
  initialized = true
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }
}

export function speak(text: string) {
  if (!text || text.trim().length === 0) return

  const id = ++speakingId

  // 停止正在播放的 HTML 音频
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = '' } catch {}
    currentAudio = null
  }

  // === 方案1: Web Speech API（同步！不中断用户手势链） ===
  const synth = window.speechSynthesis
  if (synth) {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      u.rate = 0.85
      u.pitch = 1.0
      u.volume = 1

      let started = false
      u.onstart = () => {
        started = true
        if (id === speakingId) console.log('[语音] Web Speech 开始')
      }
      u.onend = () => {
        if (id === speakingId && started) console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
      }
      u.onerror = () => { if (id === speakingId) console.warn('[语音] Web Speech 错误') }

      synth.speak(u)
    } catch {}
  }

  // === 方案2: 代理 TTS（异步并行，等 1s 再决定是否必需） ===
  setTimeout(async () => {
    if (id !== speakingId) return
    // 1s 后 Web Speech 还没发声 → 走代理
    console.warn('[语音] Web Speech 1s 超时，尝试代理 TTS...')
    const proxyOk = await playProxyTTS(text, id)
    if (proxyOk && id === speakingId) {
      console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
    } else if (id === speakingId) {
      console.warn(`[语音] ✗ 全部失败: "${text.substring(0, 20)}"`)
    }
  }, 1000)
}
