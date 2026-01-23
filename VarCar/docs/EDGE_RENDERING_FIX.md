# Edge Rendering Fix - January 2026

## Problem Summary

Edges (connections between aliased variables) were not displaying in the React Flow graph view, even though Figma had correctly mapped variable aliases.

### Console Error
```
[FigZig] Edge 0: Target handle not found in DOM: VariableID:27:11-27:5-target
[FigZig] Setting 0 validated edges (filtered 4 invalid)
```

## Root Cause

The issue was in **how we extracted alias information from Figma's API**, not with Figma's data itself.

### Technical Explanation

1. **Figma's API Limitation**: When Figma returns a `VariableAlias`, it only includes:
   ```typescript
   {
     type: 'VARIABLE_ALIAS',
     id: 'target-variable-id'  // Only the target variable ID!
   }
   ```
   It does NOT include which mode in the target variable is being referenced.

2. **The Bug**: In `figmaToGraph.ts` line 232, the code was doing:
   ```typescript
   if (modeValue.type === 'alias') {
     modeValue = {
       ...modeValue,
       modeId: modeId,  // ❌ This is the SOURCE variable's mode ID!
     };
   }
   ```

3. **The Problem**: When creating edges, the code would look for a target handle like:
   - `VariableID:27:11-27:5-target`
   
   But if the target variable was in a different collection with different mode IDs, that handle wouldn't exist. The target variable's "light" mode might have ID `28:3` instead of `27:5`.

## The Fix

### 1. Resolve Target Mode ID by Name Matching (`figmaToGraph.ts`)

Instead of using the source mode ID, we now:
1. Find the target variable
2. Get the target variable's collection
3. Find the mode in the target collection with the **same name** as the source mode
4. Use that mode's actual ID

```typescript
if (modeValue.type === 'alias') {
  const targetVariable = figmaVariables.find(v => v.id === modeValue.variableId);
  
  if (targetVariable) {
    const targetCollection = figmaCollections.find(c => c.id === targetVariable.variableCollectionId);
    
    if (targetCollection) {
      // Find mode by name matching
      const targetMode = targetCollection.modes.find(m => m.name === modeName);
      
      if (targetMode) {
        modeValue = {
          ...modeValue,
          modeId: targetMode.modeId,  // ✅ Use TARGET mode ID!
        };
      }
    }
  }
}
```

### 2. Enhanced Validation (`graphToReactFlow.ts`)

Added comprehensive validation to ensure:
- Both source and target variables exist in the graph
- Both source and target nodes are actually rendered
- Both source and target modes exist
- Detailed logging for debugging

## Testing Instructions

### 1. Reload the Plugin in Figma

1. Open Figma
2. Go to Plugins → Development → FigZig (reload if already open)
3. Open the browser console (Cmd+Option+I on Mac, Ctrl+Shift+I on Windows)

### 2. Check the Console Logs

You should now see detailed logs like:

```
[FigZig] Resolved alias: Colors/Primary.light → Primitives/Blue.light (mode ID: 28:3)
[FigZig] ✓ Created edge: Primary.light → Blue.light
[FigZig] Edge creation complete: 4 valid edges, 0 skipped
```

### 3. Verify Edges Display

In the Graph View:
- You should see animated blue edges connecting aliased variables
- Edges should connect from the source mode handle (right side) to the target mode handle (left side)
- Hover over edges to see connection details

### 4. Test Different Scenarios

#### Scenario A: Same Collection Aliases
- Create two variables in the same collection
- Alias one to the other
- **Expected**: Edge should display correctly

#### Scenario B: Cross-Collection Aliases
- Create variables in two different collections with the same mode names (e.g., "light", "dark")
- Alias from one collection to another
- **Expected**: Edge should display correctly, using the target collection's mode IDs

#### Scenario C: Mismatched Mode Names
- Create an alias where the target collection doesn't have a mode with the same name
- **Expected**: Console warning, edge uses fallback to first mode

## Debugging

If edges still don't appear, check the console for:

1. **Alias Resolution Logs**:
   ```
   [FigZig] Resolved alias: SourceVar.modeName → TargetVar.modeName (mode ID: xxx)
   ```

2. **Edge Creation Logs**:
   ```
   [FigZig] ✓ Created edge: SourceVar.modeName → TargetVar.modeName
   ```

3. **Validation Warnings**:
   ```
   [FigZig] Alias 0: Skipping - target mode "27:5" not found in variable "TargetVar"
   ```

## Files Modified

1. `src/adapters/figmaToGraph.ts` - Fixed target mode ID resolution
2. `src/adapters/graphToReactFlow.ts` - Enhanced validation and logging

## Related Issues

- Original issue: Edges not rendering despite correct Figma aliases
- Console error: "Target handle not found in DOM"
- Root cause: Incorrect mode ID mapping in alias extraction

## Commit

```
commit e3aa286
Fix edge rendering by correctly resolving target mode IDs in aliases
```
