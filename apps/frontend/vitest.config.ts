import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
    },
    globals: true, // Allow the use of global variables like 'describe' and 'it'
    setupFiles: 'tests/setup.ts', // Path to the setup file
  },
});
