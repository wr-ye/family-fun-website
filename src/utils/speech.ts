/**
 * 语音朗读工具
 *
 * 方案：
 * 1. Web Speech API（浏览器原生，查找中文语音）
 * 2. TTS 代理（有道中文语音 type=1，后备）
 */

let speakingId = 0
let currentAudio: HTMLAudioElement | null = null
let availableVoices: SpeechSynthesisVoice[] = []

function calcTimeout(text: string): number {
  return Math.max(text.length * 400 + 3000, 6000)
}

/** 获取中文语音 */
function getChineseVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (availableVoices.length === 0) {
    availableVoices = synth.getVoices()
  }
  // 优先找 lang 包含 zh 的
  const zh = availableVoices.find(v => v.lang.includes('zh'))
  if (zh) {
    console.log('[语音] 找到中文语音:', zh.name, zh.lang)
    return zh
  }
  // 其次找任何中文相关的
  const any = availableVoices.find(v => v.lang.includes('CN') || v.lang.includes('cn'))
  if (any) {
    console.log('[语音] 找到中文语音(备用):', any.name, any.lang)
    return any
  }
  return null
}

/** 通过 TTS 代理请求语音 */
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
  const synth = window.speechSynthesis
  if (synth) {
    // 立即尝试获取 voices（有些浏览器需要）
    availableVoices = synth.getVoices()
    synth.onvoiceschanged = () => {
      availableVoices = synth.getVoices()
      console.log('[语音] voices loaded:', availableVoices.map(v => `${v.name}(${v.lang})`).slice(0, 10).join(', '))
    }
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

  const synth = window.speechSynthesis
  if (synth) {
    const voice = getChineseVoice(synth)

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = 0.85
    u.pitch = 1.0
    u.volume = 1
    if (voice) u.voice = voice

    let started = false
    u.onstart = () => {
      started = true
      if (id === speakingId) console.log('[语音] Web Speech 开始, voice:', voice?.name || 'default')
    }
    u.onend = () => {
      if (id === speakingId && started) console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
    }
    u.onerror = (e) => {
      if (id === speakingId) console.warn('[语音] Web Speech 错误:', e.error)
    }

    synth.speak(u)
  }

  // 代理 TTS 作为后备（1.5s 后）
  setTimeout(async () => {
    if (id !== speakingId) return
    const proxyOk = await playProxyTTS(text, id)
    if (proxyOk && id === speakingId) {
      console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
    } else if (id === speakingId) {
      console.warn(`[语音] ✗ 全部失败: "${text.substring(0, 20)}"`)
    }
  }, 1500)
}

export function stopSpeaking() {
  speakingId++
  try {
    window.speechSynthesis?.cancel()
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
  } catch {}
}
