import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: { 'import.meta.env.SITE_URL': JSON.stringify(env.SITE_URL ?? process.env.SITE_URL ?? '') },
  }
})
