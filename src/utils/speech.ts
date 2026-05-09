/**
 * 语音朗读工具
 *
 * 部署环境方案（无 Vite 代理）：
 * 1. 有道词典 TTS（<audio> 直接播放，无需跨域许可）
 * 2. Web Speech API（浏览器原生，有中文语音时可用）
 */

let speakingId = 0
let currentAudio: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null

// ====== 工具 ======
function calcTimeout(text: string): number {
  return Math.max(text.length * 400 + 3000, 6000)
}

/** 恢复 AudioContext（浏览器自动暂停策略） */
function ensureAudio() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
  } catch {}
}

// ====== 第1层：有道词典 TTS（<audio> 直接播放）=====
function playYoudaoTTS(text: string, id: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // 只提取中文字符，去掉英文和标点（TTS 只处理中文效果最好）
      const clean = text.replace(/[^\u4e00-\u9fff0-9]/g, ' ').trim() || text
      const audio = new Audio()
      audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=0`
      audio.volume = 1
      currentAudio = audio

      audio.onended = () => { currentAudio = null; resolve(true) }
      audio.onerror = () => { currentAudio = null; resolve(false) }

      audio.play().then(() => {
        if (id === speakingId) console.log(`[语音] 有道 TTS: "${clean.substring(0, 20)}"`)
      }).catch(() => {
        currentAudio = null; resolve(false)
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
        started = true
        if (id === speakingId) console.log(`[语音] Web Speech 启动 (超时 ${(timeout / 1000).toFixed(0)}s)`)
      }
      u.onend = () => { resolve(true) }
      u.onerror = () => resolve(false)

      synth.speak(u)
      setTimeout(() => { if (!started) resolve(false) }, 3000)
      setTimeout(() => { if (started) resolve(false) }, timeout)
    } catch { resolve(false) }
  })
}

// ====== 导出接口 ======
let initialized = false

/** 初始化语音和音频 */
export function initSpeech() {
  if (initialized) return
  initialized = true
  ensureAudio()
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }
}

/** 朗读中文文本 */
export async function speak(text: string) {
  if (!text || text.trim().length === 0) return

  const id = ++speakingId
  // 停掉上一次
  try {
    window.speechSynthesis?.cancel()
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
  } catch {}

  ensureAudio()

  // 短文本先试 Youdao TTS，长文本先试 Web Speech
  let ok = false
  if (text.length <= 50) {
    ok = await playYoudaoTTS(text, id)
    if (!ok && id === speakingId) ok = await playWebSpeech(text, id)
  } else {
    ok = await playWebSpeech(text, id)
    if (!ok && id === speakingId) ok = await playYoudaoTTS(text, id)
  }

  if (ok && id === speakingId) {
    console.log(`[语音] ✓ "${text.substring(0, 20)}"`)
  } else if (id === speakingId) {
    console.warn(`[语音] ✗ 全部失败: "${text.substring(0, 20)}"`)
  }
}

/** 停止朗读 */
export function stopSpeaking() {
  speakingId++
  try {
    window.speechSynthesis?.cancel()
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null }
  } catch {}
}
