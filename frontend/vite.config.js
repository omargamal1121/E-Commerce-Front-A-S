import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://rands-api.runasp.net',
        changeOrigin: true,
        secure: true
      }
    },
    port: 5173,
  }
})
