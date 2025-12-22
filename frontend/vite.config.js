import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://e-commerce-api-v1-2.onrender.com',
        changeOrigin: true,
        secure: true
      }
    },
    port: 5173,
  }
})
