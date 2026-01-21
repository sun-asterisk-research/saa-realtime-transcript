import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'manifest.json', dest: '.' },
        { src: 'assets/**/*', dest: 'assets' },
        { src: 'popup/popup.html', dest: 'popup' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Disable minification for debugging
    rollupOptions: {
      input: {
        'background/service-worker': resolve(__dirname, 'background/service-worker.ts'),
        // Content script is built separately with vite.config.content.ts
        'popup/popup': resolve(__dirname, 'popup/popup.tsx')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        // Disable code splitting - bundle all dependencies inline
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    }
  }
});
