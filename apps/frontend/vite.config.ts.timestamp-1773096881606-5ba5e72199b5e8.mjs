// vite.config.ts
import tailwindcss from 'file:///Users/dovydas/Repos/42/GRIT/node_modules/.pnpm/@tailwindcss+vite@4.2.1_vite@5.4.21_@types+node@22.19.13_lightningcss@1.31.1_terser@5.46.0_/node_modules/@tailwindcss/vite/dist/index.mjs';
import react from 'file:///Users/dovydas/Repos/42/GRIT/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.13_lightningcss@1.31.1_terser@5.46.0_/node_modules/@vitejs/plugin-react/dist/index.js';
import path from 'path';
import {
  defineConfig,
  loadEnv,
} from 'file:///Users/dovydas/Repos/42/GRIT/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.13_lightningcss@1.31.1_terser@5.46.0/node_modules/vite/dist/node/index.js';
var __vite_injected_original_dirname = '/Users/dovydas/Repos/42/GRIT/apps/frontend';
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__vite_injected_original_dirname, '../../'), '');
  const backendPort = env.BE_PORT || '3000';
  const frontendPort = parseInt(env.FE_PORT || '5173');
  return {
    envPrefix: ['VITE_'],
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__vite_injected_original_dirname, './src'),
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
          rewrite: (path2) => path2.replace(/^\/s3/, ''),
        },
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path2) => path2.replace(/^\/api/, ''),
        },
      },
    },
  };
});
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZG92eWRhcy9SZXBvcy80Mi9HUklUL2FwcHMvZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9kb3Z5ZGFzL1JlcG9zLzQyL0dSSVQvYXBwcy9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZG92eWRhcy9SZXBvcy80Mi9HUklUL2FwcHMvZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vJyksICcnKTtcblxuICBjb25zdCBiYWNrZW5kUG9ydCA9IGVudi5CRV9QT1JUIHx8ICczMDAwJztcbiAgY29uc3QgZnJvbnRlbmRQb3J0ID0gcGFyc2VJbnQoZW52LkZFX1BPUlQgfHwgJzUxNzMnKTtcblxuICByZXR1cm4ge1xuICAgIGVudlByZWZpeDogWydWSVRFXyddLFxuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCB0YWlsd2luZGNzcygpXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogZnJvbnRlbmRQb3J0LFxuICAgICAgaG9zdDogdHJ1ZSxcbiAgICAgIHdhdGNoOiB7XG4gICAgICAgIGlnbm9yZWQ6IFsnKiovbm9kZV9tb2R1bGVzLyoqJywgJyoqL2Rpc3QvKionXSxcbiAgICAgIH0sXG4gICAgICBwcm94eToge1xuICAgICAgICAnL3MzJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6OTAwMCcsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9zMy8sICcnKSxcbiAgICAgICAgfSxcbiAgICAgICAgJy9hcGknOiB7XG4gICAgICAgICAgdGFyZ2V0OiBgaHR0cDovL2xvY2FsaG9zdDoke2JhY2tlbmRQb3J0fWAsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgd3M6IHRydWUsXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFnVCxPQUFPLGlCQUFpQjtBQUN4VSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsY0FBYyxlQUFlO0FBSHRDLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sS0FBSyxRQUFRLGtDQUFXLFFBQVEsR0FBRyxFQUFFO0FBRS9ELFFBQU0sY0FBYyxJQUFJLFdBQVc7QUFDbkMsUUFBTSxlQUFlLFNBQVMsSUFBSSxXQUFXLE1BQU07QUFFbkQsU0FBTztBQUFBLElBQ0wsV0FBVyxDQUFDLE9BQU87QUFBQSxJQUNuQixTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVksQ0FBQztBQUFBLElBQ2hDLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFNBQVMsQ0FBQyxzQkFBc0IsWUFBWTtBQUFBLE1BQzlDO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxPQUFPO0FBQUEsVUFDTCxRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxTQUFTLENBQUNBLFVBQVNBLE1BQUssUUFBUSxTQUFTLEVBQUU7QUFBQSxRQUM3QztBQUFBLFFBQ0EsUUFBUTtBQUFBLFVBQ04sUUFBUSxvQkFBb0IsV0FBVztBQUFBLFVBQ3ZDLGNBQWM7QUFBQSxVQUNkLFFBQVE7QUFBQSxVQUNSLElBQUk7QUFBQSxVQUNKLFNBQVMsQ0FBQ0EsVUFBU0EsTUFBSyxRQUFRLFVBQVUsRUFBRTtBQUFBLFFBQzlDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
