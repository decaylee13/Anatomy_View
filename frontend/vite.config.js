import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.OBJ', '**/*.mtl', '**/*.fbx'],
  server: {
    port: 5173,
    // No proxy needed when using VITE_API_BASE_URL with full URL
    fs: {
      strict: false
    }
  },
  build: {
    // Ensure env variables are replaced at build time
    outDir: 'dist'
  }
});
