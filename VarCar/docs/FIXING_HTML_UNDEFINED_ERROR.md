# Fixing __html__ Undefined Error

## Problem Summary

**Issue**: When clicking "Graph View" in the plugin, a blank screen appeared with the console error:
```
ReferenceError: __html__ is not defined
```

**Root Cause**: esbuild was not preserving the `__html__` global variable reference that Figma plugins use to display UI. The post-build string replacement was failing because esbuild was optimizing away or transforming the `__html__` identifier.

## Solution Implemented

### 1. Added esbuild Define Flag

**File**: `package.json`

Added `--define:__html__=__html__` to the esbuild command. This tells esbuild:
- "When you see `__html__`, replace it with the identifier `__html__` itself"
- In other words: "Don't transform or optimize away this identifier"

**Before**:
```json
"build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --format=iife --platform=browser --target=es6"
```

**After**:
```json
"build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --format=iife --platform=browser --target=es6 --define:__html__=__html__"
```

### 2. Modified Build Post-Processor

**File**: `build-plugin.js`

Changed the build script to inject `__html__` as a variable declaration at the top of the IIFE (Immediately Invoked Function Expression), similar to how `exports` is handled.

**Before**:
```javascript
// Fixed exports first, then did string replacement
code = code.replace('__html__', '`' + escapedHtml + '`');
```

**After**:
```javascript
// Inject both exports and __html__ as variable declarations
const htmlInjection = `  var __html__ = \`${escapedHtml}\`;`;
code = code.replace(
  '"use strict";\n(() => {',
  '"use strict";\n(() => {\n  var exports = {}; // Figma compatibility fix\n' + htmlInjection
);
```

## Result

The built code (`dist/code.js`) now has:
```javascript
"use strict";
(() => {
  var exports = {}; // Figma compatibility fix
  var __html__ = `<!DOCTYPE html>...`; // Full UI HTML content
  // ... rest of plugin code
```

This ensures:
1. esbuild preserves the `__html__` identifier
2. The variable is properly declared in the correct scope
3. The HTML content is available when `figma.showUI(__html__)` is called

## Testing Instructions

### 1. Rebuild the Plugin

```bash
npm run build
```

You should see:
```
✅ Fixed exports reference for Figma compatibility
✅ Injected __html__ variable with UI content
✅ Plugin code bundled successfully with inline UI
```

### 2. Reload Plugin in Figma

1. Close the plugin if it's open
2. In Figma: **Plugins** → **Development** → **FigZig** → **Open FigZig**

### 3. Test Tree View

1. Plugin should load successfully
2. You should see your variables in tree view
3. Collections, groups, and variables should be visible

### 4. Test Graph View (The Fix)

1. Click the **"Graph View"** button in the header
2. **Expected**: Graph should render with:
   - Variables as nodes
   - Aliases as blue animated edges
   - Zoom, pan, and minimap controls
3. **No longer seeing**: Blank screen or console error

### 5. Test Alias Creation

1. In Graph View, click any variable node
2. Alias creation modal should open
3. Select target variable and mode
4. Create alias
5. Graph should refresh with new edge

### 6. Verify Console

Open browser DevTools Console (F12):

**Before the fix** (you would see):
```
ReferenceError: __html__ is not defined
```

**After the fix** (you should see):
```
UI is ready
Fetching variable collections...
Found 2 collection(s)
Found 946 variable(s)
Built internal graph model
Serialized graph: {collections: 2, groups: 134, variables: 946, aliases: 1129}
```

No errors!

## Technical Details

### Why This Fix Works

1. **esbuild Preservation**: The `--define` flag prevents esbuild from treating `__html__` as an undefined variable that can be optimized away or transformed.

2. **Variable Injection**: By injecting `var __html__` at the top of the IIFE, we ensure:
   - The variable is in the correct scope
   - It's available when `figma.showUI(__html__)` is called
   - The HTML content is properly escaped and embedded

3. **IIFE Pattern**: The plugin code is wrapped in an IIFE:
   ```javascript
   "use strict";
   (() => {
     // All plugin code here
   })();
   ```
   By injecting at the very start, `__html__` is available to all code inside.

### Build Process Flow

```
1. vite build → builds UI → dist/ui/index.html (357.52 KB)
2. esbuild → bundles code.ts → dist/code.js (14.6 KB)
   - Preserves __html__ identifier due to --define flag
3. build-plugin.js → post-processes dist/code.js
   - Reads dist/ui/index.html
   - Escapes HTML for JavaScript
   - Injects as `var __html__ = \`...\`` at top of IIFE
   - Final size: 364.85 KB (HTML + code)
```

### Verification Commands

Check if `__html__` is properly defined:

```bash
# Count __html__ variable declarations (should be 1)
grep -c "var __html__" dist/code.js

# View the first 10 lines of built code
head -10 dist/code.js

# Verify __html__ is on line 4
sed -n '4p' dist/code.js | head -c 100
```

## Common Issues

### Issue: Still seeing blank screen

**Solution**: 
1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Rebuild: `npm run build`
3. Close and reopen Figma
4. Reload plugin

### Issue: Build warnings

**Solution**: Ignore Vite CJS deprecation warning - it's cosmetic and doesn't affect functionality.

### Issue: Graph not rendering

**Solution**: Check if React Flow CSS is loading. The fix ensures HTML loads, but React Flow needs its CSS. Check the Network tab in DevTools.

## Alternative Solutions (Not Used)

We considered but didn't use:

1. **Remove bundling entirely**: Would break imports and require manual file management
2. **Separate manifest UI field**: Figma would inject `__html__`, but loses single-file plugin benefit
3. **Dynamic HTML loading**: Would require async operations and complicate UI initialization

Our solution is optimal because:
- Single file plugin (easier distribution)
- All dependencies bundled
- Fast loading (no network requests)
- Compatible with Figma's plugin system

## Related Documentation

- [Figma Plugin API - showUI](https://www.figma.com/plugin-docs/api/properties/figma-showui/)
- [esbuild Define API](https://esbuild.github.io/api/#define)
- [Figma Plugin Manifest](https://developers.figma.com/docs/plugins/manifest/)

## Commit History

- **658f30c** - Fix __html__ undefined error in plugin
- **8711793** - Add comprehensive documentation for variable aliasing feature
- **5cd66c8** - Add React Flow graph visualization with alias creation

---

**Status**: ✅ Fixed and Committed
**Test Status**: Ready for testing in Figma
**Next Steps**: Test in Figma with your 946 variables and 1129 aliases
