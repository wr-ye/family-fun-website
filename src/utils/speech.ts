/**
 * 语音朗读工具
 *
 * 策略：代理 TTS 立即触发，Web Speech 等 200ms 再并行尝试（双路竞争）
 */

let speakingId = 0
let currentAudio: HTMLAudioElement | null = null

function calcTimeout(text: string): number {
  return Math.max(text.length * 400 + 3000, 6000)
}

/** 通过 TTS 代理请求语音（百度/有道/腾讯三级备用） */
function playProxyTTS(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const clean = text.replace(/[^\u4e00-\u9fff0-9]/g, ' ').trim() || text
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
    // 强制触发 voices 加载
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

  // === 代理 TTS 立即触发（不走 Web Speech 的延迟）===
  playProxyTTS(text, id).then(ok => {
    if (ok && id === speakingId) console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
  })

  // === Web Speech 200ms 后尝试（双保险，可能更快但不可靠）===
  setTimeout(() => {
    if (id !== speakingId) return
    const synth = window.speechSynthesis
    if (!synth) return

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 0.85
    u.pitch = 1.0
    u.volume = 1

    let started = false
    u.onstart = () => {
      started = true
      // Web Speech 先发出来了 → 停止代理 TTS
      if (currentAudio) { try { currentAudio.pause(); currentAudio.src = '' } catch {}; currentAudio = null }
      if (id === speakingId) console.log('[语音] Web Speech 开始 ✓')
    }
    u.onend = () => { if (id === speakingId && started) console.log(`[语音] ✓ "${text.substring(0, 20)}"`) }
    u.onerror = () => {
      if (started) return // 已经开始的忽略
      if (id === speakingId) console.warn('[语音] Web Speech 失败（正常，不影响代理）')
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
