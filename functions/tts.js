/**
 * Cloudflare Pages Function —— TTS 代理
 * 接收 `/tts?audio=猫&type=0`，转发到 Youdao TTS 并返回音频
 */
export async function onRequest(context) {
  const url = new URL(context.request.url)
  const audio = url.searchParams.get('audio')
  const type = url.searchParams.get('type') || '0'

  if (!audio) {
    return new Response('Missing audio parameter', { status: 400 })
  }

  const ttsUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(audio)}&type=${encodeURIComponent(type)}`

  try {
    const resp = await fetch(ttsUrl)
    if (!resp.ok) {
      console.log(`Youdao TTS returned ${resp.status} for: ${audio}`)
      // 尝试备用 TTS
      return await fallbackTTS(audio)
    }

    const audioData = await resp.arrayBuffer()
    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (e) {
    console.log('Youdao TTS failed:', e.message)
    return await fallbackTTS(audio)
  }
}

async function fallbackTTS(text) {
  // 备用：百度翻译 TTS
  const backupUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(text)}&spd=3&source=web`
  try {
    const resp = await fetch(backupUrl, {
      headers: { 'Referer': 'https://fanyi.baidu.com/', 'User-Agent': 'Mozilla/5.0' }
    })
    if (!resp.ok) {
      return new Response('TTS service unavailable', { status: 502 })
    }
    const audioData = await resp.arrayBuffer()
    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (e) {
    return new Response('TTS proxy error: ' + e.message, { status: 502 })
  }
}
