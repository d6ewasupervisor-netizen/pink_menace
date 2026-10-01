import { defineConfig } from 'vitest/config';
import path from 'path';

// Vitest for the Quiet Roads teaching/grading layer. Pure TS modules under
// src/quietroads/** and src/utils/** — no DOM, no React, no Canvas.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    conditions: ['node'],
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'bench/**/*.test.ts'],
    // Deterministic sim tests are fast; keep a generous timeout for the bench.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});