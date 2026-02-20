import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  const backendPort = env.BE_PORT || '3000';
  const frontendPort = parseInt(env.FE_PORT || '5173');

  return {
    envPrefix: ['VITE_', 'BE_', 'MINIO_'],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: frontendPort,
      host: true,
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**'],
      },
      proxy: {
        '/s3': {
          target: 'http://localhost:9000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/s3/, ''),
        },
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
