import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom simuloi selainta testausympäristössä
    environment: 'jsdom',
    // Lataa jest-dom matcherit automaattisesti jokaiseen testitiedostoon
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
  },
})
