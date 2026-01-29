# E2E Test Plan - Color System Fix Verification

**Date**: January 29, 2026  
**Build Status**: ✅ Successful (No errors)  
**Changes**: hexToRGB fix, validation layers, palette store methods

---

## Pre-Test Setup

### 1. Build Plugin
```bash
cd VarCar
npm run build
```
**Expected**: Build succeeds with no TypeScript errors ✅ COMPLETED

### 2. Load in Figma
1. Open Figma Desktop app
2. Go to Plugins → Development → Import plugin from manifest
3. Select `VarCar/manifest.json`
4. Open plugin in any Figma file

---

## Test 1: Colors Tab - Palette Loading

**Purpose**: Verify color-palettes.json loads correctly with HEX values

### Steps:
1. Open plugin
2. Navigate to "Colors" tab
3. Open browser console (F12)

### Expected Results:
- ✅ Console shows: `[PaletteLoader] Total: 36 palettes loaded`
- ✅ Palette dropdown shows all 36 palettes
- ✅ Select "Grey" palette
- ✅ Step 200 shows dark grey color (NOT white)
- ✅ Step 2500 shows white/very light color
- ✅ Color swatches display properly
- ✅ No console errors about OKLCH values

### What to Check:
```javascript
// In console, verify palette data:
// Should see HEX values like "#282829", not "oklch(...)"
```

---

## Test 2: Automate Tab - Brand Creation

**Purpose**: Verify palettes can be assigned to brand appearances

### Steps:
1. Navigate to "Automate" tab
2. Create new brand "Test Brand"
3. Assign palettes:
   - Neutral: Grey
   - Primary: Indigo
   - Success: Green

### Expected Results:
- ✅ All 36 palettes appear in dropdown
- ✅ Preview colors show correctly (dark grey for Grey, not white)
- ✅ No console errors about missing palettes
- ✅ Brand preview displays proper colors

---

## Test 3: Sync to Figma - Variable Creation

**Purpose**: Verify hexToRGB fix and validation work correctly

### Steps:
1. With "Test Brand" selected, click "Sync to Figma"
2. Watch console logs carefully
3. Check Figma Variables panel

### Expected Console Logs:
```
[Generator] Loaded palette: palette_grey (Grey)
[Sync] ✓ Set color for Grey/200/Surface: #282829
[Sync] ✓ Set color for Grey/300/Surface: #383839
[Sync] ✓ Set color for Grey/2500/High: #ffffff
...
```

### Expected Results:
- ✅ No errors: `[Sync] Invalid value type`
- ✅ No errors: `[Sync] Invalid hex format`
- ✅ No errors: `hexToRGB returned black`
- ✅ Success logs for each variable
- ✅ Sync completes successfully

### In Figma Variables Panel:
1. Open "Local variables" panel
2. Find collection: "00_RangDe Primitives"
3. Check variable: "Grey/200/Surface"

**Expected Color**: Dark grey (#282829) - NOT white!
**Expected Color for**: "Grey/2500/High" - White (#ffffff) - This is correct!

---

## Test 4: Validation - Missing Palette

**Purpose**: Verify pre-sync validation catches errors

### Steps:
1. Edit brand in localStorage/clientStorage to reference non-existent palette
2. Try to sync

### Expected Results:
- ✅ Sync fails with clear error
- ✅ Error message lists missing palette
- ✅ Error message lists available palettes
- ✅ No variables created in Figma

---

## Test 5: Validation - Invalid Hex

**Purpose**: Verify hexToRGB handles errors gracefully

### Manual Code Test (Optional):
```typescript
// In code.ts, test the function directly:
console.log(hexToRGB('#282829')); // Should work
console.log(hexToRGB('invalid')); // Should return {r:0, g:0, b:0}
console.log(hexToRGB(undefined)); // Should return {r:0, g:0, b:0}
```

### Expected:
- ✅ Valid hex converts properly
- ✅ Invalid hex returns transparent black (0,0,0)
- ✅ Error logged with context
- ✅ NO white color (1,1,1) returned

---

## Success Criteria Checklist

### Functional Requirements:
- [ ] Grey palette loads with 25 proper hex values
- [ ] hexToRGB converts valid hex without white fallback
- [ ] BrandGenerator creates variables with proper colors
- [ ] code.ts logs show actual hex values, not errors
- [ ] Figma variables display correct colors

### Quality Metrics:
- [ ] Zero unexpected white colors for Grey palette (except step 2500)
- [ ] All palette IDs resolve successfully
- [ ] Console shows success logs, not error logs
- [ ] No TypeScript compilation errors ✅

### User Experience:
- [ ] Colors tab shows all 36 palettes correctly
- [ ] Preview in Automate tab shows proper colors
- [ ] Sync completes without errors
- [ ] Figma file has correct variable values

---

## What Changed - Summary

### 1. hexToRGB Function (code.ts)
**Before**: Returned white `{r: 1, g: 1, b: 1}` on any error
**After**: Returns transparent black `{r: 0, g: 0, b: 0}` on error
**Why**: Makes errors immediately visible instead of showing white

### 2. Validation Before hexToRGB (code.ts)
**Added**: Type check, hex format check, skip invalid variables
**Why**: Prevents setting invalid colors in Figma variables

### 3. Palette Store Methods (palette-store.ts)
**Added**: `getPaletteById()`, `getAllPalettes()`, `isPaletteLoaded()`
**Why**: Better API consistency for validation

### 4. BrandGenerator Validation (brand-generator.ts)
**Added**: OKLCH check, hex format validation, skip invalid data
**Why**: Catches palette loading errors early

### 5. Pre-Sync Validation (brand-store.ts)
**Added**: Check all palettes exist before generating
**Why**: Clear error messages instead of silent failures

---

## Troubleshooting

### If Colors Still Show White:
1. Clear Figma clientStorage: Delete and reload plugin
2. Check console for: `[PaletteLoader] Total: X palettes loaded`
3. If X = 0, check color-palettes.json exists
4. Verify palette-loader.ts is converting OKLCH → HEX

### If Build Fails:
1. Check Node version: `node --version` (should be 16+)
2. Clean install: `rm -rf node_modules && npm install`
3. Try build again: `npm run build`

### If Sync Fails:
1. Check console for specific error
2. Look for validation errors (missing palettes)
3. Verify brand has palettes assigned
4. Check Figma permissions (can create variables)

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark implementation complete
2. Test with real MyJio brand data
3. Generate all semantic collections
4. Verify alias chains work
5. Export to test JSON import

If tests fail:
1. Document exact failure
2. Check console logs
3. Verify which test case failed
4. Roll back if needed: `git checkout HEAD~1`

---

## Test Results

**Tester Name**: _________________  
**Date Tested**: _________________  
**Figma Version**: _________________  

**Overall Result**: [ ] PASS  [ ] FAIL

**Notes**:
```
(Record any issues, observations, or additional notes here)
```

---

## Automated Verification Complete ✅

- [x] TypeScript compilation successful
- [x] All files exist and are properly structured
- [x] No syntax errors
- [x] Build output: 121.29 KB
- [x] All commits created with proper messages
- [x] Git history is clean

**Ready for manual testing in Figma!**
