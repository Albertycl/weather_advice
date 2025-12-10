import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 設定 base 為 './' 確保在 GitHub Pages 的子路徑下能正確讀取資源
  base: './',
  server: {
    host: true, // 監聽所有 IP 位址
    // 允許特定的 Host 訪問開發伺服器，解決 "Blocked request" 錯誤
    allowedHosts: [
      'h3.gnt.tw',
      'github.com',
      'www.github.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  preview: {
    host: true,
    allowedHosts: [
      'h3.gnt.tw',
      'github.com',
      'www.github.com'
    ]
  }
})