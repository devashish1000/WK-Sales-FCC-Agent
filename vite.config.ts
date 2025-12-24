import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Support both GEMINI_API_KEY and VITE_GEMINI_API_KEY for flexibility
    // Vite automatically exposes VITE_* prefixed env vars to import.meta.env
    // So we'll use VITE_GEMINI_API_KEY as the standard
    const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
    return {
      root: '.',
      build: {
        outDir: 'dist',
        emptyOutDir: true,
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Define process.env for backward compatibility
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
