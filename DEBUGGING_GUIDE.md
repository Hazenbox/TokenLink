# FigZag Debugging Guide

## Issue Fixed: Blank Screen

The blank screen issue was caused by the `__html__` variable not being properly injected into the Figma plugin code. This has been fixed with a custom webpack plugin that inlines the generated HTML.

## Testing the Fix

### Step 1: Reload the Plugin in Figma

1. **Close the current plugin** if it's open
2. In Figma Desktop, go to **Plugins > Development > FigZag - Variables Automation**
3. If you haven't imported it yet:
   - Go to **Plugins > Development > Import plugin from manifest**
   - Select `manifest.json` from `/Users/upendranath.kaki/Desktop/Codes/FigZag/`

### Step 2: Open Developer Console

To see debugging logs:

1. **While the plugin is open**, press:
   - **Mac**: `Cmd + Option + I`
   - **Windows**: `Ctrl + Shift + I`

2. This opens the Chrome DevTools for the plugin

3. Look at the **Console** tab

### Step 3: Check Console Logs

You should see logs like this:

```
[FigZag] Plugin starting...
[FigZag] HTML available: string
[FigZag] UI shown
[FigZag] Auto-loading variables...
[FigZag] Loading variables...
[FigZag] Found collections: X
[FigZag] Sending data to UI: {collections: X, variables: Y}
[FigZag UI] App component mounting...
[FigZag UI] Setting up message listener...
[FigZag UI] Requesting initial data load...
[FigZag UI] Received message: {...}
[FigZag UI] Message type: variables-loaded
[FigZag UI] Handling variables loaded: {...}
[FigZag UI] Parsed data: {...}
```

## What Each Log Means

### Plugin Sandbox (code.ts) Logs

- `[FigZag] Plugin starting...` - Plugin entry point executed
- `[FigZag] HTML available: string` - __html__ variable is properly defined
- `[FigZag] UI shown` - figma.showUI() called successfully
- `[FigZag] Loading variables...` - Starting to read Figma variables
- `[FigZag] Found collections: X` - Number of variable collections found
- `[FigZag] Sending data to UI` - Data being sent to React app

### UI (React) Logs

- `[FigZag UI] App component mounting...` - React app is loading
- `[FigZag UI] Setting up message listener...` - Message handler registered
- `[FigZag UI] Received message` - Data received from plugin sandbox
- `[FigZag UI] Handling variables loaded` - Parsing data
- `[FigZag UI] Parsed data` - Data transformed into internal models

## Common Issues & Solutions

### Issue 1: Blank Screen, No Console Logs

**Symptom**: Plugin window opens but nothing appears, console is empty

**Cause**: HTML not loading or JavaScript not executing

**Solution**:
1. Check that `dist/code.js` and `dist/ui.js` exist
2. Rebuild: `npm run build`
3. Reload plugin in Figma

### Issue 2: "HTML available: undefined"

**Symptom**: Console shows `__html__` is undefined

**Cause**: Webpack plugin not inlining HTML

**Solution**:
1. Check that `inline-html-plugin.js` exists in project root
2. Rebuild: `npm run build`
3. Verify first line of `dist/code.js` starts with `var __html__ =`

### Issue 3: White Screen with Console Errors

**Symptom**: Screen is white, console shows React errors

**Possible Causes**:
- **Missing Redux store**: Check if Provider is wrapping App
- **React mounting error**: Check if `<div id="root"></div>` exists
- **Import errors**: Check browser console for module load failures

**Solution**:
1. Look at the specific error message in console
2. Check Network tab for failed script loads
3. Verify ui.js is loading correctly

### Issue 4: "Found collections: 0"

**Symptom**: Plugin loads but shows "No variables found"

**Cause**: Figma file has no variable collections

**Solution**:
1. Create variables in Figma: **Right-click > Variables > Create variable**
2. Refresh the plugin
3. Or test with a file that already has variables

### Issue 5: Data Loads But Graph Doesn't Render

**Symptom**: Console shows data loading successfully but graph is blank

**Possible Causes**:
- React Flow rendering issue
- Node positioning problem
- CSS not loading

**Solution**:
1. Check if nodes array has items: Look for `[FigZag UI] Parsed data`
2. Inspect the DOM - is `<div class="react-flow">` present?
3. Check if ui.js includes the React Flow CSS

## Verify Build Artifacts

Run these commands to verify the build:

```bash
cd /Users/upendranath.kaki/Desktop/Codes/FigZag

# Check dist folder exists and has files
ls -lh dist/

# Check code.js starts with __html__ variable
head -c 100 dist/code.js

# Check ui.html references ui.js
cat dist/ui.html

# Check file sizes are reasonable
# code.js should be ~2KB
# ui.js should be ~325KB
```

## Testing with Variables

To properly test the plugin, your Figma file needs variables:

1. **Create a collection**:
   - Right-click canvas > **Variables** > **Create variable**
   - Name it something like "Primitives"

2. **Create some variables**:
   - Add color variables
   - Add number variables
   - Create multiple modes (Light/Dark)

3. **Create aliases**:
   - Create a second collection "Semantic"
   - Create variables that reference Primitives

4. **Reload the plugin** - You should see the graph!

## Debug Mode

If issues persist, you can add more detailed logging:

### In `src/code.ts`:
```typescript
console.log('[FigZag DEBUG] Collections:', JSON.stringify(collectionsData));
console.log('[FigZag DEBUG] Variables:', JSON.stringify(allVariables));
```

### In `src/ui/App.tsx`:
```typescript
console.log('[FigZag DEBUG] Redux state:', { collections, variables, nodes, edges });
```

Then rebuild and check console again.

## Still Having Issues?

If the plugin still shows a blank screen after following these steps:

1. **Share console logs**: Copy the full console output
2. **Check browser console**: Look for any red error messages
3. **Verify file structure**: Ensure all files in `dist/` are present
4. **Try dev mode**: Run `npm run watch` for unminified builds with source maps

## Success Indicators

When working correctly, you should see:
- ✅ Plugin window opens with dark theme UI
- ✅ Toolbar shows collection/variable counts
- ✅ Graph canvas with collections as colored nodes
- ✅ Variables connected by edges (aliases)
- ✅ Zoom/pan controls in bottom-right
- ✅ Minimap in bottom-right corner

## Next Steps

Once the plugin is working:
- Test with different variable structures
- Try files with many variables (100+)
- Check performance with large graphs
- Verify all visual highlighting (broken aliases in red, cross-collection in blue)
