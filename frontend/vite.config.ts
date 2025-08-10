import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },
  root: './',
  publicDir: 'public',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Dockerコンテナ内で外部からアクセス可能にする
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/item': 'http://localhost:8000',
      '/inventory': 'http://localhost:8000',
      '/transaction': 'http://localhost:8000',
      '/supplier': 'http://localhost:8000',
      '/teams': 'http://localhost:8000',
    }
  }
})
