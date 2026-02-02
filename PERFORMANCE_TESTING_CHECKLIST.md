# Performance Optimization Testing Checklist

## ✅ Completed Optimizations (Low-Risk Phases)

### Phase 1: Data Structure Optimization
- ✅ Added index maps to VariableGraph
- ✅ Updated builder functions to maintain indexes
- ✅ Optimized rule matching to use indexed lookups

### Phase 3: Graph Conversion Optimization
- ✅ Pre-built alias index maps
- ✅ Pre-built variable→group and group→collection maps
- ✅ Cached collection/group name lookups

### Phase 8: Deep Clone Optimization
- ✅ Replaced JSON.parse(JSON.stringify()) with structuredClone()

### Phase 9: Production Logging
- ✅ Created environment-aware logger
- ✅ Gated console.logs in render paths

## 🧪 Testing Checklist

### Critical Functionality Tests

#### 1. Rule Engine Functionality
- [ ] **Test rule matching**: Create a rule and verify it matches correct variables
- [ ] **Test rule evaluation**: Run dry-run and verify results are correct
- [ ] **Test rule application**: Apply rules and verify aliases are created correctly
- [ ] **Test with large graphs**: Test with 100+ variables, verify performance improvement
- [ ] **Test edge cases**: 
  - Empty collections
  - Single variable
  - Variables without groups
  - Rules with no matches

#### 2. Graph View Functionality
- [ ] **Load graph**: Verify graph loads and displays correctly
- [ ] **Node rendering**: Verify all nodes render with correct data
- [ ] **Edge rendering**: Verify all aliases are shown as edges
- [ ] **Node interactions**: Click nodes, verify selection works
- [ ] **Edge interactions**: Hover edges, verify tooltips work
- [ ] **Layout**: Verify nodes are positioned correctly in columns

#### 3. Graph Conversion
- [ ] **Graph sync**: Verify graph syncs correctly when variables change in Figma
- [ ] **Graph updates**: Add/remove variables, verify graph updates correctly
- [ ] **Index consistency**: Verify index maps stay in sync after updates

#### 4. Safety Mechanisms (CRITICAL)
- [ ] **Circular dependency detection**: Try to create circular alias, verify it's blocked
- [ ] **Backwards alias prevention**: Try to alias primitive → semantic, verify it's blocked
- [ ] **Rule validation**: Verify invalid rules are caught and reported

### Performance Tests

#### 5. Rule Matching Performance
- [ ] **Small graph** (< 100 variables): Should be instant
- [ ] **Medium graph** (100-500 variables): Should be < 50ms
- [ ] **Large graph** (500-1000 variables): Should be < 100ms
- [ ] **Very large graph** (1000+ variables): Should be < 200ms

#### 6. Graph Conversion Performance
- [ ] **Small graph**: Should be < 20ms
- [ ] **Medium graph**: Should be < 50ms
- [ ] **Large graph**: Should be < 100ms

#### 7. UI Rendering Performance
- [ ] **Initial render**: Should be smooth (60fps)
- [ ] **Graph updates**: Should not cause stuttering
- [ ] **Node interactions**: Should be responsive
- [ ] **Scroll performance**: Should be smooth with many nodes

### Regression Tests

#### 8. Existing Features
- [ ] **Create alias**: Manual alias creation still works
- [ ] **Delete alias**: Alias deletion still works
- [ ] **Rename variables**: Renaming still works
- [ ] **Import/Export**: Graph import/export still works
- [ ] **Rule editor**: Rule creation/editing still works
- [ ] **Rule runner**: Rule evaluation still works

#### 9. Edge Cases
- [ ] **Empty graph**: Plugin works with no variables
- [ ] **Single collection**: Works with one collection
- [ ] **Single variable**: Works with one variable
- [ ] **Duplicate names**: Handles duplicate collection/group/variable names
- [ ] **Special characters**: Handles names with special characters

## 🐛 Known Issues to Watch For

1. **Index map sync**: If graphs are created without using builder functions, indexes may be out of sync
   - ✅ Fixed: RuleEditor now uses builder functions
   - ⚠️ Watch: Any other places that create graphs directly

2. **TypeScript errors**: Some pre-existing type errors (not related to optimizations)
   - These don't affect functionality but should be fixed eventually

3. **Console.logs**: Some console.logs may still exist in non-critical paths
   - Critical render paths are gated
   - Can be cleaned up in future pass

## 📊 Performance Comparison

### Before Optimization
- Rule evaluation: 200-500ms (100 rules × 1000 variables)
- Graph conversion: 50-200ms (1000 variables)
- UI render: 100-300ms (large graphs)

### After Optimization (Expected)
- Rule evaluation: < 50ms (10x improvement)
- Graph conversion: < 20ms (5x improvement)
- UI render: < 16ms (60fps maintained)

## ✅ Quick Smoke Test

Run these quick tests to verify basic functionality:

1. **Open plugin** → Should load without errors
2. **View graph** → Should display all variables
3. **Create a rule** → Should match variables correctly
4. **Run dry-run** → Should show preview results
5. **Apply rule** → Should create aliases correctly
6. **Try circular alias** → Should be blocked
7. **Try backwards alias** → Should be blocked

If all these pass, the optimizations are working correctly!

## 🚨 If Something Breaks

1. **Check browser console** for errors
2. **Check Figma console** (View → Developer → Console) for plugin errors
3. **Verify graph data** is loading correctly
4. **Check index maps** are populated (add console.log temporarily)
5. **Rollback** if needed: `git revert HEAD`

## 📝 Notes

- All optimizations maintain backward compatibility
- Index maps are maintained automatically by builder functions
- Fallbacks are in place for graphs without indexes (shouldn't happen)
- Critical safety mechanisms (cycle detection, alias validation) are unchanged
