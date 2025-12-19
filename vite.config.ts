import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/frontend',
  plugins: [react()],
  server: {
    proxy: {
      '/api-user': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-user/, ''),
      },
    },
  },
  build: {
    outDir: '../../dist-fe',
    emptyOutDir: true,
  },
});
