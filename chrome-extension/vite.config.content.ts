import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate config for content script to bundle everything inline (IIFE format)
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear dist folder
    minify: false,
    lib: {
      entry: resolve(__dirname, 'content/meet-content-script.ts'),
      name: 'MeetContentScript',
      formats: ['iife'],
      fileName: () => 'content/meet-content-script.js'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // Bundle all imports inline
        globals: {
          chrome: 'chrome'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    }
  }
});
