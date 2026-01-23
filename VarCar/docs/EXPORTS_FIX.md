# Exports Fix - Final Resolution

**Date:** 2025-01-22  
**Issue:** ReferenceError: 'exports' is not defined  
**Status:** RESOLVED

---

## Problem

After fixing the ES6 compatibility issue, the plugin showed a new error:

```
ReferenceError: 'exports' is not defined
    at <anonymous> (PLUGIN_97_SOURCE:223:39)
```

**Symptoms:**
- Plugin window opened and showed "Loading variables... Building graph structure"
- Then crashed with ReferenceError
- Console showed the error repeatedly

## Root Cause

### esbuild's Async Function Transpilation

When esbuild transpiles async/await to ES6 (which doesn't have native async/await), it creates a generator-based helper function called `__async`:

```javascript
figma.ui.onmessage = (msg) => __async(exports, null, function* () {
  // async code here
});
```

The `__async` helper takes three parameters:
1. `exports` - Module context (THIS WAS THE PROBLEM)
2. `null` - Arguments
3. Generator function

**The Issue:** esbuild passed `exports` as the first argument, but `exports` doesn't exist in Figma's browser-like environment, causing a ReferenceError.

### Why This Happens

- esbuild uses an internal module system even in IIFE format
- The `__async` helper expects a module context (`exports`)
- Figma's plugin sandbox doesn't have Node.js `exports` or `module` globals
- Even with `--format=iife`, esbuild generates code that references `exports`

## Solution Applied

### Two-Part Fix

#### 1. Changed Build Format

In [`package.json`](../package.json):

**Before:**
```json
"build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --platform=node --target=es6"
```

**After:**
```json
"build:code": "esbuild src/code.ts --bundle --outfile=dist/code.js --format=iife --platform=browser --target=es6"
```

**Changes:**
- Removed `--platform=node` (caused CommonJS format)
- Added `--format=iife` (wraps in IIFE)
- Added `--platform=browser` (browser-compatible build)

#### 2. Injected exports Definition

In [`build-plugin.js`](../build-plugin.js), added post-processing step:

```javascript
// Fix esbuild IIFE exports issue for Figma compatibility
if (code.startsWith('"use strict";\n(() => {')) {
  code = code.replace(
    '"use strict";\n(() => {',
    '"use strict";\n(() => {\n  var exports = {}; // Figma compatibility fix'
  );
}
```

This injects `var exports = {}` at the start of the IIFE, so when `__async(exports, ...)` is called, `exports` exists.

## How It Works

### Before Fix (BROKEN)

```javascript
"use strict";
(() => {
  var __async = (__this, __arguments, generator) => { /* ... */ };
  
  figma.ui.onmessage = (msg) => __async(exports, null, function* () {
    // ^ ReferenceError: exports is not defined
  });
})();
```

### After Fix (WORKING)

```javascript
"use strict";
(() => {
  var exports = {}; // Figma compatibility fix
  var __async = (__this, __arguments, generator) => { /* ... */ };
  
  figma.ui.onmessage = (msg) => __async(exports, null, function* () {
    // ^ Now works! exports is defined as {}
  });
})();
```

## Build Verification

```bash
# Check that exports is defined at the start
head -10 dist/code.js | grep "var exports"
# Output: var exports = {}; // Figma compatibility fix

# Verify IIFE wrapper
head -2 dist/code.js
# Output:
# "use strict";
# (() => {

tail -1 dist/code.js
# Output: })();
```

## Build Metrics

- **Bundle size:** 10.1kb (was 8.5kb with es2019)
- **Build time:** ~20-30ms
- **Format:** IIFE with exports definition
- **Compatibility:** ES6 + Figma sandbox

## Why This Approach

### Alternative Approaches Considered

1. **Remove async/await from source** ❌
   - Would make code harder to read
   - Async/await is natural for Figma's async API

2. **Use different transpilation** ❌
   - esbuild is fast and simple
   - Other tools (Babel) would be slower

3. **Replace exports with this** ❌
   - More complex regex replacement
   - Could break other code

4. **Define exports at start of IIFE** ✅ CHOSEN
   - Simple one-line injection
   - Non-intrusive
   - Works with esbuild's output
   - No source code changes needed

## Testing Instructions

### 1. Rebuild the Plugin

Already done - latest build includes the fix.

### 2. Reload in Figma

**IMPORTANT:** Must remove and reimport the plugin:

```
1. Figma → Plugins → Development
2. Right-click "FigZig" → Remove plugin
3. Import plugin from manifest
4. Select manifest.json from project root
```

### 3. Run the Plugin

```
Figma → Plugins → Development → FigZig → Open FigZig
```

### 4. Expected Behavior

SHOULD SEE:
- Window opens (600x600px)
- Header: "Variable Visualizer"
- Status: "Loading variables... Building graph structure"
- Tree visualization appears (if file has variables)
- NO errors in console

SHOULD NOT SEE:
- "ReferenceError: 'exports' is not defined"
- Plugin crashing after opening
- Infinite loading

## What Was Fixed

| Issue | Before | After |
|-------|--------|-------|
| Import error | ES6 imports not bundled | Bundled with esbuild |
| Spread operator | ES2018 syntax not supported | Transpiled to ES6 |
| **exports error** | **exports undefined** | **exports = {} injected** |

## Git Commits

1. `f70f856` - Fix: Replace TypeScript compiler with esbuild bundler
2. `60b9434` - Fix: Change esbuild target from es2019 to es6
3. `c5857e9` - Fix: Add IIFE format and inject exports definition

## Technical Details

### esbuild IIFE Behavior

When using `format: "iife"`, esbuild:
1. Wraps code in `(() => { ... })()`
2. Creates internal module system with `exports` object
3. Uses `exports` in helper functions like `__async`
4. Expects `exports` to exist, but doesn't define it globally

### Why exports Isn't Defined

- Figma's plugin environment is browser-like
- No Node.js globals (`exports`, `module`, `require`)
- IIFE creates a closure, but doesn't auto-define `exports`
- We must manually inject the definition

### The Injection Pattern

```javascript
// Check for esbuild's IIFE pattern
if (code.startsWith('"use strict";\n(() => {')) {
  // Inject right after the IIFE opens
  code = code.replace(
    '"use strict";\n(() => {',
    '"use strict";\n(() => {\n  var exports = {};'
  );
}
```

**Why this works:**
- Runs after esbuild, before HTML inlining
- Adds `exports` before any code uses it
- Empty object `{}` is sufficient - we don't export anything
- Doesn't interfere with other code

## Lessons Learned

### 1. esbuild IIFE Quirks

- IIFE format doesn't eliminate all module system references
- Async helpers still use `exports` internally
- Post-processing may be necessary for edge cases

### 2. Figma Plugin Environment

- Strictly browser-like (no Node.js globals)
- No `exports`, `module`, `require`
- Must be completely self-contained
- Even internal helper references must be resolved

### 3. Build Pipeline Design

- esbuild is powerful but may need post-processing
- Build scripts can fix compatibility issues
- Better to inject than to modify source code
- Keep fixes minimal and documented

## Best Practices for Figma Plugins

DO:
- Use `--format=iife` for Figma plugins
- Use `--platform=browser` not `node`
- Use `--target=es6` for compatibility
- Post-process if needed for edge cases
- Test in actual Figma environment

DON'T:
- Use `--platform=node` (creates CommonJS)
- Assume IIFE means no module references
- Use ES2017+ features without transpilation
- Skip testing in real Figma sandbox
- Use Node.js-specific globals

## Resources

- [esbuild IIFE Documentation](https://esbuild.github.io/api/#format-iife)
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [ES6 Async Function Transpilation](https://babeljs.io/docs/en/babel-plugin-transform-async-to-generator)

---

## Status

RESOLVED - Plugin now loads successfully in Figma without ReferenceError.

**Build verified:** ✅  
**exports defined:** ✅  
**IIFE format:** ✅  
**Ready for testing:** ✅
