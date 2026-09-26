import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base = nombre del repo, para que funcione en GitHub Pages (vicleoga.github.io/kaeo/)
export default defineConfig({
  plugins: [react()],
  base: '/kaeo/',
})
