import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api → backend: same-origin em dev (o cookie httpOnly do refresh
// funciona sem SameSite=None). Em staging o api serve o build estático.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
})
