/// <reference types="@figma/plugin-typings" />

// Main plugin entry point - runs in Figma's plugin sandbox

console.log('[FigZag] Plugin starting...');

// Show the plugin UI (Figma will load ui.html from manifest)
figma.showUI(__html__, {
  width: 1200,
  height: 800,
  title: 'FigZag - Variables Automation',
});

console.log('[FigZag] UI shown');

// Handle messages from UI
figma.ui.onmessage = async (msg: any) => {
  switch (msg.type) {
    case 'load-variables':
      await loadAndSendVariables();
      break;
      
    case 'close-plugin':
      figma.closePlugin();
      break;
      
    default:
      console.warn('Unknown message type:', msg.type);
  }
};

/**
 * Load all variables from Figma and send to UI
 */
async function loadAndSendVariables() {
  try {
    console.log('[FigZag] Loading variables...');
    // Get all local variable collections
    const collections = figma.variables.getLocalVariableCollections();
    console.log('[FigZag] Found collections:', collections.length);
    
    if (collections.length === 0) {
      figma.ui.postMessage({
        type: 'variables-loaded',
        data: {
          collections: [],
          variables: [],
        },
      });
      return;
    }

    // Collect all data
    const collectionsData = collections.map((collection: VariableCollection) => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map((mode: { modeId: string; name: string }) => ({
        modeId: mode.modeId,
        name: mode.name,
      })),
      variableIds: collection.variableIds,
    }));

    // Get all variables
    const allVariables: any[] = [];
    const variableMap = new Map<string, any>();

    for (const collection of collections) {
      for (const variableId of collection.variableIds) {
        const variable = figma.variables.getVariableById(variableId);
        
        if (variable) {
          const variableData = {
            id: variable.id,
            name: variable.name,
            collectionId: collection.id,
            resolvedType: variable.resolvedType,
            valuesByMode: {} as Record<string, any>,
          };

          // Get values for each mode
          collection.modes.forEach((mode: { modeId: string; name: string }) => {
            const value = variable.valuesByMode[mode.modeId];
            variableData.valuesByMode[mode.modeId] = value;
          });

          allVariables.push(variableData);
          variableMap.set(variable.id, variableData);
        }
      }
    }

    // Send data to UI for parsing
    console.log('[FigZag] Sending data to UI:', {
      collections: collectionsData.length,
      variables: allVariables.length,
    });
    figma.ui.postMessage({
      type: 'variables-loaded',
      data: {
        collections: collectionsData,
        variables: allVariables,
      },
    });

  } catch (error) {
    console.error('Error loading variables:', error);
    figma.ui.postMessage({
      type: 'error',
      message: `Failed to load variables: ${error}`,
    });
  }
}

// Auto-load variables when plugin opens
console.log('[FigZag] Auto-loading variables...');
loadAndSendVariables();
