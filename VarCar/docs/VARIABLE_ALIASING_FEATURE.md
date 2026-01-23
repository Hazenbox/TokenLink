# Variable Aliasing Feature Documentation

## Overview

This document explains the variable aliasing feature implemented in FigZig, including how to use it, the underlying implementation, safety mechanisms, and associated risks.

## What is Variable Aliasing?

Variable aliasing allows one variable's mode to reference (alias) another variable's mode. When a variable is aliased, it inherits the value from the target variable. This enables:

- **Centralized token management**: Update one primitive variable, and all aliased semantic/theme variables update automatically
- **Design system hierarchy**: Build token hierarchies (Primitives → Semantic → Theme)
- **Mode-specific aliasing**: Different modes can alias to different variables (e.g., Light mode → Light primitives, Dark mode → Dark primitives)

### Example

```
Primitive Variable: color-blue-500 = #0000FF
Semantic Variable: color-primary = alias → color-blue-500

When color-blue-500 changes to #0000EE:
→ color-primary automatically becomes #0000EE
```

## User Interface

### Graph View

1. **Switch to Graph View**: Click the "Graph View" button in the header
2. **Visual Representation**:
   - Variables appear as **nodes** with collection/group information
   - Aliases appear as **animated edges** (blue arrows)
   - Zoom, pan, and use minimap for navigation
3. **Create Alias**: Click any variable node to open the alias creation modal

### Alias Creation Modal

When you click a node, a modal opens with:

1. **Source Variable**: Pre-filled with the clicked variable
2. **Source Mode**: Select which mode to alias
3. **Target Variable**: Search and select the target variable
4. **Target Mode**: Select which target mode to alias to
5. **Preview**: Shows the alias relationship before creation
6. **Validation**: Real-time circular dependency checking

### Tree View

The traditional tree view remains available. Toggle between views using the header buttons.

## Implementation Details

### Architecture

```
User clicks node
    ↓
AliasModal opens
    ↓
User selects target
    ↓
Check circular dependency (UI → Plugin)
    ↓
Create alias via Figma API
    ↓
Refresh graph
    ↓
Show success notification
```

### Key Components

1. **graphToReactFlow.ts**: Converts internal graph to React Flow format
2. **VariableGraphView.tsx**: Main graph visualization component
3. **VariableNode.tsx**: Custom node component
4. **AliasModal.tsx**: Modal for creating aliases
5. **wouldCreateCycle()**: Pre-flight circular dependency detection
6. **Plugin handlers**: Message handlers in `code.ts` for alias operations

### Safety Mechanisms

#### 1. Circular Dependency Detection

**What it prevents**: Creating alias chains that loop back (A → B → C → A)

**How it works**:
- Before creating an alias, runs depth-first search (DFS) from target to source
- If target can reach source through existing aliases, prevents creation
- Checks happen both in UI (pre-flight) and plugin (final validation)

**Example of blocked cycle**:
```
Existing: A → B, B → C
Trying to create: C → A
Result: ❌ Blocked - would create cycle A → B → C → A
```

#### 2. Mode Compatibility Check

**What it prevents**: Aliasing to non-existent modes

**How it works**:
- Validates target variable has the selected mode
- Filters available modes based on target variable
- Shows error if mode doesn't exist

#### 3. Variable Existence Validation

**What it prevents**: Aliasing to deleted variables

**How it works**:
- Validates both source and target variables exist before API call
- Handles "variable not found" errors gracefully

## Risks and Mitigations

### Risk 1: Circular Dependencies

**Risk Level**: HIGH

**Description**: Creating alias cycles (A → B → C → A) causes infinite resolution loops, which can:
- Freeze Figma
- Crash the plugin
- Corrupt the variable system
- Make variables unusable

**Impact**: CRITICAL - Can make entire variable collections unusable

**Mitigation**:
- ✅ Pre-flight cycle detection using DFS algorithm
- ✅ Post-creation validation runs `detectCircularDependencies()`
- ✅ Clear error messages explaining the cycle path
- ✅ Visual highlighting of problematic relationships in graph
- ✅ Self-alias prevention (A → A blocked)

**User Action**: If you see a circular dependency error, **do not bypass it**. Redesign your alias structure to avoid the cycle.

### Risk 2: Mode Mismatches

**Risk Level**: MEDIUM

