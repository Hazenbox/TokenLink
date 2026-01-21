/**
 * FigZag - Automated Figma Variables Orchestration Tool
 * Phase 0: System Design & Schema Definition
 * 
 * This file holds the main code for the plugin. It has access to the
 * Figma document via the figma global object.
 */

// Import Phase 0 type definitions to verify setup
import { 
  TokenGraph,
  Collection,
  Group,
  Variable,
  Alias,
  CollectionType,
  VariableType,
} from './src/types';

// Show the HTML UI
figma.showUI(__html__, { width: 400, height: 600 });

// Message handler for communication with the UI
figma.ui.onmessage = async (msg: { type: string; [key: string]: any }) => {
  try {
    switch (msg.type) {
      case 'test-phase-0':
        await testPhase0Schema();
        break;
      
      case 'cancel':
        figma.closePlugin();
        break;
      
      default:
        console.log('Unknown message type:', msg.type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    figma.notify('Error: ' + (error as Error).message, { error: true });
  }
};

/**
 * Test Phase 0 schema definitions
 * Creates a minimal token graph to verify types are working correctly
 */
async function testPhase0Schema() {
  console.log('Testing Phase 0 Schema Definitions...');
  
  // Create test collection
  const testCollection: Collection = {
    id: 'col-1',
    name: 'Test Primitives',
    type: 'primitive' as CollectionType,
    modes: ['mode-light', 'mode-dark'],
  };
  
  // Create test group
  const testGroup: Group = {
    id: 'grp-1',
    name: 'colors',
    collectionId: testCollection.id,
  };
  
  // Create test variable
  const testVariable: Variable = {
    id: 'var-1',
    name: 'blue-500',
    type: 'COLOR' as VariableType,
    groupId: testGroup.id,
    collectionId: testCollection.id,
    modes: [
      {
        id: 'mode-light',
        name: 'Light',
        value: { r: 0.2, g: 0.4, b: 0.8 },
      },
      {
        id: 'mode-dark',
        name: 'Dark',
        value: { r: 0.3, g: 0.5, b: 0.9 },
      },
    ],
  };
  
  // Create test alias
  const testAlias: Alias = {
    id: 'alias-1',
    fromVariableId: 'var-2',
    toVariableId: testVariable.id,
    modeMap: {
      'mode-light': 'mode-light',
      'mode-dark': 'mode-dark',
    },
  };
  
  // Create token graph
  const graph = new TokenGraph(
    [testCollection],
    [testGroup],
    [testVariable],
    [testAlias]
  );
  
  // Test graph methods
  const stats = graph.getStatistics();
  
  console.log('Phase 0 Schema Test Results:');
  console.log('- Collections:', stats.totalCollections);
  console.log('- Groups:', stats.totalGroups);
  console.log('- Variables:', stats.totalVariables);
  console.log('- Aliases:', stats.totalAliases);
  console.log('✓ All Phase 0 schemas validated successfully!');
  
  figma.notify('✓ Phase 0 schemas validated successfully!', { timeout: 3000 });
  
  // Send results to UI
  figma.ui.postMessage({
    type: 'phase-0-test-complete',
    statistics: stats,
    graph: graph.toJSON(),
  });
}
