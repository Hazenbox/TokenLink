import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: path.resolve(__dirname, 'src/ui'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist/ui'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ui/index.html'),
      output: {
        manualChunks: {
          'colors-tab': ['./src/ui/tabs/ColorsTab'],
          'variables-tab': ['./src/ui/tabs/VariablesTab']
        }
      }
    },
    minify: 'esbuild',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000, // Inline all assets
  },
  plugins: [
    react(),
    viteSingleFile()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@colors': path.resolve(__dirname, 'src/lib/colors')
    }
  }
});
