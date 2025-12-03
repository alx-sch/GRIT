import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
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
    outDir: 'dist',
    chunkSizeWarningLimit: 6000, // Babylon chunk is like 5.7 MB
    rollupOptions: {
      output: {
        // This function tells Vite how to split the files
        // So website doesn't have to load everything at once when starting
        manualChunks(id) {
          // Check if the file is in node_modules (dependencies)
          if (id.includes('node_modules')) {
            // Is it Babylon? Put it in the 3D engine chunk
            if (id.includes('@babylonjs')) {
              return '3d-engine';
            }
            // Any other dependency -> Put in generral chunk
            return 'vendor';
          }
        },
      },
    },
  },
});
