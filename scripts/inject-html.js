const fs = require('fs');
const path = require('path');

// Read the built UI HTML
const uiHtmlPath = path.join(__dirname, '../dist/ui.html');
const codeJsPath = path.join(__dirname, '../dist/code.js');

if (!fs.existsSync(uiHtmlPath)) {
  console.error('Error: ui.html not found in dist folder. Make sure UI build completed.');
  process.exit(1);
}

if (!fs.existsSync(codeJsPath)) {
  console.error('Error: code.js not found in dist folder. Make sure code build completed.');
  process.exit(1);
}

const uiHtml = fs.readFileSync(uiHtmlPath, 'utf8');
let codeJs = fs.readFileSync(codeJsPath, 'utf8');

// Replace __html__ placeholder with actual HTML
// Escape the HTML string for JavaScript (template literal)
const escapedHtml = uiHtml
  .replace(/\\/g, '\\\\')      // Escape backslashes
  .replace(/`/g, '\\`')        // Escape backticks
  .replace(/\${/g, '\\${');   // Escape template literal expressions

// Replace __html__ with the escaped HTML string
codeJs = codeJs.replace(/__html__/g, '`' + escapedHtml + '`');

fs.writeFileSync(codeJsPath, codeJs);
console.log('✓ Injected UI HTML into code.js');
