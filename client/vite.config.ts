import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5901,
        host: '0.0.0.0',
        allowedHosts: ['donow.bitzh.edu.kg'],
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          }
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'package.json': path.resolve(__dirname, 'package.json'),
        }
      }
    };
});
