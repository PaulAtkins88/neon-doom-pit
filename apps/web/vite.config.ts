import { defineConfig } from 'vite'

export default defineConfig({
  base: '/neon-doom-pit/',
  resolve: {
    alias: {
      '@neon/shared': new URL('../../packages/shared/src/index.ts', import.meta.url).pathname,
    },
  },
})
