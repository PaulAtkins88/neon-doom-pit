import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/neon-doom-pit/' : '/',
  resolve: {
    alias: {
      '@neon/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
}))
