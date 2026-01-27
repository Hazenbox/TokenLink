/**
 * Brand to Figma Variables Adapter
 * Converts VarCar's Brand model to Figma's Variables architecture
 * Based on official Figma documentation and real-world structure analysis
 */

import {
  Brand,
  FigmaCollection,
  FigmaGroup,
  FigmaVariable,
  VariableValueByMode
} from '@/models/brand';
import { usePaletteStore } from '@/store/palette-store';
import { generateAllScales } from '@/lib/colors/scale-generator';
import { STEPS } from '@/lib/colors/color-utils';

/**
 * Scale types (emphasis levels) - part of variable names, NOT modes
 */
const SCALE_TYPES = [
  'Surface',
  'High',
  'Medium',
  'Low',
  'Heavy',
  'Bold',
  'Bold A11Y',
  'Minimal'
] as const;

/**
 * Adapter class for converting Brand data to Figma format
 */
export class BrandToFigmaAdapter {
  /**
   * Get all collections from brand (use brand's collections directly)
   * This replaces the old strategy-based generation
   */
  convertBrandToCollections(brand: Brand): FigmaCollection[] {
    // Return brand's collections directly
    if (brand.collections && brand.collections.length > 0) {
      return brand.collections;
    }
    
    // Fallback: if brand has no collections (shouldn't happen after migration)
    console.warn('[Adapter] Brand has no collections, returning empty array');
    return [];
  }
  
  /**
   * Generate variables for a PRIMITIVES collection
   * Creates: {Palette}/{Step}/{Scale} naming with slash-based hierarchy
   * 
   * Example output:
   *   Grey/2500/Surface → #ffffff
   *   Grey/2500/High → #eeeeee
   *   Indigo/2500/Surface → #f0f0ff
   */
  generatePrimitivesCollectionVariables(
    collection: FigmaCollection
  ): FigmaVariable[] {
    const variables: FigmaVariable[] = [];
    const modeId = collection.defaultModeId;
    
    if (!collection.paletteAssignments) {
      console.warn('[Adapter] Primitives collection has no palette assignments');
      return [];
    }
    
    // For each palette assignment
    Object.entries(collection.paletteAssignments).forEach(([groupName, paletteRef]) => {
      const paletteStore = usePaletteStore.getState();
      const palette = paletteStore.getPaletteById(paletteRef.paletteId);
      
      if (!palette) {
        console.warn(`[Adapter] Palette not found: ${paletteRef.paletteId}`);
        return;
      }
      
      // Generate scales for all steps
      const scales = generateAllScales(palette.steps);
      
      // For each step (100, 200, 300... 2500)
      STEPS.forEach(step => {
        // For each scale type (Surface, High, Medium, etc.)
        SCALE_TYPES.forEach(scaleType => {
          const scaleKey = scaleType.toLowerCase().replace(/\s+/g, '');
          const color = scales[step]?.[scaleKey];
          
          if (color) {
            const varId = `var_${collection.id}_${groupName}_${step}_${scaleType.replace(/\s+/g, '_')}`;
            
            const valuesByMode: VariableValueByMode = {
              [modeId]: {
                type: 'COLOR',
                value: color
              }
            };
            
            variables.push({
              id: varId,
              name: `${groupName}/${step}/${scaleType}`,  // Slash-based hierarchy!
              resolvedType: 'COLOR',
              variableCollectionId: collection.id,
              valuesByMode,
              resolvedValuesByMode: {
                [modeId]: color
              }
            });
          }
        });
      });
    });
    
    console.log(`[Adapter] Generated ${variables.length} primitive variables for collection ${collection.name}`);
    return variables;
  }
  
  /**
   * Generate variables for SEMANTIC/APPEARANCES collection
   * Creates: [semantic] {Scale} naming with ALIASES to primitives
   * 
   * Example output:
   *   [appearance] Surface
   *     → Neutral mode: ALIAS to Grey/2500/Surface
   *     → Primary mode: ALIAS to Indigo/2500/Surface
   *     → Secondary mode: ALIAS to Green/2500/Surface
   */
  generateSemanticCollectionVariables(
    semanticCollection: FigmaCollection,
    primitivesCollection: FigmaCollection,
    primitivesVariables: FigmaVariable[]
  ): FigmaVariable[] {
    const variables: FigmaVariable[] = [];
    
    // Create semantic variables for each scale type
    SCALE_TYPES.forEach(scaleType => {
      const varId = `var_${semanticCollection.id}_appearance_${scaleType.replace(/\s+/g, '_')}`;
      const valuesByMode: VariableValueByMode = {};
      const resolvedValuesByMode: { [modeId: string]: string } = {};
      
      // For each mode (Neutral, Primary, Secondary, etc.)
      semanticCollection.modes.forEach(mode => {
        // Map mode name to primitive group name
        // e.g., "Neutral" mode → "Neutral" group, "Primary" mode → "Primary" group
        const primitiveGroupName = mode.name;
        
        // Find the primitive variable to alias to
        // e.g., "Neutral/2500/Surface" (default to step 2500)
        const targetPrimitiveVar = primitivesVariables.find(v => 
          v.name === `${primitiveGroupName}/2500/${scaleType}`
        );
        
        if (targetPrimitiveVar) {
          // Create ALIAS
          valuesByMode[mode.modeId] = {
            type: 'ALIAS',
            aliasId: targetPrimitiveVar.id,
            aliasCollectionId: primitivesCollection.id
          };
          
          // Store resolved value
          resolvedValuesByMode[mode.modeId] = 
            targetPrimitiveVar.resolvedValuesByMode[primitivesCollection.defaultModeId] || '#000000';
        } else {
          console.warn(`[Adapter] Could not find primitive variable: ${primitiveGroupName}/2500/${scaleType}`);
          
          // Fallback to black
          valuesByMode[mode.modeId] = {
            type: 'COLOR',
            value: '#000000'
          };
          resolvedValuesByMode[mode.modeId] = '#000000';
        }
      });
      
      variables.push({
        id: varId,
        name: `[appearance] ${scaleType}`,  // Semantic naming
        resolvedType: 'COLOR',
        variableCollectionId: semanticCollection.id,
        valuesByMode,
        resolvedValuesByMode
      });
    });
    
    console.log(`[Adapter] Generated ${variables.length} semantic variables for collection ${semanticCollection.name}`);
    return variables;
  }
  
