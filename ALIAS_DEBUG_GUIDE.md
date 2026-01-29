# Alias Resolution Debug Guide

**Date**: January 29, 2026  
**Issue**: Appearance modes showing white colors  
**Fix**: Added comprehensive debug logging and improved alias resolution

---

## What Was Changed

### 1. Enhanced Debug Logging

**Added logging in** [`VarCar/src/code.ts`](VarCar/src/code.ts):

- **After Primitives Creation**: Shows variableMap contents
- **Before Each Alias**: Shows what variable is being created and what target it's looking for
- **During Alias Search**: Shows where the target was found (variableMap or cache)
- **On Failure**: Shows sample keys from both variableMap and cache

### 2. Improved Alias Resolution

**Two-strategy lookup**:
1. **Strategy 1**: Search in `variableMap` first (includes recently created variables in current sync)
2. **Strategy 2**: Fallback to `variableCache` (existing variables from previous syncs)

**Graceful error handling**:
- Instead of throwing errors and stopping sync, now warns and continues
- Errors collected in `errors` array for reporting
- Allows partial sync to complete even if some aliases fail

### 3. Layer Validation

**Checks for required layers**:
- Validates that essential collections (Semi semantics, Interaction state, Appearance) are present
- Warns if any required layers are missing

---

## How to Test

### Step 1: Reload Plugin in Figma

1. Open Figma Desktop
2. Plugins → Development → VarCar
3. Open browser console (F12) - **VERY IMPORTANT**

### Step 2: Perform Sync

1. Go to "Automate" tab
2. Select your brand (e.g., "jio")
3. Click "Sync to Figma"
4. **Watch the console carefully** - this is where all the debug info appears

### Step 3: Analyze Console Output

Look for these key sections in the console:

#### Section 1: Collections Being Processed

```
=== Phase 1: Creating Primitives (Layer 0) ===
Creating variables for 00_Primitives... (25 total)

=== Variable Map Contents After Primitives ===
Total entries: 25
  - 00_Primitives:Grey/200/Surface:Default
  - 00_Primitives:Grey/300/Surface:Default
  ...
```

**What to check**:
- ✅ Primitives are created
- ✅ variableMap has entries in format: `collection:name:mode`

#### Section 2: Layer Validation

```
=== Phase 2: Creating Aliased Variables (Layers 1-8) ===
⚠️ Missing required collections: [list if any missing]
Processing 7 aliased collections
```

**What to check**:
- ✅ No missing required collections
- ✅ All expected layers are present

#### Section 3: Processing Each Collection

```
Creating variables for 1 Appearance... (72 total)
```

**What to check**:
- ✅ Appearance collection is being processed
- ✅ Count matches expected (8 scales × 9 modes = 72 variables)

#### Section 4: Alias Resolution (MOST IMPORTANT)

For each variable in the Appearance collection, you should see:

```
  [Alias] Current: jio/Default/[appearance] Surface (collection: 1 Appearance, mode: Neutral)
  [Alias] Looking for target: "Grey/Default/Subtle/[Interaction state] Surface"
  [Alias] variableMap size: 150, cache size: 200
  [Alias] ✓ Found in variableMap: 4 Interaction state (mode: Idle)
  [Alias] ✓ Success: jio/Default/[appearance] Surface → Grey/Default/Subtle/[Interaction state] Surface
```

**What to check**:
- ✅ Current variable name matches format: `brandName/Default/[appearance] Scale`
- ✅ Target name matches format: `PaletteName/Default/EmphasisType/[Interaction state] Scale`
- ✅ Target is FOUND (either in variableMap or cache)
- ✅ Success message confirms alias was set

#### Section 5: If Alias NOT Found (PROBLEM INDICATOR)

```
  [Alias] ⚠️ Target not found: "Grey/Default/Subtle/[Interaction state] Surface" - skipping
  [Alias] Available in variableMap (first 5):
    - 00_Primitives:Grey/200/Surface:Default
    - 00_Semi semantics:Grey/200/Surface:Default
    ...
  [Alias] Available in cache (first 5):
    - collectionId123:OldVariable:Default
    ...
```

