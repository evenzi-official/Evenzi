import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const root = path.resolve(__dirname)

export default defineConfig({
  root,
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    dir: root,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'dist', '.claude', '.worktrees'],
  },
  resolve: {
    alias: {
      '@': root,
    },
  },
})
