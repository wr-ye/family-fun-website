import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
    proxy: {
      // TTS 代理（与 Cloudflare Pages Function 保持相同接口）
      '/tts': {
        target: 'https://dict.youdao.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/tts/, '/dictvoice')
      }
    }
  }
})
