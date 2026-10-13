import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        // Keep the heavy 3D libraries in their own chunk so they only load
        // when the visitor scrolls near the cake.
        manualChunks(id) {
          if (
            id.includes('node_modules/three/') ||
            id.includes('node_modules/@react-three/') ||
            id.includes('node_modules/three-stdlib/')
          ) {
            return 'three';
          }
        },
      },
    },
  },
});
