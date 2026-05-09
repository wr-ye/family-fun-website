import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
    proxy: {
      // 百度翻译 TTS 代理（绕过 CORS）
      '/tts': {
        target: 'https://fanyi.baidu.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tts/, '/gettts'),
        headers: {
          'Referer': 'https://fanyi.baidu.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    }
  }
})
