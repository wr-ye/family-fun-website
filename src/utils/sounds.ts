let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/** 播放一个简单音调 */
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* 静默失败 */ }
}

/** 欢快的上升音（答对、过关） */
export function playCorrectSound() {
  playTone(523, 0.15, 'sine', 0.25)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 100)
  setTimeout(() => playTone(784, 0.25, 'sine', 0.25), 200)
}

/** 错误提示音 */
export function playWrongSound() {
  playTone(200, 0.3, 'square', 0.15)
  setTimeout(() => playTone(180, 0.3, 'square', 0.15), 150)
}

/** 点击音 */
export function playClickSound() {
  playTone(800, 0.08, 'sine', 0.1)
}

/** 翻牌音（记忆游戏） */
export function playFlipSound() {
  playTone(600, 0.1, 'triangle', 0.15)
}

/** 配对成功音 */
export function playMatchSound() {
  playTone(523, 0.1, 'sine', 0.2)
  setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 80)
}

/** 🎉 庆祝音效（连续上升音） */
export function playCelebrationSound() {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 100)
  })
}

/** 拼图移动音 */
export function playMoveSound() {
  playTone(440, 0.08, 'triangle', 0.1)
}

/** 初始化音频上下文（需要用户交互后调用） */
export function initAudio() {
  getAudioCtx()
}
