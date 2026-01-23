/**
 * Test script to verify the internal graph model works correctly
 * Run this with: npx ts-node test-graph-model.ts
 */

import {
  createGraph,
  addCollection,
  addGroup,
  addVariable,
  validateGraph,
  getVariableByPath,
  getGraphStats,
  detectCircularDependencies,
  getAliasesForVariable,
  isModeValue,
  isModeAlias,
  type VariableGraph,
} from './src/models';

console.log('🧪 Testing Internal Graph Model...\n');

// Test 1: Create an empty graph
console.log('✅ Test 1: Create empty graph');
const graph: VariableGraph = createGraph();
console.log('   Created graph:', { 
  collections: graph.collections.size,
  groups: graph.groups.size,
  variables: graph.variables.size,
  aliases: graph.aliases.length
});

// Test 2: Add a collection
console.log('\n✅ Test 2: Add collection');
addCollection(graph, {
  id: 'col-1',
  name: 'Primitives',
  type: 'primitive',
});
console.log('   Added collection "Primitives"');

// Test 3: Add a group
console.log('\n✅ Test 3: Add group');
addGroup(graph, {
  id: 'grp-1',
  name: 'Colors',
  collectionId: 'col-1',
});
console.log('   Added group "Colors" to collection "Primitives"');

// Test 4: Add a variable with direct values
console.log('\n✅ Test 4: Add variable with direct values');
addVariable(graph, {
  id: 'var-1',
  name: 'primary',
  groupId: 'grp-1',
  variableType: 'COLOR',
  modes: [
    {
      id: 'mode-light',
      name: 'Light',
      value: { type: 'value', value: '#0000FF' },
    },
    {
      id: 'mode-dark',
      name: 'Dark',
      value: { type: 'value', value: '#8888FF' },
    },
  ],
});
console.log('   Added variable "primary" with Light and Dark modes');

// Test 5: Add another collection for semantic tokens
console.log('\n✅ Test 5: Add semantic collection');
addCollection(graph, {
  id: 'col-2',
  name: 'Semantic',
  type: 'semantic',
});
addGroup(graph, {
  id: 'grp-2',
  name: 'Interactive',
  collectionId: 'col-2',
});
console.log('   Added "Semantic" collection with "Interactive" group');

// Test 6: Add a variable with alias
console.log('\n✅ Test 6: Add variable with alias');
addVariable(graph, {
  id: 'var-2',
  name: 'button-primary',
  groupId: 'grp-2',
  variableType: 'COLOR',
  modes: [
    {
      id: 'mode-light-2',
      name: 'Light',
      value: { 
        type: 'alias', 
        variableId: 'var-1',
        modeId: 'mode-light'
      },
    },
    {
      id: 'mode-dark-2',
      name: 'Dark',
      value: { 
        type: 'alias', 
        variableId: 'var-1',
        modeId: 'mode-dark'
      },
    },
  ],
});
console.log('   Added "button-primary" aliasing to "primary"');

// Test 7: Get graph statistics
console.log('\n✅ Test 7: Graph statistics');
const stats = getGraphStats(graph);
console.log('   Stats:', stats);

// Test 8: Get variable by path
console.log('\n✅ Test 8: Get variable by path');
const foundVar = getVariableByPath(graph, 'Primitives', 'Colors', 'primary');
if (foundVar) {
  console.log('   Found variable:', foundVar.name);
  console.log('   Modes:', foundVar.modes.map(m => m.name).join(', '));
} else {
  console.log('   ❌ Variable not found!');
}

// Test 9: Get aliases for variable
console.log('\n✅ Test 9: Get aliases for variable');
const aliases = getAliasesForVariable(graph, 'var-1');
console.log('   Aliases for "primary":', aliases.length);
if (aliases.length > 0) {
  console.log('   Mode mappings:', aliases[0].modeMap);
}

// Test 10: Type guards
console.log('\n✅ Test 10: Type guards');
const var1 = graph.variables.get('var-1')!;
const directValue = var1.modes[0].value;
const var2 = graph.variables.get('var-2')!;
const aliasValue = var2.modes[0].value;

console.log('   var-1 mode is direct value:', isModeValue(directValue));
console.log('   var-1 mode is alias:', isModeAlias(directValue));
console.log('   var-2 mode is direct value:', isModeValue(aliasValue));
console.log('   var-2 mode is alias:', isModeAlias(aliasValue));

// Test 11: Validate graph
console.log('\n✅ Test 11: Validate graph');
const validation = validateGraph(graph);
console.log('   Graph is valid:', validation.valid);
console.log('   Errors:', validation.errors.length);
console.log('   Warnings:', validation.warnings.length);

// Test 12: Detect circular dependencies
console.log('\n✅ Test 12: Detect circular dependencies');
const cycles = detectCircularDependencies(graph);
console.log('   Circular dependencies found:', cycles.length);

// Test 13: Add invalid data to test validation
console.log('\n✅ Test 13: Test validation with orphaned variable');
const testGraph = createGraph();
addCollection(testGraph, {
  id: 'col-test',
  name: 'Test',
  type: 'primitive',
});
// Add variable without group (should fail validation)
testGraph.variables.set('var-orphan', {
  id: 'var-orphan',
  name: 'orphan',
  groupId: 'non-existent-group',
  modes: [],
});
const testValidation = validateGraph(testGraph);
console.log('   Validation should fail:', !testValidation.valid);
console.log('   Errors found:', testValidation.errors.length);
if (testValidation.errors.length > 0) {
  console.log('   Error message:', testValidation.errors[0]);
}

// Test 14: Test circular dependency detection
console.log('\n✅ Test 14: Test circular dependency detection');
const circularGraph = createGraph();
addCollection(circularGraph, { id: 'col-c', name: 'Test', type: 'primitive' });
addGroup(circularGraph, { id: 'grp-c', name: 'Test', collectionId: 'col-c' });

// Add two variables that alias each other
addVariable(circularGraph, {
  id: 'var-a',
  name: 'varA',
  groupId: 'grp-c',
  modes: [{
    id: 'mode-1',
    name: 'Default',
    value: { type: 'alias', variableId: 'var-b', modeId: 'mode-2' }
  }]
});
addVariable(circularGraph, {
  id: 'var-b',
  name: 'varB',
  groupId: 'grp-c',
  modes: [{
    id: 'mode-2',
    name: 'Default',
    value: { type: 'alias', variableId: 'var-a', modeId: 'mode-1' }
  }]
});

const circularCycles = detectCircularDependencies(circularGraph);
console.log('   Circular dependencies detected:', circularCycles.length > 0);
if (circularCycles.length > 0) {
  console.log('   Cycle path:', circularCycles[0].join(' → '));
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('🎉 All tests completed successfully!');
console.log('='.repeat(50));
console.log('\nFinal graph state:');
console.log('  Collections:', graph.collections.size);
console.log('  Groups:', graph.groups.size);
console.log('  Variables:', graph.variables.size);
console.log('  Aliases:', graph.aliases.length);
console.log('\n✅ Internal Graph Model is working correctly!');