  /**
   * Extract groups from variables (slash-based parsing)
   * Groups are NOT a native Figma entity - they're derived from variable names
   * 
   * Example:
   *   "Grey/2500/Surface" → group: "Grey", step: "2500"
   *   "[appearance] Surface" → group: "[appearance]"
   */
  extractGroupsFromVariables(
    variables: FigmaVariable[],
    collectionId: string
  ): FigmaGroup[] {
    const groupMap = new Map<string, { 
      name: string; 
      count: number; 
      steps: Set<string> 
    }>();
    
    variables.forEach(variable => {
      // Parse: "Grey/2500/Surface" → group:"Grey", step:"2500", type:"Surface"
      const parts = variable.name.split('/');
      
      if (parts.length >= 1) {
        const groupName = parts[0];
        const step = parts.length >= 2 ? parts[1] : null;
        
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, {
            name: groupName,
            count: 0,
            steps: new Set()
          });
        }
        
        const group = groupMap.get(groupName)!;
        group.count++;
        
        // Add step if it's numeric (for primitives collections)
        if (step && !isNaN(parseInt(step))) {
          group.steps.add(step);
        }
      }
    });
    
    return Array.from(groupMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      collectionId,
      variableCount: data.count,
      steps: Array.from(data.steps).sort((a, b) => parseInt(b) - parseInt(a))  // Sort descending (2500, 2400, 2300...)
    }));
  }
  
  /**
   * Get all groups for a collection
   */
  getGroupsForCollection(
    collectionId: string,
    allVariables: Map<string, FigmaVariable[]>
  ): FigmaGroup[] {
    const variables = allVariables.get(collectionId) || [];
    return this.extractGroupsFromVariables(variables, collectionId);
  }
  
  /**
   * Get variables for a collection
   * Generates variables based on collection type
   */
  getVariablesForCollection(
    brand: Brand,
    collection: FigmaCollection,
    allVariablesCache: Map<string, FigmaVariable[]>
  ): FigmaVariable[] {
    // Check cache first
    const cached = allVariablesCache.get(collection.id);
    if (cached) {
      return cached;
    }
    
    let variables: FigmaVariable[] = [];
    
    if (collection.generationType === 'primitives') {
      variables = this.generatePrimitivesCollectionVariables(collection);
    } else if (collection.generationType === 'semantic') {
      // Need primitives collection to create aliases
      const primitivesCollection = brand.collections?.find(c => 
        c.id === collection.primitiveCollectionId || c.generationType === 'primitives'
      );
      
      if (primitivesCollection) {
        const primitivesVariables = this.getVariablesForCollection(
          brand,
          primitivesCollection,
          allVariablesCache
        );
        variables = this.generateSemanticCollectionVariables(
          collection,
          primitivesCollection,
          primitivesVariables
        );
      } else {
        console.warn('[Adapter] Semantic collection has no primitives collection to reference');
      }
    } else {
      console.warn(`[Adapter] Unknown collection type: ${collection.generationType}`);
    }
    
    // Cache the result
    allVariablesCache.set(collection.id, variables);
    
    return variables;
  }
  
  /**
   * Get all variables for a brand (across all collections)
   */
  getAllVariablesForBrand(brand: Brand): Map<string, FigmaVariable[]> {
    const allVariables = new Map<string, FigmaVariable[]>();
    
    if (!brand.collections) {
      return allVariables;
    }
    
    // Generate variables for each collection
    brand.collections.forEach(collection => {
      const variables = this.getVariablesForCollection(brand, collection, allVariables);
      allVariables.set(collection.id, variables);
    });
    
    return allVariables;
  }
  
  /**
   * Filter variables by group
   */
  filterVariablesByGroup(
    variables: FigmaVariable[],
    groupId: string | null
  ): FigmaVariable[] {
    if (!groupId || groupId === 'all') {
      return variables;
    }
    
    // Filter by group name (first part before /)
    return variables.filter(v => v.name.startsWith(`${groupId}/`));
  }
  
  /**
   * Filter variables by step
   */
  filterVariablesByStep(
    variables: FigmaVariable[],
    step: string | null
  ): FigmaVariable[] {
    if (!step || step === 'all') {
      return variables;
    }
    
    // Filter by step (second part in name)
    return variables.filter(v => {
      const parts = v.name.split('/');
      return parts.length >= 2 && parts[1] === step;
    });
  }
}

/**
 * Global singleton instance
 */
export const brandToFigmaAdapter = new BrandToFigmaAdapter();
