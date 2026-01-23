# Validation Architecture Implementation Test

## Overview

This document provides test cases to verify the validation architecture improvements following OWASP defense-in-depth principles.

## Changes Implemented

1. **Backend Direction Validation** - Added to `src/code.ts` (lines ~110-167)
2. **Removed Redundant Validation** - From `src/engine/ruleEvaluator.ts` (lines ~178-187)
3. **Exported Helper Function** - `inferCollectionType` from `src/adapters/figmaToGraph.ts`

## Test Setup in Figma

### Prerequisites

1. Open Figma and load the plugin
2. Create test collections with different types:
   - **Primitive Collection**: Name it "Color Primitives"
   - **Semantic Collection**: Name it "Semantic Colors"
   - **Theme Collection**: Name it "Theme Colors"

3. Create test variables:
   - In Primitive Collection: `primitive-blue` with value `#0000FF`
   - In Semantic Collection: `semantic-primary` with value `#FF0000`
   - In Theme Collection: `theme-accent` with value `#00FF00`

## Test Cases

### Test 1: Backend Validation - Valid Alias (Semantic → Primitive)

**Description**: Backend should ALLOW semantic → primitive aliases

**Steps**:
1. Open the plugin
2. Switch to Graph View
3. Create alias: `semantic-primary` → `primitive-blue`
4. Verify: Alias is created successfully

**Expected Result**: ✅ Alias created without errors

**Status**: [ ] Pass [ ] Fail

---

### Test 2: Backend Validation - Invalid Alias (Primitive → Semantic)

**Description**: Backend should BLOCK primitive → semantic aliases

**Steps**:
1. Open the plugin
2. Try to create alias: `primitive-blue` → `semantic-primary`
3. Observe the error message

**Expected Result**: ❌ Error message: "Cannot create alias: Primitive collections should never be aliased"

**Status**: [ ] Pass [ ] Fail

---

### Test 3: Backend Security - Bypass UI Validation

**Description**: Backend must block invalid aliases even when UI is bypassed

**Steps**:
1. Open browser DevTools (Option+Cmd+I on Mac, F12 on Windows)
2. In Console, try to bypass UI validation:
   ```javascript
   // First, get variable IDs from the plugin UI or inspect network requests
   // Replace <primitive-var-id> and <semantic-var-id> with actual IDs
   // Replace <mode-id> with actual mode ID (usually from the Default mode)
   
   // This simulates bypassing the UI validation
   parent.postMessage({
     pluginMessage: {
       type: 'create-alias',
       data: {
         sourceVariableId: '<primitive-var-id>',
         sourceModeId: '<mode-id>',
         targetVariableId: '<semantic-var-id>',
         targetModeId: '<mode-id>'
       }
     }
   }, '*');
   ```

**Expected Result**: ❌ Backend rejects with error about invalid alias direction

**Alternative Test Method**:
- Since direct console access might be restricted in Figma, you can:
  1. Temporarily modify the UI code to skip validation
  2. Or use the rule engine to attempt creating backwards aliases

**Status**: [ ] Pass [ ] Fail

---

### Test 4: UI Validation Still Works

**Description**: UI should still show validation errors immediately

**Steps**:
1. Open the plugin
2. Try to create alias: `primitive-blue` → `semantic-primary` through the UI
3. Observe: Error should appear BEFORE the alias is attempted

**Expected Result**: ❌ UI shows error with explanation about token hierarchy

**Status**: [ ] Pass [ ] Fail

---

### Test 5: Rule Engine - Dry Run Shows Warnings

**Description**: Rule engine dry-run should catch invalid directions

**Steps**:
1. Open the plugin's Rules tab
2. Create a rule:
   ```
   WHEN collection = "Color Primitives"
   THEN aliasTo = "Semantic Colors"
   ```
3. Click "Preview" (dry-run mode)
4. Observe the warnings

**Expected Result**: ⚠️ Warning shows that aliases will be skipped due to invalid direction

**Status**: [ ] Pass [ ] Fail

---

### Test 6: Rule Engine - Apply Mode (No Redundant Validation)

**Description**: Rule engine apply mode should not re-validate direction

**Steps**:
1. Using the same rule from Test 5
2. Open DevTools Console to see logs
3. Click "Apply" to execute the rule
4. Check console logs

**Expected Result**: 
- ℹ️ No "Double-check alias direction" log messages
- ✅ Comment in code explains validation already done in dry-run

**Status**: [ ] Pass [ ] Fail

---

### Test 7: Circular Dependency Check Still Works

**Description**: Circular dependency validation should work at all layers

**Steps**:
1. Create three variables: A, B, C
2. Create alias: A → B
3. Create alias: B → C
4. Try to create alias: C → A (would create cycle)

**Expected Result**: ❌ Error: "Cannot create alias: This would create a circular dependency"

**Status**: [ ] Pass [ ] Fail

---

### Test 8: Valid Multi-Level Alias (Theme → Semantic → Primitive)

**Description**: Multi-level valid aliases should work

**Steps**:
1. Create alias: `semantic-primary` → `primitive-blue`
2. Create alias: `theme-accent` → `semantic-primary`
3. Verify both aliases created successfully

**Expected Result**: ✅ Both aliases created, showing proper hierarchy

**Status**: [ ] Pass [ ] Fail

---

## Validation Checklist

After running all tests, verify:

- [ ] Backend blocks primitive → semantic aliases
- [ ] Backend blocks primitive → theme aliases  
- [ ] Backend blocks primitive → brand aliases
- [ ] Backend allows semantic → primitive aliases
- [ ] Backend allows theme → semantic aliases
- [ ] Backend allows theme → primitive aliases
- [ ] Backend allows interaction → primitive aliases
- [ ] Backend allows brand → primitive aliases
- [ ] UI validation still provides immediate feedback
- [ ] Rule engine dry-run shows correct warnings
- [ ] Rule engine apply mode doesn't log redundant validation
- [ ] Circular dependency check works at all layers
- [ ] Error messages are clear and helpful
- [ ] No linter errors in modified files
- [ ] Plugin builds successfully

## Performance Verification

Monitor performance impact:

1. **Backend Overhead**: Creating a single alias should add < 5ms
2. **Rule Engine**: Removing redundant validation should improve batch operations slightly

## Security Verification

Confirm defense-in-depth implementation:

1. **Layer 1 (UI)**: Provides immediate feedback ✅
2. **Layer 2 (Backend)**: Enforces security rules ✅
3. **Layer 3 (Domain Logic)**: Maintains business constraints ✅

## Files Modified

1. `src/code.ts` - Added backend direction validation
2. `src/engine/ruleEvaluator.ts` - Removed redundant validation
3. `src/adapters/figmaToGraph.ts` - Exported `inferCollectionType` function

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Valid Alias (Semantic → Primitive) | [ ] | |
| Invalid Alias (Primitive → Semantic) | [ ] | |
| Backend Security (Bypass UI) | [ ] | |
| UI Validation | [ ] | |
| Rule Engine Dry-Run | [ ] | |
| Rule Engine Apply | [ ] | |
| Circular Dependency | [ ] | |
| Multi-Level Alias | [ ] | |

## Notes

_Add any observations or issues found during testing here_

---

## Test Completion

Date: _______________
Tester: _______________
Result: [ ] All Pass [ ] Issues Found

If issues found, document them and create follow-up tasks.