**Description**: Aliasing a mode to a target variable that doesn't have that mode causes:
- Broken variable resolution
- Missing values in designs
- Inconsistent behavior across modes

**Impact**: MEDIUM - Affects specific modes but doesn't break entire system

**Mitigation**:
- ✅ Mode compatibility validation before creation
- ✅ Filter available modes by target variable
- ✅ Show warnings if modes don't align
- ✅ Clear error messages

**User Action**: Ensure your target variable has the modes you need before aliasing.

### Risk 3: Data Loss

**Risk Level**: MEDIUM

**Description**: Creating an alias **overwrites** the existing value for that mode:
- Old value is lost (not recoverable)
- No undo mechanism
- Affects all instances using that variable

**Impact**: MEDIUM - Can lose design token values

**Mitigation**:
- ✅ Confirmation dialog shows preview before creation
- ✅ Clear display of what will be replaced
- ✅ Option to cancel operation
- ⚠️ **Recommendation**: Test in a duplicate file first

**User Action**: Always verify you're aliasing the correct variable/mode before confirming.

### Risk 4: Backwards Alias Prevention

**Risk Level**: ELIMINATED

**Description**: Previously, users could accidentally create "backwards aliases" where primitive tokens (containing raw values like #FF5733) would alias to semantic/interaction tokens, causing the primitive to lose its foundational value.

**Impact**: NONE - This is now prevented by the system

**Mitigation**:
- ✅ Automatic validation of all alias directions
- ✅ Primitives cannot be aliased (enforced in UI and rule engine)
- ✅ Clear error messages explaining the token hierarchy
- ✅ Validation applies to both manual aliases and rule-based aliases

**Token Hierarchy Rules** (automatically enforced):

Valid alias directions:
- ✅ Semantic → Primitive
- ✅ Interaction → Primitive
- ✅ Brand → Primitive
- ✅ Theme → Semantic
- ✅ Theme → Primitive

Invalid alias directions (blocked):
- ❌ Primitive → Semantic
- ❌ Primitive → Interaction
- ❌ Primitive → Theme
- ❌ Primitive → Brand

**User Action**: None required. The system prevents invalid alias directions automatically.

### Risk 5: Performance with Large Graphs

**Risk Level**: LOW

**Description**: Circular dependency checks on graphs with thousands of variables can be slow:
- Modal may lag during validation
- UI may feel unresponsive
- DFS traversal takes time

**Impact**: LOW - Only affects UX, not data integrity

**Mitigation**:
- ✅ Efficient DFS algorithm (already implemented)
- ✅ Caching graph state during modal interaction
- ✅ Loading state indicator during validation
- ✅ Async validation doesn't block UI

**User Action**: Be patient with large variable sets. Consider organizing into smaller collections.

### Risk 5: Concurrent Modifications

**Risk Level**: LOW

**Description**: Graph state changing while user is creating alias:
- Variables deleted after modal opens
- Aliases created by other users
- Stale state leading to errors

**Impact**: LOW - Fails safely with error message

**Mitigation**:
- ✅ Refresh validation before final creation
- ✅ Error handling for deleted variables
- ⚠️ No multi-user conflict detection (Figma limitation)

**User Action**: Work in isolated files or coordinate with team when creating aliases.

### Risk 6: Deep Alias Chains

**Risk Level**: LOW

**Description**: Very deep alias chains (A → B → C → D → E → F) can:
- Slow down Figma's variable resolution
- Make debugging difficult
- Increase chance of accidental cycles
- Reduce transparency of value source

**Impact**: LOW - Works but reduces maintainability

**Mitigation**:
- ✅ Visual graph makes chains visible
- ✅ Click edges to see alias details
- ⚠️ **Recommendation**: Keep chains under 3-4 levels

**User Action**: Design token hierarchy thoughtfully. Avoid unnecessary alias layers.

## Best Practices

### 1. Design Token Hierarchy

Keep a clean hierarchy:
```
Primitives (raw values)
    ↓
Semantic (aliased to primitives)
    ↓
Theme/Component (aliased to semantic)
```

### 2. Mode Alignment

Ensure collections have compatible modes:
- If Light/Dark in primitives, maintain Light/Dark in semantic
- Don't alias Light → Dark (creates confusion)
- Use consistent mode names across collections

### 3. Testing Strategy

1. **Test in duplicate file first**
2. **Create aliases incrementally** (not bulk)
3. **Verify in designs** after creation
4. **Check all modes** work correctly
5. **Document your alias structure**

### 4. Avoiding Cycles

- Plan your hierarchy on paper first
- Never alias "upstream" (semantic → primitive)
- Use graph view to visualize relationships
- If warned about cycle, redesign structure

### 5. Large Scale Operations

For 100+ aliases:
- Work in smaller batches
- Test each batch before continuing
- Keep graph refreshed
- Save/commit frequently

## Troubleshooting

### "Circular dependency detected"

**Cause**: Creating this alias would form a cycle

**Solution**: 
1. Check the graph to see existing aliases
2. Redesign your alias structure to avoid the cycle
3. Consider aliasing to a different variable

### "Variable not found"

**Cause**: Target variable was deleted or doesn't exist

**Solution**:
1. Refresh the graph
2. Verify variable exists in Figma
3. Select a different target

### "Mode does not exist"

**Cause**: Target variable doesn't have the selected mode

**Solution**:
1. Check target variable's modes
2. Add the mode to target variable first
3. Or select a different mode

### Graph not updating

**Cause**: Stale state or UI not refreshing

**Solution**:
1. Click the view toggle to force refresh
2. Close and reopen the plugin
3. Reload Figma

## API Reference

### Message Types

#### `create-alias`
```typescript
{
  type: 'create-alias',
  data: {
    sourceVariableId: string,
    sourceModeId: string,
    targetVariableId: string,
    targetModeId: string
  }
}
```

#### `check-circular-dependency`
```typescript
{
  type: 'check-circular-dependency',
  data: {
    sourceVariableId: string,
    targetVariableId: string
  }
}
```

### Response Types

#### `alias-created`
```typescript
{
  type: 'alias-created',
  data: {
    success: true,
    graph: SerializedGraph
  }
}
```

#### `alias-creation-error`
```typescript
{
  type: 'alias-creation-error',
  data: {
    message: string
  }
}
```

## Technical Details

### Figma API Usage

```typescript
// Create alias
const aliasValue = figma.variables.createVariableAlias(targetVariable);
sourceVariable.setValueForMode(sourceModeId, aliasValue);
```

### Cycle Detection Algorithm

Uses depth-first search (DFS) with recursion stack:

```typescript
function wouldCreateCycle(graph, from, to) {
  if (from === to) return true; // Self-alias
  
  // Check if 'to' can reach 'from' through existing aliases
  return canReachTarget(to, from);
}
```

**Time Complexity**: O(V + E) where V = variables, E = aliases
**Space Complexity**: O(V) for visited set

## Future Enhancements

- [ ] Bulk alias operations
- [ ] Alias templates/presets
- [ ] Visual cycle highlighting in graph
- [ ] Undo/redo for alias creation
- [ ] Export/import alias configurations
- [ ] Rule-based aliasing (PHASE 3 of PRD)

## Support

For issues or questions:
1. Check this documentation
2. Review the plan file
3. Check console logs in Figma
4. Test in duplicate file

## Design Token Hierarchy

FigZig enforces industry-standard design token hierarchy to maintain system integrity:

### Hierarchy Levels

**Level 0: Primitive** (Foundation)
- Raw values: colors (#FF5733), spacing (16px), font sizes, etc.
- Never aliased - always contains actual values
- Example: `color-blue-500 = #3B82F6`

**Level 1: Semantic/Interaction/Brand** (Meaning)
- Purpose-driven tokens that reference primitives
- Can alias to primitives
- Example: `color-primary → color-blue-500`

**Level 2: Theme** (Context)
- Theme-specific tokens
- Can alias to semantic or primitives
- Example: `theme-dark-background → color-gray-900`

### Why This Matters

When you alias a variable, you're replacing its value with a reference. If primitives could be aliased:
- ❌ The foundation loses its raw value
- ❌ No single source of truth for base colors
- ❌ Cannot update the primitive without breaking the chain

By enforcing the hierarchy:
- ✅ Primitives remain the single source of truth
- ✅ Changes cascade correctly through the system
- ✅ Token architecture follows best practices

## Version History

- **v1.1** (2026-01-23): Added backwards alias prevention and token hierarchy enforcement
- **v1.0** (2026-01-22): Initial release with React Flow graph visualization and alias creation

---

**Remember**: Aliasing is powerful but irreversible. Always test in a safe environment first!
