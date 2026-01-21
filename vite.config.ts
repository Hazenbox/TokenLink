import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, renameSync, existsSync } from 'fs';

// Plugin to copy manifest.json and rename HTML after build
const figmaPlugin = () => ({
  name: 'figma-plugin',
  closeBundle() {
    // Copy manifest.json
    copyFileSync('manifest.json', 'dist/manifest.json');
    
    // Find and rename HTML file (could be in dist/ or dist/src/ui/)
    const possiblePaths = [
      resolve(__dirname, 'dist/index.html'),
      resolve(__dirname, 'dist/src/ui/index.html'),
    ];
    
    const uiHtmlPath = resolve(__dirname, 'dist/ui.html');
    
    for (const htmlPath of possiblePaths) {
      if (existsSync(htmlPath)) {
        renameSync(htmlPath, uiHtmlPath);
        console.log(`✓ Renamed ${htmlPath} to ui.html`);
        break;
      }
    }
  },
});

export default defineConfig({
  plugins: [react(), figmaPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clean dist folder (preserve code.js from TypeScript)
    rollupOptions: {
      input: resolve(__dirname, 'src/ui/index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
});
