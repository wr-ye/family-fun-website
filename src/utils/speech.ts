/**
 * 语音朗读工具
 *
 * 分层方案：
 * 1. 百度翻译 TTS（通过 Vite 代理，音质好）
 * 2. Web Speech API（浏览器原生）
 * 3. 有道词典 TTS（<audio> 直接播放）
 * 4. meSpeak（eSpeak WASM 引擎，完全离线）
 *
 * 关键特性：
 * - 串行锁：同一时间只有一次朗读，快速点击自动重启覆盖
 * - 动态超时：根据文本长度计算，长句子读得完
 * - 停止全链路：同时停 Web Speech + audio 元素
 */

// ====== 串行锁 ======
let speakingId = 0          // 每次 speak 递增，旧 ID 失效
let currentAudio: HTMLAudioElement | null = null

// ====== 工具函数 ======
function calcTimeout(text: string): number {
  return Math.max(text.length * 400 + 3000, 6000)
}

// ====== 第1层：百度翻译 TTS（通过 Vite 代理）======
function playBaiduProxy(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const url = `/tts?lan=zh&text=${encodeURIComponent(text)}&spd=3&source=web`
      fetch(url).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.blob()
      }).then(blob => {
        if (id !== speakingId) { resolve(false); return } // 已被新请求覆盖
        if (blob.size < 100) throw new Error('Audio too small')
        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        audio.volume = 1
        currentAudio = audio

        audio.onended = () => {
          if (id === speakingId) { URL.revokeObjectURL(audioUrl); currentAudio = null }
          resolve(true)
        }
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false)
        }

        audio.play().then(() => {
          if (id === speakingId) console.log(`[语音] 百度 TTS: "${text.substring(0, 20)}" (${(blob.size / 1024).toFixed(0)}KB)`)
        }).catch(() => {
          URL.revokeObjectURL(audioUrl); currentAudio = null; resolve(false)
        })
      }).catch(e => {
        if (id === speakingId) console.warn('[语音] 百度 TTS 失败:', e.message)
        resolve(false)
      })
      setTimeout(() => resolve(false), calcTimeout(text) + 3000)
    } catch { resolve(false) }
  })
}

// ====== 第2层：Web Speech API ======
function playWebSpeech(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const synth = window.speechSynthesis
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'zh-CN'
      u.rate = 0.85
      u.pitch = 1.0

      let started = false
      const timeout = calcTimeout(text)

      u.onstart = () => {
        if (id === speakingId) console.log(`[语音] Web Speech 已启动 (超时 ${(timeout / 1000).toFixed(0)}s)`)
        started = true
      }
      u.onend = () => { if (id === speakingId) resolve(true); else resolve(false) }
      u.onerror = () => resolve(false)

      synth.speak(u)

      setTimeout(() => { if (!started) resolve(false) }, 3000)
      setTimeout(() => { if (started && id === speakingId) resolve(false) }, timeout)
    } catch { resolve(false) }
  })
}

// ====== 第3层：有道词典 TTS（<audio> 直接播放）=====
function playYoudaoTTS(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio()
      audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=0`
      audio.volume = 1
      currentAudio = audio

      audio.onended = () => { currentAudio = null; resolve(true) }
      audio.onerror = () => { currentAudio = null; resolve(false) }

      audio.play().then(() => {
        if (id === speakingId) console.log(`[语音] 有道 TTS: "${text.substring(0, 20)}"`)
      }).catch(() => { currentAudio = null; resolve(false) })

      setTimeout(() => resolve(false), calcTimeout(text) + 3000)
    } catch { resolve(false) }
  })
}

// ====== 第4层：meSpeak（离线 eSpeak 引擎）=====
let meSpeakLoaded = false
async function playMeSpeak(text: string, id: number): Promise<boolean> {
  try {
    if (!meSpeakLoaded) {
      const meSpeak = (await import('mespeak')).default
      const config = await import('mespeak/src/mespeak_config.json')
      meSpeak.loadConfig(config)
      const zhVoice = await import('mespeak/voices/zh.json')
      meSpeak.loadVoice(zhVoice)
      meSpeak.setDefaultVoice('zh')
      meSpeakLoaded = true
    }
    const meSpeak = (await import('mespeak')).default
    meSpeak.speak(text, { speed: 180, pitch: 55, amplitude: 90 })
    if (id === speakingId) console.log(`[语音] meSpeak: "${text.substring(0, 20)}"`)
    return true
  } catch {
    return false
  }
}

// ====== 导出接口 ======
let initialized = false

/** 初始化语音 */
export function initSpeech() {
  if (initialized) return
  initialized = true
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }
}

/** 朗读中文文本 */
export async function speak(text: string) {
  if (!text || text.trim().length === 0) return

  // 递增 ID，使之前的 speak 自动失效
  const id = ++speakingId
  // 停止之前的播放
  stopInternal()

  let ok = false

  if (text.length <= 50) {
    ok = await playBaiduProxy(text, id)
    if (!ok && id === speakingId) ok = await playWebSpeech(text, id)
    if (!ok && id === speakingId) ok = await playYoudaoTTS(text, id)
  } else {
    ok = await playWebSpeech(text, id)
    if (!ok && id === speakingId) ok = await playBaiduProxy(text, id)
  }

  // 最后尝试 meSpeak（只对短文本）
  if (!ok && id === speakingId && text.length <= 30) {
    ok = await playMeSpeak(text, id)
  }

  if (ok && id === speakingId) {
    console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
  } else if (id === speakingId) {
    console.warn(`[语音] ✗ 全部失败: "${text.substring(0, 20)}"`)
  }
}

function stopInternal() {
  try {
    window.speechSynthesis?.cancel()
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      currentAudio = null
    }
  } catch {}
}

/** 停止朗读 */
export function stopSpeaking() {
  speakingId++
  stopInternal()
}
