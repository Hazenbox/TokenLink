// This is the main plugin code that runs in Figma's sandbox environment
// It handles Figma API calls and communicates with the UI

/// <reference types="@figma/plugin-typings" />

import { figmaToGraph, serializeGraph, inferCollectionType } from './adapters/figmaToGraph';
import { wouldCreateCycle } from './models/graph';
import { RuleEngine } from './engine/ruleEngine';
import { AliasOperation } from './engine/types';
import { exportGraphToJSON, parseImportJSON, isCompatibleVersion, ImportResult } from './models/export';
import { validateAliasDirection } from './utils/aliasValidation';
import { CollectionType } from './models/types';
import { 
  detectImportFormat, 
  parseFigmaNativeJSON, 
  figmaNativeToGraph,
  getFigmaNativeStats 
} from './adapters/figmaNativeImporter';

// Listen for messages from the UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'ready') {
    console.log('UI is ready');
  }
  
  // Handle request to get variable graph (collections, groups, variables, modes)
  if (msg.type === 'get-variable-graph') {
    try {
      // Step 1: Fetching collections
      figma.ui.postMessage({
        type: 'loading-progress',
        data: { step: 1, total: 4, message: 'Fetching variable collections...' }
      });
      console.log('Fetching variable collections...');
      
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      console.log(`Found ${collections.length} collection(s)`);
      
      // Step 2: Collections fetched, fetching variables
      figma.ui.postMessage({
        type: 'loading-progress',
        data: { step: 2, total: 4, message: `Found ${collections.length} collection${collections.length !== 1 ? 's' : ''}. Fetching variables...` }
      });
      
      const variables = await figma.variables.getLocalVariablesAsync();
      console.log(`Found ${variables.length} variable(s)`);
      
      // Step 3: Variables fetched, building graph
      figma.ui.postMessage({
        type: 'loading-progress',
        data: { step: 3, total: 4, message: `Processing ${variables.length} variable${variables.length !== 1 ? 's' : ''}...` }
      });
      
      const graph = figmaToGraph(collections, variables);
      console.log('Built internal graph model');
      
      // Step 4: Serializing
      figma.ui.postMessage({
        type: 'loading-progress',
        data: { step: 4, total: 4, message: 'Building tree structure...' }
      });
      
      const serializedGraph = serializeGraph(graph);
      console.log('Serialized graph:', {
        collections: serializedGraph.collections.length,
        groups: serializedGraph.groups.length,
        variables: serializedGraph.variables.length,
        aliases: serializedGraph.aliases.length,
      });
      
      // Final: Send graph data to UI
      figma.ui.postMessage({
        type: 'variable-graph-loaded',
        data: serializedGraph,
      });
      
    } catch (error) {
      console.error('Error building variable graph:', error);
      // Send error message to UI
      figma.ui.postMessage({
        type: 'variable-graph-error',
        data: { 
          message: error instanceof Error ? error.message : 'Failed to load variable graph'
        }
      });
    }
  }
  
  // Handle circular dependency check
  if (msg.type === 'check-circular-dependency') {
    try {
      const { sourceVariableId, targetVariableId } = msg.data;
      
      // Build current graph state
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const graph = figmaToGraph(collections, variables);
      
      // Check for circular dependency
      const wouldCycle = wouldCreateCycle(graph, sourceVariableId, targetVariableId);
      
      figma.ui.postMessage({
        type: 'circular-dependency-result',
        data: { wouldCycle }
      });
    } catch (error) {
      console.error('Error checking circular dependency:', error);
      figma.ui.postMessage({
        type: 'circular-dependency-error',
        data: { message: error instanceof Error ? error.message : 'Failed to check circular dependency' }
      });
    }
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Gets the collection type for a variable by looking up its collection
   */
  function getCollectionTypeForVariable(
    variableId: string,
    collections: VariableCollection[]
  ): CollectionType | null {
    for (const collection of collections) {
      if (collection.variableIds.includes(variableId)) {
        return inferCollectionType(collection.name);
      }
    }
    return null;
  }
  
  /**
   * Gets appropriate default value for a variable type when removing an alias
   */
  function getDefaultValueForType(variableType: VariableResolvedDataType): VariableValue {
    switch (variableType) {
      case 'COLOR':
        // Return transparent black
        return { r: 0, g: 0, b: 0, a: 0 };
      case 'FLOAT':
        return 0;
      case 'STRING':
        return '';
      case 'BOOLEAN':
        return false;
      default:
        return 0;
    }
  }
  
  // Handle alias creation
  if (msg.type === 'create-alias') {
    try {
      const { sourceVariableId, sourceModeId, targetVariableId, targetModeId } = msg.data;
      
      console.log('Creating alias:', { sourceVariableId, sourceModeId, targetVariableId, targetModeId });
      
      // Get the source variable
      const sourceVariable = await figma.variables.getVariableByIdAsync(sourceVariableId);
      if (!sourceVariable) {
        throw new Error('Source variable not found');
      }
      
      // Get the target variable
      const targetVariable = await figma.variables.getVariableByIdAsync(targetVariableId);
      if (!targetVariable) {
        throw new Error('Target variable not found');
      }
      
      // Build current graph state and validate alias
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const graph = figmaToGraph(collections, variables);
      
      // Validate alias direction (prevent backwards aliases - e.g., primitive → semantic)
      const sourceCollectionType = getCollectionTypeForVariable(sourceVariableId, collections);
      const targetCollectionType = getCollectionTypeForVariable(targetVariableId, collections);

      if (sourceCollectionType && targetCollectionType) {
        const directionValidation = validateAliasDirection(sourceCollectionType, targetCollectionType);
        if (!directionValidation.valid) {
          throw new Error(directionValidation.error || 'Invalid alias direction: Cannot alias in this direction');
        }
      }

      // Check for circular dependency
      const wouldCycle = wouldCreateCycle(graph, sourceVariableId, targetVariableId);
      if (wouldCycle) {
        throw new Error('Cannot create alias: This would create a circular dependency');
      }
      
      // Create the alias using Figma API
      const aliasValue = figma.variables.createVariableAlias(targetVariable);
      sourceVariable.setValueForMode(sourceModeId, aliasValue);
      
      console.log('Alias created successfully');
      
      // Refresh graph data by fetching and sending updated data
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'alias-created',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error creating alias:', error);
      figma.ui.postMessage({
        type: 'alias-creation-error',
        data: { message: error instanceof Error ? error.message : 'Failed to create alias' }
      });
    }
  }
  
  // Handle alias deletion
  if (msg.type === 'delete-alias') {
    try {
      const { sourceVariableId, sourceModeId, targetVariableId, targetModeId,
              sourceVariableName, sourceModeName, sourceGroupName, sourceCollectionName,
              targetVariableName, targetModeName, targetGroupName, targetCollectionName } = msg.data;
      
      console.log('Deleting alias:', { sourceVariableId, sourceModeId, targetVariableId, targetModeId });
      
      // Get the source variable
      const sourceVariable = await figma.variables.getVariableByIdAsync(sourceVariableId);
      if (!sourceVariable) {
        throw new Error('Source variable not found');
      }
      
      // Verify current value is an alias
      const currentValue = sourceVariable.valuesByMode[sourceModeId];
      if (!currentValue || typeof currentValue !== 'object' || !('id' in currentValue)) {
        throw new Error('No alias exists at the specified mode');
      }
      
      // Determine appropriate default value based on variable type
      const defaultValue = getDefaultValueForType(sourceVariable.resolvedType);
      
      // Remove the alias by setting to default value
      sourceVariable.setValueForMode(sourceModeId, defaultValue);
      
      console.log('Alias deleted successfully');
      
      // Commit to undo history
      figma.commitUndo();
      
      // Refresh graph data
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(collections, variables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'alias-deleted',
        data: { 
          success: true, 
          graph: serializedGraph,
          aliasInfo: {
            sourceVariableName,
            sourceModeName,
            sourceGroupName,
            sourceCollectionName,
            targetVariableName,
            targetModeName,
            targetGroupName,
            targetCollectionName
          }
        }
      });
    } catch (error) {
      console.error('Error deleting alias:', error);
      figma.ui.postMessage({
        type: 'alias-deletion-error',
        data: { message: error instanceof Error ? error.message : 'Failed to delete alias' }
      });
    }
  }
  
  // Note: Figma doesn't expose undo/redo methods in the plugin API.
  // Undo/redo is handled natively by Figma when users press Ctrl/Cmd+Z.
  // Since we call figma.commitUndo() after alias deletion, Figma's native
  // undo/redo will work automatically. We just need to listen for document
  // changes and refresh the graph.
  
  // Handle rule evaluation (dry-run)
  if (msg.type === 'evaluate-rules') {
    try {
      const { rulesJSON } = msg.data;
      
      console.log('Evaluating rules (dry-run)...');
      
      // Load rules
      const loadResult = RuleEngine.loadRulesFromJSON(rulesJSON);
      if (!loadResult.success) {
        throw new Error(`Failed to load rules: ${loadResult.errors.join(', ')}`);
      }
      
      // Build current graph state
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const graph = figmaToGraph(collections, variables);
      
      // Create rule engine state
      const state = RuleEngine.createState();
      loadResult.rules.forEach((rule) => {
        RuleEngine.addRule(state, rule);
      });
      
      // Perform dry-run
      const result = RuleEngine.dryRun(graph, state);
      const formatted = RuleEngine.getFormattedResult(result);
      
      console.log('Dry-run completed:', formatted.summary);
      
      figma.ui.postMessage({
        type: 'rules-evaluated',
        data: formatted,
      });
    } catch (error) {
      console.error('Error evaluating rules:', error);
      figma.ui.postMessage({
        type: 'rules-evaluation-error',
        data: { message: error instanceof Error ? error.message : 'Failed to evaluate rules' },
      });
    }
  }
  
  // Handle rule application (apply mode)
  if (msg.type === 'apply-rules') {
    try {
      const { rulesJSON } = msg.data;
      
      console.log('Applying rules...');
      
      // Load rules
      const loadResult = RuleEngine.loadRulesFromJSON(rulesJSON);
      if (!loadResult.success) {
        throw new Error(`Failed to load rules: ${loadResult.errors.join(', ')}`);
      }
      
      // Build current graph state
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const graph = figmaToGraph(collections, variables);
      
      // Create rule engine state
      const state = RuleEngine.createState();
      loadResult.rules.forEach((rule) => {
        RuleEngine.addRule(state, rule);
      });
      
      // Apply rules and get operations
      const applyResult = RuleEngine.apply(graph, state);
      
      if (!applyResult.success) {
        throw new Error('Rule evaluation failed');
      }
      
      console.log(`Executing ${applyResult.operations.length} alias operations...`);
      console.log('[FigZig] All operations have been validated for circular dependencies and backwards aliases');
      
      // Execute each alias operation
      // Note: Operations have already been validated by the rule engine to ensure:
      // 1. No circular dependencies
      // 2. No backwards aliases (primitives are never aliased)
      // 3. Valid mode mappings
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const operation of applyResult.operations) {
        try {
          const sourceVariable = await figma.variables.getVariableByIdAsync(
            operation.sourceVariableId
          );
          const targetVariable = await figma.variables.getVariableByIdAsync(
            operation.targetVariableId
          );
          
          if (!sourceVariable || !targetVariable) {
            throw new Error('Variable not found');
          }
          
          // Create alias
          const aliasValue = figma.variables.createVariableAlias(targetVariable);
          sourceVariable.setValueForMode(operation.sourceModeId, aliasValue);
          
          successCount++;
          console.log(
            `Created alias: ${operation.sourceVariableName}.${operation.sourceModeName} → ${operation.targetVariableName}.${operation.targetModeName}`
          );
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to create alias for ${operation.sourceVariableName}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      console.log(`Apply completed: ${successCount} succeeded, ${errorCount} failed`);
      
      // Refresh graph after applying
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      const formatted = RuleEngine.getFormattedResult(applyResult.evaluationResult);
      
      figma.ui.postMessage({
        type: 'rules-applied',
        data: {
          success: errorCount === 0,
          formatted,
          successCount,
          errorCount,
          errors,
          graph: serializedGraph,
        },
      });
    } catch (error) {
      console.error('Error applying rules:', error);
      figma.ui.postMessage({
        type: 'rules-application-error',
        data: { message: error instanceof Error ? error.message : 'Failed to apply rules' },
      });
    }
  }
  
  // Handle graph export to JSON
  if (msg.type === 'export-graph') {
    try {
      console.log('Exporting variable graph to JSON...');
      
      // Build current graph state
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const variables = await figma.variables.getLocalVariablesAsync();
      const graph = figmaToGraph(collections, variables);
      
      // Export to JSON with metadata
      const jsonExport = exportGraphToJSON(graph, {
        prettyPrint: true,
        indent: 2,
        // Optional: Include Figma file metadata if available
        // figmaFileId: figma.fileKey, // Not available in plugin API
      });
      
      console.log('Graph exported successfully');
      
      figma.ui.postMessage({
        type: 'graph-exported',
        data: { json: jsonExport },
      });
    } catch (error) {
      console.error('Error exporting graph:', error);
      figma.ui.postMessage({
        type: 'graph-export-error',
        data: { message: error instanceof Error ? error.message : 'Failed to export graph' },
      });
    }
  }
  
  // Handle graph import from JSON
  if (msg.type === 'import-graph') {
    try {
      const { jsonString } = msg.data;
      
      console.log('Importing variable graph from JSON...');
      
      // Detect format
      const format = detectImportFormat(jsonString);
      console.log(`Detected import format: ${format}`);
      
      figma.ui.postMessage({
        type: 'import-progress',
        data: { step: 1, total: 5, message: `Detected ${format === 'figma-native' ? 'Figma native' : format === 'figzig' ? 'FigZig' : 'unknown'} format` }
      });
      
      if (format === 'unknown') {
        throw new Error('Unrecognized JSON format. Expected FigZig export or Figma native export.');
      }
      
      // Parse based on format
      let internalGraph;
      let stats;
      
      if (format === 'figma-native') {
        // Parse Figma native format
        const parseResult = parseFigmaNativeJSON(jsonString);
        
        if (!parseResult.valid || !parseResult.data) {
          throw new Error(`Invalid Figma native JSON: ${parseResult.errors.join(', ')}`);
        }
        
        if (parseResult.warnings.length > 0) {
          console.warn('Parse warnings:', parseResult.warnings);
        }
        
        figma.ui.postMessage({
          type: 'import-progress',
          data: { step: 2, total: 5, message: 'Converting to internal format...' }
        });
        
        // Get stats for reporting
        stats = getFigmaNativeStats(parseResult.data);
        console.log('Import stats:', stats);
        
        // Convert to internal graph format
        internalGraph = figmaNativeToGraph(parseResult.data);
        
      } else {
        // Parse FigZig format
        const parseResult = parseImportJSON(jsonString);
        
        if (!parseResult.valid || !parseResult.data) {
          throw new Error(`Invalid FigZig JSON: ${parseResult.errors.join(', ')}`);
        }
        
        // Check schema version compatibility
        const versionCheck = isCompatibleVersion(parseResult.data.schemaVersion);
        if (!versionCheck.compatible) {
          throw new Error(versionCheck.message || 'Incompatible schema version');
        }
        
        if (versionCheck.message) {
          console.warn(versionCheck.message);
        }
        
        figma.ui.postMessage({
          type: 'import-progress',
          data: { step: 2, total: 5, message: 'Loading FigZig data...' }
        });
        
        // FigZig format already has internal graph structure
        internalGraph = {
          collections: new Map(parseResult.data.graph.collections.map(c => [c.id, c])),
          groups: new Map(parseResult.data.graph.groups.map(g => [g.id, g])),
          variables: new Map(parseResult.data.graph.variables.map(v => [v.id, v])),
          aliases: parseResult.data.graph.aliases,
        };
      }
      
      // Initialize result
      const result: ImportResult = {
        success: false,
        errors: [],
        warnings: [],
        stats: {
          collectionsCreated: 0,
          groupsCreated: 0,
          variablesCreated: 0,
          aliasesCreated: 0,
          skipped: 0,
        },
      };
      
      figma.ui.postMessage({
        type: 'import-progress',
        data: { step: 3, total: 5, message: 'Creating collections and variables...' }
      });
      
      // Get existing collections to avoid duplicates
      const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const existingCollectionsByName = new Map(
        existingCollections.map((c) => [c.name, c])
      );
      
      // Map to store created/existing Figma entities by their import IDs
      const collectionMap = new Map<string, VariableCollection>();
      const variableMap = new Map<string, Variable>();
      
      // Step 1: Create collections
      const collections = Array.from(internalGraph.collections.values());
      console.log(`Creating ${collections.length} collections...`);
      
      for (const col of collections) {
        // Check if collection already exists
        const existing = existingCollectionsByName.get(col.name);
        
        if (existing) {
          console.log(`Collection "${col.name}" already exists, using existing`);
          collectionMap.set(col.id, existing);
          result.warnings.push(`Collection "${col.name}" already exists, using existing`);
        } else {
          // Create new collection
          const newCollection = figma.variables.createVariableCollection(col.name);
          collectionMap.set(col.id, newCollection);
          result.stats.collectionsCreated++;
          console.log(`Created collection: ${col.name}`);
        }
      }
      
      // Step 2: Create variables (grouped by collection)
      const variables = Array.from(internalGraph.variables.values());
      console.log(`Creating ${variables.length} variables...`);
      
      for (const variable of variables) {
        try {
          // Find the group for this variable
          const group = internalGraph.groups.get(variable.groupId);
          if (!group) {
            result.errors.push(`Variable "${variable.name}": group not found`);
            continue;
          }
          
          // Find the collection for this group
          const figmaCollection = collectionMap.get(group.collectionId);
          if (!figmaCollection) {
            result.errors.push(`Variable "${variable.name}": collection not found`);
            continue;
          }
          
          // Construct full variable name with group path
          const fullName = group.name ? `${group.name}/${variable.name}` : variable.name;
          
          // Check if variable already exists in this collection
          const existingVariables = await figma.variables.getLocalVariablesAsync();
          const existingVar = existingVariables.find(
            (v) => v.name === fullName && v.variableCollectionId === figmaCollection.id
          );
          
          if (existingVar) {
            console.log(`Variable "${fullName}" already exists, skipping`);
            variableMap.set(variable.id, existingVar);
            result.stats.skipped++;
            continue;
          }
          
          // Determine variable type (default to COLOR if not specified)
          const varType = variable.variableType || 'COLOR';
          
          // Create the variable
          const newVariable = figma.variables.createVariable(
            fullName,
            figmaCollection,
            varType
          );
          
          variableMap.set(variable.id, newVariable);
          result.stats.variablesCreated++;
          
          // Set values for each mode (skip aliases for now, will process later)
          for (const mode of variable.modes) {
            if (mode.value.type === 'value') {
              // Get the mode ID from the collection
              const modeIds = figmaCollection.modes.map((m) => m.modeId);
              const modeIndex = variable.modes.findIndex((m) => m.id === mode.id);
              const figmaModeId = modeIds[Math.min(modeIndex, modeIds.length - 1)];
              
              // Set the value
              try {
                // Handle color values (convert hex to RGB if needed)
                let valueToSet = mode.value.value;
                if (varType === 'COLOR' && typeof valueToSet === 'string' && valueToSet.startsWith('#')) {
                  // Convert hex to RGB object for Figma
                  const hex = valueToSet.replace('#', '');
                  const r = parseInt(hex.substring(0, 2), 16) / 255;
                  const g = parseInt(hex.substring(2, 4), 16) / 255;
                  const b = parseInt(hex.substring(4, 6), 16) / 255;
                  valueToSet = { r, g, b, a: 1 };
                }
                
                newVariable.setValueForMode(figmaModeId, valueToSet);
              } catch (error) {
                result.warnings.push(
                  `Failed to set value for "${fullName}".${mode.name}: ${
                    error instanceof Error ? error.message : 'Unknown error'
                  }`
                );
              }
            }
          }
          
          console.log(`Created variable: ${fullName}`);
        } catch (error) {
          result.errors.push(
            `Failed to create variable "${variable.name}": ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }
      
      figma.ui.postMessage({
        type: 'import-progress',
        data: { step: 4, total: 5, message: 'Creating aliases...' }
      });
      
      // Step 3: Create aliases
      console.log(`Creating ${internalGraph.aliases.length} aliases...`);
      
      for (const alias of internalGraph.aliases) {
        try {
          const sourceVar = variableMap.get(alias.sourceVariableId);
          const targetVar = variableMap.get(alias.targetVariableId);
          
          if (!sourceVar || !targetVar) {
            result.warnings.push(`Alias skipped: source or target variable not found`);
            continue;
          }
          
          // Find the source variable to get its collection
          const sourceVariable = internalGraph.variables.get(alias.sourceVariableId);
          if (!sourceVariable) {
            result.warnings.push(`Alias skipped: source variable data not found`);
            continue;
          }
          
          // Find the group for this variable
          const sourceGroup = internalGraph.groups.get(sourceVariable.groupId);
          if (!sourceGroup) {
            result.warnings.push(`Alias skipped: source variable group not found`);
            continue;
          }
          
          // Get the collection using the group's collectionId
          const sourceCollection = collectionMap.get(sourceGroup.collectionId);
          if (!sourceCollection) {
            result.warnings.push(`Alias skipped: source collection not found`);
            continue;
          }
          
          // Create alias for the source mode pointing to target
          const sourceModeIndex = sourceVariable.modes.findIndex(
            (m) => m.id === alias.sourceModeId
          );
          
          if (sourceModeIndex === -1) {
            result.warnings.push(`Alias skipped: source mode not found`);
            continue;
          }
          
          const figmaModeId =
            sourceCollection.modes[
              Math.min(sourceModeIndex, sourceCollection.modes.length - 1)
            ].modeId;
          
          // Create the alias
          const aliasValue = figma.variables.createVariableAlias(targetVar);
          sourceVar.setValueForMode(figmaModeId, aliasValue);
          
          result.stats.aliasesCreated++;
          
          console.log(`Created alias: ${sourceVar.name} → ${targetVar.name}`);
        } catch (error) {
          result.errors.push(
            `Failed to create alias: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
      
      // Mark as success if we created at least something
      result.success = result.stats.variablesCreated > 0 || result.stats.collectionsCreated > 0;
      
      console.log('Import completed:', result);
      
      figma.ui.postMessage({
        type: 'import-progress',
        data: { step: 5, total: 5, message: 'Refreshing graph...' }
      });
      
      // Refresh graph after import
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'graph-imported',
        data: { result, graph: serializedGraph, format },
      });
    } catch (error) {
      console.error('Error importing graph:', error);
      figma.ui.postMessage({
        type: 'graph-import-error',
        data: { message: error instanceof Error ? error.message : 'Failed to import graph' },
      });
    }
  }
  
  // Handle collection creation
  if (msg.type === 'create-collection') {
    try {
      const { name, type } = msg.data;
      
      console.log(`Creating collection: ${name} (type: ${type})`);
      
      // Check for duplicate names
      const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const duplicate = existingCollections.find(c => c.name === name);
      
      if (duplicate) {
        throw new Error(`Collection "${name}" already exists`);
      }
      
      // Create the collection
      const newCollection = figma.variables.createVariableCollection(name);
      console.log(`Collection created: ${newCollection.id}`);
      
      // Refresh graph after creation
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'collection-created',
        data: { success: true, collectionId: newCollection.id, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error creating collection:', error);
      figma.ui.postMessage({
        type: 'collection-creation-error',
        data: { message: error instanceof Error ? error.message : 'Failed to create collection' }
      });
    }
  }
  
  // Handle mode creation
  if (msg.type === 'create-mode') {
    try {
      const { collectionId, modeName } = msg.data;
      
      console.log(`Creating mode: ${modeName} in collection ${collectionId}`);
      
      // Get the collection
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Check for duplicate mode names
      const duplicate = collection.modes.find(m => m.name === modeName);
      if (duplicate) {
        throw new Error(`Mode "${modeName}" already exists in this collection`);
      }
      
      // Add the mode
      const newModeId = collection.addMode(modeName);
      console.log(`Mode created: ${newModeId}`);
      
      // Refresh graph after creation
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'mode-created',
        data: { success: true, modeId: newModeId, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error creating mode:', error);
      figma.ui.postMessage({
        type: 'mode-creation-error',
        data: { message: error instanceof Error ? error.message : 'Failed to create mode' }
      });
    }
  }
  
  // Handle variable creation
  if (msg.type === 'create-variable') {
    try {
      const { name, collectionId, groupName, variableType, initialValues } = msg.data;
      
      console.log(`Creating variable: ${name} in collection ${collectionId}`);
      
      // Get the collection
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Construct full variable name with group path if provided
      const fullName = groupName ? `${groupName}/${name}` : name;
      
      // Check for duplicate variable names in this collection
      const existingVariables = await figma.variables.getLocalVariablesAsync();
      const duplicate = existingVariables.find(
        v => v.name === fullName && v.variableCollectionId === collectionId
      );
      
      if (duplicate) {
        throw new Error(`Variable "${fullName}" already exists in this collection`);
      }
      
      // Create the variable
      const newVariable = figma.variables.createVariable(
        fullName,
        collection,
        variableType || 'COLOR'
      );
      console.log(`Variable created: ${newVariable.id}`);
      
      // Set initial values for each mode if provided
      if (initialValues) {
        for (const mode of collection.modes) {
          if (initialValues[mode.modeId] !== undefined) {
            try {
              newVariable.setValueForMode(mode.modeId, initialValues[mode.modeId]);
            } catch (error) {
              console.warn(`Failed to set initial value for mode ${mode.name}:`, error);
            }
          }
        }
      }
      
      // Refresh graph after creation
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'variable-created',
        data: { success: true, variableId: newVariable.id, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error creating variable:', error);
      figma.ui.postMessage({
        type: 'variable-creation-error',
        data: { message: error instanceof Error ? error.message : 'Failed to create variable' }
      });
    }
  }
  
  // Handle collection deletion
  if (msg.type === 'delete-collection') {
    try {
      const { collectionId } = msg.data;
      
      console.log(`Deleting collection: ${collectionId}`);
      
      // Get the collection
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Delete the collection
      collection.remove();
      console.log('Collection deleted successfully');
      
      // Refresh graph after deletion
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'collection-deleted',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error deleting collection:', error);
      figma.ui.postMessage({
        type: 'collection-deletion-error',
        data: { message: error instanceof Error ? error.message : 'Failed to delete collection' }
      });
    }
  }
  
  // Handle variable deletion
  if (msg.type === 'delete-variable') {
    try {
      const { variableId } = msg.data;
      
      console.log(`Deleting variable: ${variableId}`);
      
      // Get the variable
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      
      if (!variable) {
        throw new Error('Variable not found');
      }
      
      // Delete the variable
      variable.remove();
      console.log('Variable deleted successfully');
      
      // Refresh graph after deletion
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'variable-deleted',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error deleting variable:', error);
      figma.ui.postMessage({
        type: 'variable-deletion-error',
        data: { message: error instanceof Error ? error.message : 'Failed to delete variable' }
      });
    }
  }
  
  // Handle mode deletion
  if (msg.type === 'delete-mode') {
    try {
      const { collectionId, modeId } = msg.data;
      
      console.log(`Deleting mode: ${modeId} from collection ${collectionId}`);
      
      // Get the collection
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Check that we're not deleting the last mode
      if (collection.modes.length <= 1) {
        throw new Error('Cannot delete the last mode in a collection');
      }
      
      // Delete the mode
      collection.removeMode(modeId);
      console.log('Mode deleted successfully');
      
      // Refresh graph after deletion
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'mode-deleted',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error deleting mode:', error);
      figma.ui.postMessage({
        type: 'mode-deletion-error',
        data: { message: error instanceof Error ? error.message : 'Failed to delete mode' }
      });
    }
  }
  
  // Handle collection rename
  if (msg.type === 'rename-collection') {
    try {
      const { collectionId, newName } = msg.data;
      
      console.log(`Renaming collection: ${collectionId} to ${newName}`);
      
      // Get the collection
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Check for duplicate names
      const duplicate = collections.find(c => c.id !== collectionId && c.name === newName);
      if (duplicate) {
        throw new Error(`Collection "${newName}" already exists`);
      }
      
      // Rename the collection
      collection.name = newName;
      console.log('Collection renamed successfully');
      
      // Refresh graph after rename
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'collection-renamed',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error renaming collection:', error);
      figma.ui.postMessage({
        type: 'collection-rename-error',
        data: { message: error instanceof Error ? error.message : 'Failed to rename collection' }
      });
    }
  }
  
  // Handle variable rename
  if (msg.type === 'rename-variable') {
    try {
      const { variableId, newName } = msg.data;
      
      console.log(`Renaming variable: ${variableId} to ${newName}`);
      
      // Get the variable
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      
      if (!variable) {
        throw new Error('Variable not found');
      }
      
      // Check for duplicate names in the same collection
      const existingVariables = await figma.variables.getLocalVariablesAsync();
      const duplicate = existingVariables.find(
        v => v.id !== variableId && 
             v.name === newName && 
             v.variableCollectionId === variable.variableCollectionId
      );
      
      if (duplicate) {
        throw new Error(`Variable "${newName}" already exists in this collection`);
      }
      
      // Rename the variable
      variable.name = newName;
      console.log('Variable renamed successfully');
      
      // Refresh graph after rename
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'variable-renamed',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error renaming variable:', error);
      figma.ui.postMessage({
        type: 'variable-rename-error',
        data: { message: error instanceof Error ? error.message : 'Failed to rename variable' }
      });
    }
  }
  
  // Handle mode rename
  if (msg.type === 'rename-mode') {
    try {
      const { collectionId, modeId, newName } = msg.data;
      
      console.log(`Renaming mode: ${modeId} to ${newName}`);
      
      // Get the collection
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        throw new Error('Collection not found');
      }
      
      // Find the mode
      const mode = collection.modes.find(m => m.modeId === modeId);
      if (!mode) {
        throw new Error('Mode not found');
      }
      
      // Check for duplicate mode names
      const duplicate = collection.modes.find(m => m.modeId !== modeId && m.name === newName);
      if (duplicate) {
        throw new Error(`Mode "${newName}" already exists in this collection`);
      }
      
      // Rename the mode
      collection.renameMode(modeId, newName);
      console.log('Mode renamed successfully');
      
      // Refresh graph after rename
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'mode-renamed',
        data: { success: true, graph: serializedGraph }
      });
    } catch (error) {
      console.error('Error renaming mode:', error);
      figma.ui.postMessage({
        type: 'mode-rename-error',
        data: { message: error instanceof Error ? error.message : 'Failed to rename mode' }
      });
    }
  }
  
  // Handle brand sync with aliasing
  if (msg.type === 'sync-brand-with-aliases') {
    try {
      const { brand, variables } = msg.data;
      console.log(`Syncing brand "${brand.name}" with ${variables.length} aliased variables...`);
      
      // Helper: Find or create collection
      async function getOrCreateCollection(name: string): Promise<VariableCollection> {
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        let collection = collections.find(c => c.name === name);
        
        if (!collection) {
          console.log(`Creating collection: ${name}`);
          collection = figma.variables.createVariableCollection(name);
        }
        
        return collection;
      }
      
      // Helper: Find or create mode in collection
      async function getOrCreateMode(collection: VariableCollection, modeName: string): Promise<{modeId: string; mode: any}> {
        let mode = collection.modes.find(m => m.name === modeName);
        
        if (!mode) {
          console.log(`Creating mode: ${modeName} in collection ${collection.name}`);
          const modeId = collection.addMode(modeName);
          mode = collection.modes.find(m => m.modeId === modeId);
        }
        
        return { modeId: mode!.modeId, mode: mode! };
      }
      
      // Helper: Find variable by name in collection
      async function findVariableInCollection(collection: VariableCollection, varName: string): Promise<Variable | null> {
        const allVars = await figma.variables.getLocalVariablesAsync();
        return allVars.find(v => v.name === varName && v.variableCollectionId === collection.id) || null;
      }
      
      // Helper: Create RGB color from hex
      function hexToRGB(hex: string): RGB {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
      }
      
      // Step 1: Create/Get RangDe Primitives collection
      console.log('Step 1: Creating/Getting RangDe Primitives collection...');
      const rangdeCollection = await getOrCreateCollection('00_RangDe Primitives');
      
      // Step 2: Create primitive variables and build mapping
      console.log('Step 2: Creating primitive variables...');
      const paletteVariableMap = new Map<string, string>();
      const uniquePrimitives = new Map<string, any>();
      
      // Collect unique primitives needed
      for (const variable of variables) {
        if (variable.aliasTo) {
          const key = `${variable.aliasTo.paletteId}_${variable.aliasTo.step}_${variable.aliasTo.scale}`;
          if (!uniquePrimitives.has(key)) {
            uniquePrimitives.set(key, variable.aliasTo);
          }
        }
      }
      
      console.log(`Found ${uniquePrimitives.size} unique primitives to create...`);
      
      // Create each primitive variable
      for (const [key, aliasInfo] of uniquePrimitives.entries()) {
        const primitiveName = `${aliasInfo.paletteName}/${aliasInfo.step}/${aliasInfo.scale}`;
        
        // Check if variable already exists
        let primitiveVar = await findVariableInCollection(rangdeCollection, primitiveName);
        
        if (!primitiveVar) {
          console.log(`Creating primitive variable: ${primitiveName}`);
          primitiveVar = figma.variables.createVariable(primitiveName, rangdeCollection, 'COLOR');
          
          // Find the corresponding generated variable to get the hex color
          const sourceVar = variables.find(v => v.aliasTo && 
            v.aliasTo.paletteId === aliasInfo.paletteId &&
            v.aliasTo.step === aliasInfo.step &&
            v.aliasTo.scale === aliasInfo.scale);
          
          if (sourceVar && sourceVar.value) {
            const rgb = hexToRGB(sourceVar.value);
            primitiveVar.setValueForMode(rangdeCollection.defaultModeId, rgb);
          }
        }
        
        paletteVariableMap.set(key, primitiveVar.id);
      }
      
      // Step 3: Create/Get brand collection and mode
      console.log('Step 3: Creating/Getting brand collection and mode...');
      const brandCollection = await getOrCreateCollection('9 Theme');
      const { modeId: brandModeId } = await getOrCreateMode(brandCollection, brand.name);
      
      // Step 4: Create brand variables with aliases
      console.log('Step 4: Creating brand variables with aliases...');
      let createdCount = 0;
      let updatedCount = 0;
      
      for (const variable of variables) {
        if (!variable.aliasTo) continue;
        
        const key = `${variable.aliasTo.paletteId}_${variable.aliasTo.step}_${variable.aliasTo.scale}`;
        const primitiveVarId = paletteVariableMap.get(key);
        
        if (!primitiveVarId) {
          console.warn(`No primitive variable found for ${variable.name}`);
          continue;
        }
        
        // Check if brand variable exists
        let brandVar = await findVariableInCollection(brandCollection, variable.name);
        
        if (!brandVar) {
          console.log(`Creating brand variable: ${variable.name}`);
          brandVar = figma.variables.createVariable(variable.name, brandCollection, 'COLOR');
          createdCount++;
        } else {
          updatedCount++;
        }
        
        // Set as alias
        brandVar.setValueForMode(brandModeId, {
          type: 'VARIABLE_ALIAS',
          id: primitiveVarId
        });
      }
      
      console.log(`Brand sync complete: ${createdCount} created, ${updatedCount} updated`);
      
      // Refresh graph
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'brand-sync-success',
        data: {
          success: true,
          brandId: brand.id,
          timestamp: Date.now(),
          variablesSynced: createdCount + updatedCount,
          modesAdded: [brand.name],
          errors: [],
          warnings: [],
          graph: serializedGraph
        }
      });
      
    } catch (error) {
      console.error('Error syncing brand:', error);
      figma.ui.postMessage({
        type: 'brand-sync-error',
        data: {
          success: false,
          errors: [error instanceof Error ? error.message : 'Failed to sync brand'],
          warnings: []
        }
      });
    }
  }
  
  // Handle multi-layer brand sync
  if (msg.type === 'sync-brand-with-layers') {
    try {
      const { brand, variablesByCollection } = msg.data;
      console.log(`Syncing brand "${brand.name}" with multi-layer architecture...`);
      console.log(`Collections to sync: ${Object.keys(variablesByCollection).length}`);
      
      // Helper: Create RGB color from hex
      function hexToRGB(hex: string): RGB {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
      }
      
      // Store created collection and variable references
      const collectionMap = new Map<string, VariableCollection>();
      const variableMap = new Map<string, Variable>();
      
      // Sort collections by layer order to ensure dependencies are created first
      const sortedCollections = Object.entries(variablesByCollection)
        .sort(([, varsA], [, varsB]) => {
          const layerA = (varsA as any)[0]?.layer || 0;
          const layerB = (varsB as any)[0]?.layer || 0;
          return layerA - layerB;
        });
      
      console.log('Processing collections in order:', sortedCollections.map(([name]) => name));
      
      // Phase 1: Create all collections
      for (const [collectionName, variables] of sortedCollections) {
        const collection = await getOrCreateCollection(collectionName);
        collectionMap.set(collectionName, collection);
        console.log(`Collection ready: ${collectionName}`);
      }
      
      // Phase 2: Create modes for each collection
      for (const [collectionName, variables] of sortedCollections) {
        const collection = collectionMap.get(collectionName)!;
        const modes = [...new Set((variables as any[]).map(v => v.mode))];
        
        for (const modeName of modes) {
          await getOrCreateMode(collection, modeName);
        }
        
        console.log(`Modes created for ${collectionName}: ${modes.join(', ')}`);
      }
      
      // Phase 3: Create variables layer by layer
      let totalCreated = 0;
      let totalUpdated = 0;
      
      for (const [collectionName, variables] of sortedCollections) {
        const collection = collectionMap.get(collectionName)!;
        console.log(`\nCreating variables for ${collectionName}...`);
        
        const varsArray = variables as any[];
        const isLayerZero = varsArray[0]?.layer === 0;
        
        for (const variable of varsArray) {
          const varName = variable.name;
          
          // Find or create variable
          let figmaVar = await findVariableInCollection(collection, varName);
          
          if (!figmaVar) {
            figmaVar = figma.variables.createVariable(varName, collection, 'COLOR');
            totalCreated++;
          } else {
            totalUpdated++;
          }
          
          // Store variable for later alias resolution
          const varKey = `${collectionName}:${varName}:${variable.mode}`;
          variableMap.set(varKey, figmaVar);
          
          // Find the mode ID
          const mode = collection.modes.find(m => m.name === variable.mode);
          if (!mode) {
            console.warn(`Mode not found: ${variable.mode} in ${collectionName}`);
            continue;
          }
          
          // Set value (RGB for Layer 0, ALIAS for others)
          if (isLayerZero && variable.value) {
            // Direct RGB value
            const rgb = hexToRGB(variable.value);
            figmaVar.setValueForMode(mode.modeId, rgb);
          } else if (variable.aliasTo) {
            // Alias to another variable
            // Try to find the target variable
            const targetName = variable.aliasTo.paletteName; // This contains the full variable name
            
            // Search for target variable in all collections
            let targetVar: Variable | undefined;
            for (const [targetCollName, targetColl] of collectionMap.entries()) {
              const found = await findVariableInCollection(targetColl, targetName);
              if (found) {
                targetVar = found;
                break;
              }
            }
            
            if (targetVar) {
              figmaVar.setValueForMode(mode.modeId, {
                type: 'VARIABLE_ALIAS',
                id: targetVar.id
              });
            } else {
              console.warn(`Alias target not found: ${targetName}`);
            }
          }
        }
        
        console.log(`  ✓ Created/updated ${varsArray.length} variables in ${collectionName}`);
      }
      
      console.log(`\nMulti-layer sync complete: ${totalCreated} created, ${totalUpdated} updated`);
      
      // Refresh graph
      const updatedCollections = await figma.variables.getLocalVariableCollectionsAsync();
      const updatedVariables = await figma.variables.getLocalVariablesAsync();
      const updatedGraph = figmaToGraph(updatedCollections, updatedVariables);
      const serializedGraph = serializeGraph(updatedGraph);
      
      figma.ui.postMessage({
        type: 'multi-layer-sync-success',
        data: {
          success: true,
          brandId: brand.id,
          timestamp: Date.now(),
          variablesSynced: totalCreated + totalUpdated,
          collectionsCreated: collectionMap.size,
          errors: [],
          warnings: [],
          graph: serializedGraph
        }
      });
      
    } catch (error) {
      console.error('Error syncing multi-layer brand:', error);
      figma.ui.postMessage({
        type: 'multi-layer-sync-error',
        data: {
          success: false,
          errors: [error instanceof Error ? error.message : 'Failed to sync multi-layer brand'],
          warnings: []
        }
      });
    }
  }
  
  // Handle layer config get request
  if (msg.type === 'get-layer-config') {
    try {
      console.log('Loading layer mapping config from Figma clientStorage...');
      const config = await figma.clientStorage.getAsync('layer-mapping-config');
      
      figma.ui.postMessage({
        type: 'layer-config-loaded',
        data: config || null
      });
      
      if (config) {
        console.log('Layer config loaded successfully');
      } else {
        console.log('No layer config found in storage');
      }
    } catch (error) {
      console.error('Error loading layer config:', error);
      figma.ui.postMessage({
        type: 'layer-config-error',
        data: { message: error instanceof Error ? error.message : 'Failed to load config' }
      });
    }
  }
  
  // Handle layer config save request
  if (msg.type === 'save-layer-config') {
    try {
      console.log('Saving layer mapping config to Figma clientStorage...');
      const config = msg.data;
      
      await figma.clientStorage.setAsync('layer-mapping-config', config);
      
      console.log('Layer config saved successfully');
      figma.ui.postMessage({
        type: 'layer-config-saved',
        data: { success: true, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Error saving layer config:', error);
      figma.ui.postMessage({
        type: 'layer-config-save-error',
        data: { 
          success: false,
          message: error instanceof Error ? error.message : 'Failed to save config' 
        }
      });
    }
  }
  
  // Handle brand storage get request
  if (msg.type === 'get-brands') {
    try {
      console.log('Loading brands from Figma clientStorage...');
      const brandsData = await figma.clientStorage.getAsync('varcar-brands');
      
      figma.ui.postMessage({
        type: 'brands-loaded',
        data: brandsData || null
      });
      
      if (brandsData) {
        console.log('Brands loaded successfully from Figma clientStorage');
      } else {
        console.log('No brands found in Figma storage');
      }
    } catch (error) {
      console.error('Error loading brands:', error);
      figma.ui.postMessage({
        type: 'brands-error',
        data: { message: error instanceof Error ? error.message : 'Failed to load brands' }
      });
    }
  }
  
  // Handle brand storage save request
  if (msg.type === 'save-brands') {
    try {
      console.log('Saving brands to Figma clientStorage...');
      
      // Validate data before saving
      if (!msg.data) {
        throw new Error('No brands data provided');
      }
      
      const brandsData = msg.data;
      
      // Validate structure
      if (!brandsData.brands || !Array.isArray(brandsData.brands)) {
        throw new Error('Invalid brands data structure: brands must be an array');
      }
      
      await figma.clientStorage.setAsync('varcar-brands', brandsData);
      
      console.log('Brands saved successfully to Figma clientStorage');
      figma.ui.postMessage({
        type: 'brands-saved',
        data: { success: true, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Error saving brands:', error);
      figma.ui.postMessage({
        type: 'brands-save-error',
        data: { 
          success: false,
          message: error instanceof Error ? error.message : 'Failed to save brands' 
        }
      });
    }
  }
  
  // Handle palette storage get request
  if (msg.type === 'get-palettes') {
    try {
      console.log('Loading palettes from Figma clientStorage...');
      const palettesData = await figma.clientStorage.getAsync('varcar-palettes');
      
      figma.ui.postMessage({
        type: 'palettes-loaded',
        data: palettesData || null
      });
      
      if (palettesData) {
        console.log('Palettes loaded successfully from Figma clientStorage');
      } else {
        console.log('No palettes found in Figma storage');
      }
    } catch (error) {
      console.error('Error loading palettes:', error);
      figma.ui.postMessage({
        type: 'palettes-error',
        data: { message: error instanceof Error ? error.message : 'Failed to load palettes' }
      });
    }
  }
  
  // Handle palette storage save request
  if (msg.type === 'save-palettes') {
    try {
      console.log('Saving palettes to Figma clientStorage...');
      
      // Validate data before saving
      if (!msg.data) {
        throw new Error('No palettes data provided');
      }
      
      const palettesData = msg.data;
      
      // Validate structure
      if (!palettesData.palettes || !Array.isArray(palettesData.palettes)) {
        throw new Error('Invalid palettes data structure: palettes must be an array');
      }
      
      await figma.clientStorage.setAsync('varcar-palettes', palettesData);
      
      console.log('Palettes saved successfully to Figma clientStorage');
      figma.ui.postMessage({
        type: 'palettes-saved',
        data: { success: true, timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Error saving palettes:', error);
      figma.ui.postMessage({
        type: 'palettes-save-error',
        data: { 
          success: false,
          message: error instanceof Error ? error.message : 'Failed to save palettes' 
        }
      });
    }
  }
  
  // Handle window resize
  if (msg.type === 'resize') {
    try {
      const { width, height } = msg;
      figma.ui.resize(width, height);
      
      // Save window size to client storage for persistence
      await figma.clientStorage.setAsync('windowSize', { width, height });
    } catch (error) {
      console.error('Error resizing window:', error);
    }
  }
  
  // Handle other message types here as needed
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

// Handle the menu command
if (figma.command === 'open') {
  // Load saved window size or use defaults
  (async () => {
    const savedSize = await figma.clientStorage.getAsync('windowSize');
    const width = savedSize?.width || 1200;
    const height = savedSize?.height || 800;
    
    // Show the UI with saved or default dimensions
    figma.showUI(__html__, {
      width,
      height,
      title: 'FigMap',
      themeColors: true
    });
  })();
  
  // Load all pages to enable documentchange monitoring across entire document
  // This is required when manifest has "documentAccess": "dynamic-page"
  (async () => {
    try {
      console.log('Loading all pages for document monitoring...');
      await figma.loadAllPagesAsync();
      console.log('All pages loaded successfully');
      
      // Set up real-time sync with debouncing
      let syncTimeout: ReturnType<typeof setTimeout> | null = null;
      let lastSyncHash: string = '';
      
      // Subscribe to document changes for real-time variable sync
      figma.on('documentchange', async (event) => {
        // Debounce: only sync after 500ms of no changes
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
        
        syncTimeout = setTimeout(async () => {
          try {
            console.log('Document change detected, checking for variable changes...');
            
            // Fetch current variables
            const collections = await figma.variables.getLocalVariableCollectionsAsync();
            const variables = await figma.variables.getLocalVariablesAsync();
            
            // Create a simple hash to detect actual changes
            const currentHash = JSON.stringify({
              collectionCount: collections.length,
              variableCount: variables.length,
              collectionIds: collections.map(c => c.id).sort(),
              variableIds: variables.map(v => v.id).sort(),
            });
            
            // Only sync if variables actually changed
            if (currentHash !== lastSyncHash) {
              console.log('Variable changes detected, syncing with UI...');
              lastSyncHash = currentHash;
              
              const graph = figmaToGraph(collections, variables);
              const serializedGraph = serializeGraph(graph);
              
              // Send update to UI
              figma.ui.postMessage({
                type: 'variables-updated',
                data: serializedGraph,
              });
              
              console.log('Variables synced successfully');
            }
          } catch (error) {
            console.error('Error syncing variables:', error);
            figma.ui.postMessage({
              type: 'sync-error',
              data: { message: 'Failed to sync variables' }
            });
          }
        }, 500); // 500ms debounce
      });
      
      console.log('Real-time variable sync enabled');
    } catch (error) {
      console.error('Error setting up document monitoring:', error);
      figma.ui.postMessage({
        type: 'sync-error',
        data: { message: 'Could not enable real-time sync' }
      });
    }
  })();
}