**This means**:
- ❌ The target variable doesn't exist
- ❌ Dependency chain is broken (Interaction state layer wasn't created)
- ❌ Variable naming mismatch between generator and lookup

**Action**: Look at the "Available in variableMap" list to see:
1. What collections WERE created
2. What variable names exist
3. Compare with the target name being searched for

---

## Common Issues and Solutions

### Issue 1: Target Not Found

**Symptom**:
```
[Alias] ⚠️ Target not found: "Grey/Default/Subtle/[Interaction state] Surface"
```

**Possible Causes**:
1. **Interaction State layer not created** - Check if "4 Interaction state" appears in Phase 2
2. **Variable name mismatch** - Compare target name with available names in variableMap
3. **Wrong palette name** - Target uses "Grey" but palette might be named differently

**Solution**:
- Check variableMap keys to see actual variable names
- Verify InteractionStateGenerator is creating variables
- Check if palette names match between AppearanceGenerator and InteractionStateGenerator

### Issue 2: Missing Collections

**Symptom**:
```
⚠️ Missing required collections: 4 Interaction state, 2 Fill emphasis
```

**Possible Causes**:
1. **Layers not enabled** - Check layer-mapping.ts configuration
2. **Generation failed** - Check for errors earlier in console
3. **Not included in multi-layer sync** - Check generateBrandWithLayers()

**Solution**:
- Verify all layer generators are being called in BrandGenerator
- Check if layers have `enabled: true` in LAYER_MAPPINGS
- Look for errors during variable generation phase

### Issue 3: Mode Mismatch

**Symptom**: Aliases created but colors still white

**Possible Causes**:
1. **Wrong mode referenced** - Alias points to wrong mode of target variable
2. **Target variable itself has white color** - Dependency chain issue further up
3. **Mode names don't match** - "Idle" vs "idle" case sensitivity

**Solution**:
- Check intermediate layers (Interaction State, Fill Emphasis) in Figma to see their colors
- Verify mode names match exactly (case-sensitive)
- Trace the full dependency chain: Appearance → Interaction → Fill → Background → Mode → Semi → Primitives

---

## What to Report Back

After testing, please report:

### 1. Console Logs (Most Important)

Copy and paste these specific sections:
```
=== Variable Map Contents After Primitives ===
[paste here]

=== Phase 2: Creating Aliased Variables ===
[paste here]

First 10 alias resolution logs from Appearance collection:
[paste here]
```

### 2. Alias Success/Failure Count

Look for messages like:
```
[Alias] ✓ Success: ... (how many?)
[Alias] ⚠️ Target not found: ... (how many?)
```

### 3. Check Intermediate Collections

In Figma Variables panel, check these collections:
- **4 Interaction state** - Do variables show correct colors or white?
- **2 Fill emphasis** - Do variables show correct colors or white?
- **1 Appearance** - Still showing white?

### 4. Variable Names

From the console, note:
- What the target name format is: `[paste example]`
- What's actually in variableMap: `[paste first 5 keys]`
- Do they match?

---

## Expected Outcome

### If Fix Works ✅

Console should show:
```
[Alias] ✓ Success: jio/Default/[appearance] Surface → Grey/Default/Subtle/[Interaction state] Surface
[Alias] ✓ Success: jio/Default/[appearance] High → Grey/Default/Subtle/[Interaction state] High
... (72 total successes)
```

Figma Variables panel:
- Appearance modes show correct colors (greys, blues, etc.)
- No white colors except intentional ones

### If Fix Doesn't Work ❌

Console shows:
```
[Alias] ⚠️ Target not found: ...
```

This means:
1. **Dependency layers missing** - Need to fix layer generation
2. **Variable naming mismatch** - Need to align generator naming
3. **Different root cause** - The issue is elsewhere (not alias resolution)

---

## Next Steps Based on Results

### Scenario A: All Aliases Found, But Colors Still White

→ Problem is in the dependency chain further up
→ Check Interaction State collection colors
→ Trace back through Fill Emphasis → Background → Mode → Semi → Primitives

### Scenario B: Many "Target not found" Warnings

→ Dependency layers not being created
→ Check BrandGenerator.generateBrandWithLayers()
→ Verify all layer generators are called

### Scenario C: Variable Name Mismatch

→ Generator creates: `"Grey/Default/Bold/[Interaction state] Surface"`
→ Appearance looks for: `"Grey/Default/Subtle/[Interaction state] Surface"` (different emphasis)
→ Need to fix name generation logic in AppearanceGenerator

### Scenario D: All Aliases Successful, Colors Fixed! 🎉

→ Commit final changes
→ Remove excessive debug logging (keep key logs)
→ Update documentation

---

## Files Modified

1. [`VarCar/src/code.ts`](VarCar/src/code.ts) - Enhanced alias resolution with debug logging
   - Lines 1826-1841: Variable map logging and layer validation
   - Lines 1876-1920: Improved alias lookup with two-strategy search

---

## Build Info

```bash
npm run build
✅ Success - dist/code.js (123.39 KB)
```

Plugin is ready to test in Figma!
