const fs = require('fs');
const path = require('path');

// Copy plugin files to root for Figma to find them
const distDir = path.join(__dirname, '../dist');
const rootDir = path.join(__dirname, '..');

const filesToCopy = ['code.js', 'ui.html', 'manifest.json'];

console.log('📦 Preparing plugin files for Figma...\n');

filesToCopy.forEach(file => {
  const src = path.join(distDir, file);
  const dest = path.join(rootDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} to root`);
  } else {
    console.error(`✗ Error: ${file} not found in dist/`);
    process.exit(1);
  }
});

// Copy assets folder if it exists
const assetsSrc = path.join(distDir, 'assets');
const assetsDest = path.join(rootDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  if (fs.existsSync(assetsDest)) {
    fs.rmSync(assetsDest, { recursive: true, force: true });
  }
  fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  console.log('✓ Copied assets folder to root');
}

console.log('\n✅ Plugin files ready! You can now import manifest.json from the root directory.');
