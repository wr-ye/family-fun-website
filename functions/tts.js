/**
 * Cloudflare Pages Function —— TTS 代理
 * 接收 `/tts?audio=猫`，返回中文语音
 * 
 * 策略：
 * 1. 百度翻译 TTS（中文友好）
 * 2. 有道词典 TTS（有道 type=1 中文语音）
 */
export async function onRequest(context) {
  const url = new URL(context.request.url)
  const audio = url.searchParams.get('audio') || ''

  if (!audio) {
    return new Response('Missing audio parameter', { status: 400 })
  }

  // 清理：只保留中文和数字
  const clean = audio.replace(/[^\u4e00-\u9fff0-9]/g, '').trim()
  if (!clean) {
    return new Response('No valid Chinese text', { status: 400 })
  }

  // 方案1: 百度翻译 TTS（中文友好）
  const baiduUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(clean)}&spd=3&source=web`
  try {
    const resp = await fetch(baiduUrl, {
      headers: { 'Referer': 'https://fanyi.baidu.com/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    if (resp.ok) {
      const bytes = resp.headers.get('content-length')
      console.log(`百度 TTS: ${bytes || '?'} bytes for "${clean}"`)
      if (bytes && parseInt(bytes) > 5000) {
        const audioData = await resp.arrayBuffer()
        return new Response(audioData, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400'
          }
        })
      }
      console.log(`百度 TTS 返回太小 (${bytes} bytes)，尝试备用...`)
    } else {
      console.log(`百度 TTS 返回 ${resp.status}，尝试备用...`)
    }
  } catch (e) {
    console.log('百度 TTS 失败:', e.message)
  }

  // 方案2: 有道词典 TTS（type=1 中文女声）
  const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=1`
  try {
    const resp = await fetch(youdaoUrl)
    if (resp.ok) {
      const bytes = resp.headers.get('content-length')
      console.log(`有道 TTS: ${bytes || '?'} bytes for "${clean}"`)
      if (!bytes || parseInt(bytes) < 500) {
        console.log('有道 TTS 音频太小，尝试备用...')
        return await fallbackTTS(clean)
      }
      const audioData = await resp.arrayBuffer()
      return new Response(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        }
      })
    }
  } catch (e) {
    console.log('有道 TTS 失败:', e.message)
  }

  return await fallbackTTS(clean)
}

async function fallbackTTS(text) {
  // 最后备用：腾讯混元 TTS 或直接返回错误
  try {
    // 尝试腾讯翻译君 TTS
    const txUrl = `https://tts.baidu.com/text2audio?lan=zh&text=${encodeURIComponent(text)}&per=0&pit=1&spd=3&tok=0`
    const resp = await fetch(txUrl)
    if (resp.ok) {
      const bytes = resp.headers.get('content-length')
      console.log(`腾讯 TTS: ${bytes || '?'} bytes`)
      if (!bytes || parseInt(bytes) > 1000) {
        const audioData = await resp.arrayBuffer()
        return new Response(audioData, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400'
          }
        })
      }
    }
  } catch (e) {
    console.log('腾讯 TTS 失败:', e.message)
  }

  return new Response('TTS unavailable', { status: 503 })
}
