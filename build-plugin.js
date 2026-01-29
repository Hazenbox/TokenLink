const fs = require('fs');
const path = require('path');

// Read the compiled plugin code
const codePath = path.join(__dirname, 'dist/code.js');
let code = fs.readFileSync(codePath, 'utf8');

// Fix esbuild IIFE exports issue for Figma compatibility
// esbuild's __async helper references 'exports' which doesn't exist in Figma
// We inject a definition at the start of the IIFE
if (code.startsWith('"use strict";\n(() => {')) {
  code = code.replace(
    '"use strict";\n(() => {',
    '"use strict";\n(() => {\n  var exports = {}; // Figma compatibility fix'
  );
  console.log('✅ Fixed exports reference for Figma compatibility');
}

// Write the final bundled code
fs.writeFileSync(codePath, code, 'utf8');

console.log('✅ Plugin code bundled successfully');
console.log(`   Final code size: ${(code.length / 1024).toFixed(2)} KB`);
console.log('   Note: UI is loaded by Figma from dist/ui/index.html (see manifest.json)');
