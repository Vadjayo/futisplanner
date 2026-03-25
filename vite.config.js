import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // @/ → src/  (käytä koodissa: import { Button } from '@/components/ui')
      '@': path.resolve(__dirname, './src'),
    },
  },

  test: {
    // jsdom simuloi selainta testausympäristössä
    environment: 'jsdom',
    // Lataa jest-dom matcherit automaattisesti jokaiseen testitiedostoon
    setupFiles: ['./src/tests/setup.js'],
    globals: true,
  },
})
