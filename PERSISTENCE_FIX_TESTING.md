# Brand Persistence Fix - Testing Guide

## What Was Fixed

### Problem
Brand data (collections, groups, variables, and dropdown values) was being lost on plugin restart due to:
1. **Race condition** between Zustand's persist middleware and custom Figma clientStorage
2. Both systems writing to the same localStorage key, causing conflicts
3. Zustand auto-rehydrating stale data before custom loadBrands() could complete

### Solution (Industry Standard)
- **Removed** Zustand persist middleware completely
- **Using only** manual Figma clientStorage + localStorage backup pattern
- Follows standard practice for async storage with message passing (same as Chrome extensions, VS Code extensions, Electron)

## Changes Made

### 1. Brand Store (`src/store/brand-store.ts`)
- ✅ Removed `persist` wrapper
- ✅ Removed `persist` and `createJSONStorage` imports
- ✅ Moved migration logic into `loadBrands()` function
- ✅ Maintains manual `saveBrands()` and `loadBrands()` functions

### 2. Data Flow
```
Plugin Start → AutomateApp.mount → loadBrands()
  ↓
Figma clientStorage (primary)
  ↓ (if timeout/error)
localStorage (fallback)
  ↓
Migrate legacy brands
  ↓
Set brand state
```

```
Brand Mutation → saveBrands()
  ↓
Figma clientStorage (async)
  ↓
localStorage (sync backup)
```

## Complete Brand Data Structure

A brand should contain:

```typescript
{
  id: string,
  name: string,
  collections?: [
    {
      id: string,
      name: string,
      modes: [{modeId, name}],
      variableIds: string[],
      generationType: 'primitives' | 'semantic' | 'component',
      paletteAssignments?: {
        "Grey": { paletteId, paletteName },
        "Primary": { paletteId, paletteName },
        // ...
      }
    }
  ],
  colors?: {
    primary: { paletteId, paletteName },
    secondary: { paletteId, paletteName },
    // ... (legacy format)
  },
  createdAt: number,
  updatedAt: number,
  syncedAt?: number,
  version: number
}
```

## Testing Instructions

### Test 1: Basic Brand Persistence
1. Open plugin in Figma
2. Go to Automate tab
3. Create a new brand "Test Brand 1"
4. **Important**: Assign palettes to dropdown values (primary, secondary, etc.)
5. Close and reopen plugin
6. **Expected**: Brand name AND dropdown values should persist

### Test 2: Collection Persistence
1. Create a brand
2. Create a collection within that brand:
   - Click "+" or "Create Collection" button
   - Choose type (Primitives, Semantic, Theme)
   - Name it
3. If it's a Primitives collection, assign palettes to groups
4. Close and reopen plugin
5. **Expected**: Collections, groups, and palette assignments should all persist

### Test 3: Tab Switching
1. Create brands with collections in Automate tab
2. Switch to Colors tab
3. Switch to Graph tab
4. Switch back to Automate tab
5. **Expected**: All data should remain (no longer lost on tab switch)

### Test 4: Check Storage Console
1. Open Figma DevTools (Help → DevTools)
2. Create a brand
3. Look for these logs:
   ```
   [Storage] Brands saved to both Figma clientStorage and localStorage
   ```
4. Reload plugin
5. Look for:
   ```
   [Storage] Loading brands from Figma clientStorage...
   [Storage] Loaded brands from Figma clientStorage
   [Migration] Checking for legacy brands...
   [Migration] All brands are up to date
   ```

### Test 5: Verify localStorage Backup
1. Open DevTools → Application → Local Storage
2. Find key: `varcar-brands`
3. Expand the JSON value
4. **Expected**: Should see complete brand objects with:
   - `brands` array with full data
   - `activeBrandId`
   - `backups` array
   - `auditLog` array

### Test 6: Legacy Brand Migration
1. If you have old brands from before this fix:
2. They should auto-migrate on load
3. Console will show:
   ```
   [Migration] Migrating legacy brands to multi-collection architecture...
   [Migration] Migration complete!
   ```
4. Old brands will get 2 default collections:
   - "Primitives" collection
   - "Appearances" collection

## Troubleshooting

### Issue: Brands show only names, no dropdown values
**Cause**: Brand was created but `colors` field not populated
**Fix**: 
1. Select the brand
2. Use PaletteSelector dropdowns in Brand Config panel to assign palettes
3. Changes auto-save every 30 seconds, or immediately on actions

### Issue: Collections not persisting
**Cause**: Collections need to be explicitly created
**Fix**:
1. After creating a brand, you must create collections
2. Use "Create Collection" button/modal
3. For Primitives: Assign palettes to groups after creation

### Issue: "No brands found" on reload
**Cause**: Storage might be empty or corrupted
**Check**:
1. Console for error messages
2. localStorage for `varcar-brands` key
3. Try creating a new brand and check if it saves

### Issue: Data still disappearing
**Check**:
1. Console logs for storage errors
2. Whether you're creating collections (not just brands)
3. If localStorage quota exceeded (rare)
4. If Figma clientStorage working (console will show fallback)

## Key Points

✅ **One persistence system** - No more dual storage conflicts  
✅ **Figma clientStorage primary** - Persists across Figma sessions  
✅ **localStorage backup** - Works if Figma storage unavailable  
✅ **Auto-migration** - Legacy brands upgrade automatically  
✅ **Immediate saves** - All mutations save instantly  
✅ **30-second auto-save** - Additional safety net  

## Next Steps

1. **Test the plugin** following the test cases above
2. **Create collections** for your brands (not just brand names)
3. **Assign palettes** to dropdown values and collection groups
4. **Verify persistence** by reloading the plugin
5. Report any issues with console logs

## Storage Limits

- **Figma clientStorage**: ~10MB per plugin
- **localStorage**: ~5-10MB per origin
- Both should be more than sufficient for typical brand data

If you hit limits, the console will show storage quota errors.
