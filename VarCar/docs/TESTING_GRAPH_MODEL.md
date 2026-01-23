# Testing the Internal Graph Model

## Quick Test (Recommended)

Run the comprehensive test suite:

```bash
npx tsc test-graph-model.ts --module commonjs --moduleResolution node --esModuleInterop --target ES2020 && node test-graph-model.js
```

This runs 14 tests covering all functionality:

✅ **Test 1:** Create empty graph  
✅ **Test 2:** Add collection  
✅ **Test 3:** Add group  
✅ **Test 4:** Add variable with direct values  
✅ **Test 5:** Add semantic collection  
✅ **Test 6:** Add variable with alias  
✅ **Test 7:** Graph statistics  
✅ **Test 8:** Get variable by path  
✅ **Test 9:** Get aliases for variable  
✅ **Test 10:** Type guards  
✅ **Test 11:** Validate graph  
✅ **Test 12:** Detect circular dependencies  
✅ **Test 13:** Test validation with orphaned variable  
✅ **Test 14:** Test circular dependency detection  

**Expected Output:**
```
🎉 All tests completed successfully!
✅ Internal Graph Model is working correctly!
```

## Manual Verification

### 1. Check TypeScript Compilation

```bash
npm run build
```

**Expected:** No TypeScript errors, clean build.

### 2. Check Model Files Exist

```bash
ls -la src/models/
```

**Expected:**
```
types.ts    # Core type definitions
graph.ts    # Graph container and utilities
index.ts    # Public API exports
```

### 3. Import Test

Create a simple file `quick-test.ts`:

```typescript
import { createGraph, addCollection, getGraphStats } from './src/models';

const graph = createGraph();
addCollection(graph, {
  id: '1',
  name: 'Test',
  type: 'primitive'
});

console.log('Stats:', getGraphStats(graph));
```

Run it:
```bash
npx tsc quick-test.ts --module commonjs --esModuleInterop && node quick-test.js
```

**Expected Output:**
```
Stats: { collectionCount: 1, groupCount: 0, variableCount: 0, aliasCount: 0 }
```

## What Each Test Verifies

### Core Functionality Tests (1-6)
- **Creating graphs** from scratch
- **Adding entities** (collections, groups, variables)
- **Direct values** (colors, numbers)
- **Alias values** (references to other variables)

### Query Tests (7-9)
- **Statistics** gathering
- **Path-based lookups** (find by collection/group/name)
- **Alias querying** (find relationships)

### Type Safety Tests (10)
- **Type guards** work correctly
- **Discriminated unions** function properly

### Validation Tests (11-14)
- **Graph validation** catches structural errors
- **Orphaned nodes** detection
- **Circular dependencies** detection

## Common Issues & Solutions

### Issue: TypeScript Compilation Errors

**Solution:**
```bash
# Clean build
rm -rf dist/
npm run build
```

### Issue: Module Not Found

**Solution:** Make sure you're in the project root:
```bash
cd /Users/upendranath.kaki/Desktop/Codes/FigZig
```

### Issue: Test Fails

**Solution:** Check the error message. The test is designed to show exactly which functionality failed.

## Testing in Your Code

To use the model in your own code:

```typescript
import {
  createGraph,
  addCollection,
  addGroup,
  addVariable,
  validateGraph,
  type VariableGraph
} from './src/models';

// Create a graph
const graph = createGraph();

// Add your data
addCollection(graph, { /* ... */ });
addGroup(graph, { /* ... */ });
addVariable(graph, { /* ... */ });

// Validate
const validation = validateGraph(graph);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
```

## Integration with Figma Plugin

In Phase 1, you'll create adapter functions like:

```typescript
// Future: src/adapters/figma-to-graph.ts
import { createGraph, addCollection, addGroup, addVariable } from '../models';

export async function loadFigmaVariables(): Promise<VariableGraph> {
  const graph = createGraph();
  
  // Get Figma data
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Convert to internal model
  collections.forEach(col => {
    addCollection(graph, {
      id: col.id,
      name: col.name,
      type: 'primitive' // Determine from naming convention
    });
  });
  
  return graph;
}
```

## Success Criteria

✅ `npm run build` succeeds with no errors  
✅ Test script runs and all 14 tests pass  
✅ Can import and use model in other TypeScript files  
✅ Type checking works correctly  
✅ Validation catches errors  
✅ Circular dependency detection works  

## Next Steps

Once the model is verified:

1. **Phase 1:** Create Figma API → Graph adapters
2. **Phase 1:** Display graph in UI using React Flow
3. **Phase 3:** Build rules engine on top of this model
4. **Phase 5:** Add JSON export/import
5. **Phase 6:** Add advanced validation

## Questions?

- See [`docs/INTERNAL_GRAPH_MODEL.md`](./INTERNAL_GRAPH_MODEL.md) for architecture details
- See [`test-graph-model.ts`](../test-graph-model.ts) for usage examples
- Check [`src/models/`](../src/models/) for source code
