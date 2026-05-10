/**
 * 语音朗读工具
 *
 * 策略：代理 TTS 立即触发，Web Speech 200ms 后备用（双保险）
 */

let speakingId = 0
let currentAudio: HTMLAudioElement | null = null

function calcTimeout(text: string): number {
  return Math.max(text.length * 400 + 3000, 6000)
}

/** 多音字纠错：替换成 TTS 能正确朗读的文本 */
function fixPolyphone(text: string): string {
  // "数一数" 会被 TTS 读成 sūyīsū，改用带上下文的形式
  return text.replace(/数一数/g, '数一数个数')
}

/** 通过 TTS 代理请求语音（百度/有道/腾讯三级备用） */
function playProxyTTS(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const speechText = fixPolyphone(text)
      const clean = speechText.replace(/[^\u4e00-\u9fff0-9]/g, ' ').trim() || text
      const proxyUrl = `/tts?audio=${encodeURIComponent(clean)}`

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
              console.warn(`[语音] 代理 TTS 无声, ${audio.duration.toFixed(2)}s`)
              resolve(false)
            } else {
              resolve(true)
            }
          }
          audio.onerror = () => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false) }

          audio.play().then(() => {
            if (id === speakingId) console.log(`[语音] 代理: "${clean.substring(0, 20)}" (${(blob.size / 1024).toFixed(0)}KB)`)
          }).catch(() => { URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false) })
        })
        .catch(e => {
          if (id === speakingId) console.warn('[语音] 代理 TTS 失败:', e.message)
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

  // === 代理 TTS 立即触发（预处理多音字）===
  playProxyTTS(text, id)

  // === Web Speech 200ms 后备用 ===
  setTimeout(() => {
    if (id !== speakingId) return
    const synth = window.speechSynthesis
    if (!synth || synth.speaking) return
    if (currentAudio) return

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 0.85
    u.pitch = 1.0
    u.volume = 1

    let started = false
    u.onstart = () => {
      started = true
      if (id === speakingId) console.log('[语音] Web Speech ✓')
    }
    u.onend = () => { if (id === speakingId && started) console.log(`[语音] ✓ "${text.substring(0, 20)}"`) }
    u.onerror = () => {
      if (started) return
      if (id === speakingId) console.warn('[语音] Web Speech 失败')
    }

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
