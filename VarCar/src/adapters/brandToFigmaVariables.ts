/**
 * Brand to Figma Variables Adapter
 * Converts VarCar's Brand model to Figma's Variables UI paradigm
 */

import {
  Brand,
  GeneratedVariable,
  FigmaCollection,
  FigmaMode,
  FigmaGroup,
  FigmaVariable,
  FigmaVariableValue
} from '@/models/brand';

/**
 * Scale names mapping to Figma modes
 */
const SCALE_NAMES = [
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
 * Appearance contexts for grouping
 */
const APPEARANCE_CONTEXTS = [
  'Neutral',
  'Primary',
  'Secondary',
  'Sparkle',
  'Positive',
  'Negative',
  'Warning',
  'Informative'
] as const;

/**
 * Strategy for collection organization
 */
type CollectionStrategy = 'single' | 'per-appearance';

/**
 * Adapter class for converting Brand data to Figma format
 */
export class BrandToFigmaAdapter {
  private strategy: CollectionStrategy = 'single';

  /**
   * Set collection strategy
   */
  setStrategy(strategy: CollectionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get current collection strategy
   */
  getCollectionStrategy(): CollectionStrategy {
    return this.strategy;
  }

  /**
   * Convert Brand to Figma Collections
   */
  convertBrandToCollections(brand: Brand): FigmaCollection[] {
    if (this.strategy === 'single') {
      // Single collection containing all variables
      return [{
        id: `col_${brand.id}`,
        name: brand.name,
        modes: this.generateModes(),
        defaultModeId: 'mode_surface',
        variableCount: 0 // Will be updated when variables are counted
      }];
    } else {
      // One collection per appearance context
      return APPEARANCE_CONTEXTS.map((appearance, idx) => ({
        id: `col_${brand.id}_${appearance.toLowerCase()}`,
        name: `${brand.name} - ${appearance}`,
        modes: this.generateModes(),
        defaultModeId: 'mode_surface',
        variableCount: 0
      }));
    }
  }

  /**
   * Generate standard modes for a collection
   */
  private generateModes(): FigmaMode[] {
    return SCALE_NAMES.map((name, idx) => ({
      id: `mode_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name
    }));
  }

  /**
   * Convert Brand to Figma Groups (organized by palette)
   */
  convertBrandToGroups(
    brand: Brand,
    variables: GeneratedVariable[],
    collectionId: string
  ): FigmaGroup[] {
    const groupMap = new Map<string, number>();

    // Count variables per palette
    variables.forEach((variable) => {
      const palette = variable.sourcePalette || 'Unknown';
      groupMap.set(palette, (groupMap.get(palette) || 0) + 1);
    });

    // Create groups sorted alphabetically
    const groups: FigmaGroup[] = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([paletteName, count]) => ({
        id: `grp_${paletteName.toLowerCase().replace(/\s+/g, '_')}`,
        name: paletteName,
        collectionId,
        variableCount: count / SCALE_NAMES.length // Divide by scales to get actual variable count
      }));

    return groups;
  }

  /**
   * Convert GeneratedVariable[] to FigmaVariable[]
   * Transforms from (palette, step, scale) model to (variable, mode) model
   */
  convertVariables(
    variables: GeneratedVariable[],
    brand: Brand,
    collectionId: string
  ): FigmaVariable[] {
    // Group variables by (appearance, palette, step) to create single FigmaVariable
    const variableMap = new Map<string, {
      appearance: string;
      palette: string;
      step: number;
      valuesByScale: Map<string, GeneratedVariable>;
    }>();

    // First pass: group by unique variable identity
    variables.forEach((variable) => {
      const appearance = this.extractAppearance(variable.name);
      const palette = variable.sourcePalette || 'Unknown';
      const step = variable.aliasTo?.step || 0;
      const scale = variable.sourceScale || 'Unknown';

      const key = `${appearance}_${palette}_${step}`;

      if (!variableMap.has(key)) {
        variableMap.set(key, {
          appearance,
          palette,
          step,
          valuesByScale: new Map()
        });
      }

      variableMap.get(key)!.valuesByScale.set(scale, variable);
    });

    // Second pass: convert to FigmaVariable[]
    const figmaVariables: FigmaVariable[] = [];

    variableMap.forEach(({ appearance, palette, step, valuesByScale }, key) => {
      const valuesByMode: Record<string, FigmaVariableValue> = {};
      const resolvedValuesByMode: Record<string, string> = {};

      // Map each scale to its corresponding mode
      SCALE_NAMES.forEach((scaleName) => {
        const modeId = `mode_${scaleName.toLowerCase().replace(/\s+/g, '_')}`;
        const variable = valuesByScale.get(scaleName);

        if (variable) {
          // Add mode value
          valuesByMode[modeId] = {
            type: 'COLOR',
            value: variable.value,
            aliasTo: variable.isAliased && variable.aliasTo ? {
              variableId: `var_${variable.aliasTo.paletteName}_${variable.aliasTo.step}`,
              modeId: `mode_${variable.aliasTo.scale.toLowerCase().replace(/\s+/g, '_')}`
            } : undefined
          };

          // Add resolved color
          resolvedValuesByMode[modeId] = variable.value || '#000000';
        } else {
          // No value for this mode
          valuesByMode[modeId] = {
            type: 'COLOR',
            value: '#000000'
          };
          resolvedValuesByMode[modeId] = '#000000';
        }
      });

      figmaVariables.push({
        id: `var_${palette}_${step}`,
        name: `[${appearance}] ${palette} ${step}`,
        groupId: `grp_${palette.toLowerCase().replace(/\s+/g, '_')}`,
        collectionId,
        valuesByMode,
        resolvedValuesByMode
      });
    });

    // Sort by palette, then step
    figmaVariables.sort((a, b) => {
      const paletteCompare = a.name.localeCompare(b.name);
      if (paletteCompare !== 0) return paletteCompare;

      const stepA = parseInt(a.id.split('_').pop() || '0');
      const stepB = parseInt(b.id.split('_').pop() || '0');
      return stepA - stepB;
    });

    return figmaVariables;
  }

  /**
   * Extract appearance context from variable name
   * Example: "MyJio/Primary/[primary] Bold" → "Primary"
   */
  private extractAppearance(variableName: string): string {
    const match = variableName.match(/\/([^\/]+)\/\[/);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback: check for appearance in brackets
    const bracketMatch = variableName.match(/\[([^\]]+)\]/);
    if (bracketMatch && bracketMatch[1]) {
      const appearance = bracketMatch[1];
      // Capitalize first letter
      return appearance.charAt(0).toUpperCase() + appearance.slice(1);
    }

    return 'Unknown';
  }

  /**
   * Get all unique palettes from variables
   */
  getUniquePalettes(variables: GeneratedVariable[]): string[] {
    const palettes = new Set<string>();
    variables.forEach((v) => {
      if (v.sourcePalette) {
        palettes.add(v.sourcePalette);
      }
    });
    return Array.from(palettes).sort();
  }

  /**
   * Filter variables by group (palette)
   */
  filterVariablesByGroup(
    variables: FigmaVariable[],
    groupId: string | null
  ): FigmaVariable[] {
    if (!groupId || groupId === 'all') {
      return variables;
    }
    return variables.filter((v) => v.groupId === groupId);
  }

  /**
   * Update collection variable counts
   */
  updateCollectionCounts(
    collections: FigmaCollection[],
    variables: FigmaVariable[]
  ): FigmaCollection[] {
    return collections.map((collection) => ({
      ...collection,
      variableCount: variables.filter((v) => v.collectionId === collection.id).length
    }));
  }

  /**
   * Get statistics for converted data
   */
  getConversionStats(
    collections: FigmaCollection[],
    groups: FigmaGroup[],
    variables: FigmaVariable[]
  ): {
    totalCollections: number;
    totalGroups: number;
    totalVariables: number;
    totalModes: number;
    variablesPerCollection: Record<string, number>;
    variablesPerGroup: Record<string, number>;
  } {
    const variablesPerCollection: Record<string, number> = {};
    const variablesPerGroup: Record<string, number> = {};

    collections.forEach((col) => {
      variablesPerCollection[col.name] = variables.filter(
        (v) => v.collectionId === col.id
      ).length;
    });

    groups.forEach((grp) => {
      variablesPerGroup[grp.name] = variables.filter(
        (v) => v.groupId === grp.id
      ).length;
    });

    return {
      totalCollections: collections.length,
      totalGroups: groups.length,
      totalVariables: variables.length,
      totalModes: collections[0]?.modes.length || 0,
      variablesPerCollection,
      variablesPerGroup
    };
  }
}

// Export singleton instance
export const brandToFigmaAdapter = new BrandToFigmaAdapter();
