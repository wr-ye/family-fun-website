import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tts-proxy',
      configureServer(server) {
        server.middlewares.use('/tts', async (req, res) => {
          const rawUrl = String(req.url ?? '/')
          const url = new URL(rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl, 'http://localhost')
          const audio = url.searchParams.get('audio') || ''

          // 清理：只保留中文和数字
          const clean = decodeURIComponent(audio).replace(/[^\u4e00-\u9fff0-9]/g, '').trim()

          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Content-Type', 'audio/mpeg')

          if (!clean) {
            res.statusCode = 400
            res.end('No valid text')
            return
          }

          // 方案1: 百度 TTS（中文友好）
          const baiduUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodeURIComponent(clean)}&spd=3&source=web`
          try {
            const resp = await fetch(baiduUrl, {
              headers: { 'Referer': 'https://fanyi.baidu.com/', 'User-Agent': 'Mozilla/5.0' }
            })
            if (resp.ok) {
              const bytes = resp.headers.get('content-length')
              if (bytes && parseInt(bytes) > 5000) {
                const data = await resp.arrayBuffer()
                res.setHeader('Content-Length', bytes)
                res.end(Buffer.from(data))
                return
              }
            }
          } catch (e) { /* 继续备用方案 */ }

          // 方案2: 有道 TTS（type=1 中文）
          const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(clean)}&type=1`
          try {
            const resp = await fetch(youdaoUrl)
            if (resp.ok) {
              const data = await resp.arrayBuffer()
              res.setHeader('Content-Length', String(resp.headers.get('content-length') || data.byteLength))
              res.end(Buffer.from(data))
              return
            }
          } catch (e) { /* 继续 */ }

          // 方案3: 腾讯 TTS
          try {
            const txUrl = `https://tts.baidu.com/text2audio?lan=zh&text=${encodeURIComponent(clean)}&per=0&pit=1&spd=3&tok=0`
            const resp = await fetch(txUrl)
            if (resp.ok) {
              const data = await resp.arrayBuffer()
              res.end(Buffer.from(data))
              return
            }
          } catch (e) { /* 最后 */ }

          res.statusCode = 503
          res.end('TTS unavailable')
        })
      }
    }
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173
  }
})
