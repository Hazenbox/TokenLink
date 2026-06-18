/**
 * Primitives Generator (Layer 0)
 * Generates base RGB color values from RangDe palettes
 */

import { BaseLayerGenerator } from './base-layer-generator';
import { VariableEntry } from '@/lib/variable-registry';
import { usePaletteStore } from '@/store/palette-store';
import { generateAllScales } from '@/lib/colors/scale-generator';
import { STEPS } from '@/lib/colors/color-utils';

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

const SCALE_KEY_MAP = {
  'Surface': 'surface',
  'High': 'high',
  'Medium': 'medium',
  'Low': 'low',
  'Heavy': 'heavy',
  'Bold': 'bold',
  'Bold A11Y': 'boldA11Y',
  'Minimal': 'minimal'
} as const;

/**
 * Convert hex color to RGB object with validation.
 * Returns null on invalid input so callers can skip the variable.
 */
function hexToRGB(hex: string): { r: number; g: number; b: number; a: number } | null {
  if (!hex || typeof hex !== 'string') {
    console.error('[primitives-generator hexToRGB] Invalid input:', hex);
    return null;
  }

  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    console.error('[primitives-generator hexToRGB] RGBA/RGB string passed, expected hex:', hex);
    return null;
  }

  if (!hex.startsWith('#') || hex.length !== 7) {
    console.error('[primitives-generator hexToRGB] Invalid hex format (expected #RRGGBB):', hex);
    return null;
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    console.error('[primitives-generator hexToRGB] Failed to parse hex:', hex);
    return null;
  }

  return { r, g, b, a: 1 };
}

export class PrimitivesGenerator extends BaseLayerGenerator {
  /**
   * Categorize a palette based on its role in the brand
   * Core: primary, secondary, sparkle, neutral
   * Functional: positive, negative, warning, informative
   */
  private categorizePalette(palette: any): 'core' | 'functional' {
    if (!this.brand.colors) return 'core';
    
    // Check if palette is assigned to functional/semantic roles
    if (this.brand.colors.semantic?.positive?.paletteId === palette.id) return 'functional';
    if (this.brand.colors.semantic?.negative?.paletteId === palette.id) return 'functional';
    if (this.brand.colors.semantic?.warning?.paletteId === palette.id) return 'functional';
    if (this.brand.colors.semantic?.informative?.paletteId === palette.id) return 'functional';
    
    // All other palettes (primary, secondary, sparkle, neutral) go to core
    return 'core';
  }
  
  generate(): VariableEntry[] {
    // Check if multi-brand mode
    if (this.allBrands && this.allBrands.length > 1) {
      return this.generateMultiBrand();
    } else {
      return this.generateSingleBrand();
    }
  }
  
  /**
   * Generate for single brand
   */
  private generateSingleBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    
    // Get assigned palettes from brand
    const assignedPalettes = this.getAssignedPalettes();
    if (assignedPalettes.length === 0) {
      this.warn('No palettes assigned to brand');
      return variables;
    }
    
    this.log(`Generating from ${assignedPalettes.length} assigned palettes: ${assignedPalettes.map(p => p.name).join(', ')}`);
    
    // Categorize palettes
    const corePalettes = assignedPalettes.filter(p => this.categorizePalette(p) === 'core');
    const functionalPalettes = assignedPalettes.filter(p => this.categorizePalette(p) === 'functional');
    
    this.log(`  Core: ${corePalettes.map(p => p.name).join(', ')}`);
    this.log(`  Functional: ${functionalPalettes.map(p => p.name).join(', ')}`);

    if (this.layer.id === 'primitives-core' && corePalettes.length > 0) {
      const coreVars = this.generateForCollection(
        corePalettes,
        'primitives-core',
        '00_Primitives_Core'
      );
      variables.push(...coreVars);
      this.log(`Generated ${coreVars.length} variables for Core collection`);
    } else if (this.layer.id === 'primitives-functional' && functionalPalettes.length > 0) {
      const functionalVars = this.generateForCollection(
        functionalPalettes,
        'primitives-functional',
        '00_Primitives_Functional'
      );
      variables.push(...functionalVars);
      this.log(`Generated ${functionalVars.length} variables for Functional collection`);
    }

    this.log(`Generated ${variables.length} total primitive variables`);
    return variables;
  }
  
  /**
   * Generate variables for a specific collection
   */
  private generateForCollection(
    palettes: any[],
    collectionId: string,
    collectionName: string
  ): VariableEntry[] {
    const variables: VariableEntry[] = [];
    
    for (const palette of palettes) {
      const allScales = generateAllScales(palette.steps, palette.primaryStep);
      
      // For each step
      for (const step of STEPS) {
        const stepScales = allScales[step];
        if (!stepScales) continue;
        
        // For each scale type
        for (const scale of SCALE_NAMES) {
          const scaleKey = SCALE_KEY_MAP[scale];
          const scaleResult = (stepScales as any)[scaleKey];
          if (!scaleResult || !scaleResult.hex) continue;
          
          // Create primitive variable
          const name = `${palette.name}/${step}/${scale}`;
          const rgb = hexToRGB(scaleResult.hex);
          if (!rgb) continue;
          variables.push({
            id: this.generateVariableId(),
            name,
            collectionId: collectionId,
            collectionName: collectionName,
            layer: this.layer.order,
            modeId: 'default',
            modeName: 'Mode 1',
            value: rgb,
            metadata: { step, scale }
          });
        }
      }
    }
    
    return variables;
  }
  
  /**
   * Generate for multiple brands (merge all unique palettes)
   */
  private generateMultiBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const brands = this.allBrands!;
    
    this.log(`Generating Primitives (multi-brand) for ${brands.length} brands`);
    
    // Collect ALL unique palettes from all brands with their categories
    const allPalettes = new Map<string, { palette: any; category: 'core' | 'functional' }>();
    const paletteStore = usePaletteStore.getState();
    
    brands.forEach(brand => {
      if (!brand.colors) return;
      
      // Collect core palette IDs
      const corePaletteRefs = [
        brand.colors.primary,
        brand.colors.secondary,
        brand.colors.sparkle,
        brand.colors.neutral
      ].filter(Boolean);
      
      corePaletteRefs.forEach(ref => {
        if (ref?.paletteId && !allPalettes.has(ref.paletteId)) {
          const palette = paletteStore.palettes.find(p => p.id === ref.paletteId);
          if (palette) {
            allPalettes.set(ref.paletteId, { palette, category: 'core' });
          }
        }
      });
      
      // Collect functional palette IDs
      const functionalPaletteRefs = [
        brand.colors.semantic?.positive,
        brand.colors.semantic?.negative,
        brand.colors.semantic?.warning,
        brand.colors.semantic?.informative
      ].filter(Boolean);
      
      functionalPaletteRefs.forEach(ref => {
        if (ref?.paletteId && !allPalettes.has(ref.paletteId)) {
          const palette = paletteStore.palettes.find(p => p.id === ref.paletteId);
          if (palette) {
            allPalettes.set(ref.paletteId, { palette, category: 'functional' });
          }
        }
      });
    });
    
    // Separate by category
    const corePalettes: any[] = [];
    const functionalPalettes: any[] = [];
    
    allPalettes.forEach(({ palette, category }) => {
      if (category === 'core') {
        corePalettes.push(palette);
      } else {
        functionalPalettes.push(palette);
      }
    });
    
    this.log(`Collected ${allPalettes.size} unique palettes from ${brands.length} brands`);
    this.log(`  Core: ${corePalettes.map(p => p.name).join(', ')}`);
    this.log(`  Functional: ${functionalPalettes.map(p => p.name).join(', ')}`);

    if (this.layer.id === 'primitives-core' && corePalettes.length > 0) {
      const coreVars = this.generateForCollection(
        corePalettes,
        'primitives-core',
        '00_Primitives_Core'
      );
      variables.push(...coreVars);
      this.log(`Generated ${coreVars.length} variables for Core collection`);
    } else if (this.layer.id === 'primitives-functional' && functionalPalettes.length > 0) {
      const functionalVars = this.generateForCollection(
        functionalPalettes,
        'primitives-functional',
        '00_Primitives_Functional'
      );
      variables.push(...functionalVars);
      this.log(`Generated ${functionalVars.length} variables for Functional collection`);
    }

    this.log(`Generated ${variables.length} total primitive variables (merged from ${brands.length} brands)`);
    return variables;
  }
  
  /**
   * Get palettes that are assigned to the brand
   */
  private getAssignedPalettes() {
    const paletteStore = usePaletteStore.getState();
    const assigned: any[] = [];
    
    if (!this.brand.colors) return [];
    
    // Collect unique palette IDs
    const paletteIds = new Set<string>();
    
    if (this.brand.colors.primary?.paletteId) paletteIds.add(this.brand.colors.primary.paletteId);
    if (this.brand.colors.secondary?.paletteId) paletteIds.add(this.brand.colors.secondary.paletteId);
    if (this.brand.colors.sparkle?.paletteId) paletteIds.add(this.brand.colors.sparkle.paletteId);
    if (this.brand.colors.neutral?.paletteId) paletteIds.add(this.brand.colors.neutral.paletteId);
    
    if (this.brand.colors.semantic) {
      if (this.brand.colors.semantic.positive?.paletteId) paletteIds.add(this.brand.colors.semantic.positive.paletteId);
      if (this.brand.colors.semantic.negative?.paletteId) paletteIds.add(this.brand.colors.semantic.negative.paletteId);
      if (this.brand.colors.semantic.warning?.paletteId) paletteIds.add(this.brand.colors.semantic.warning.paletteId);
      if (this.brand.colors.semantic.informative?.paletteId) paletteIds.add(this.brand.colors.semantic.informative.paletteId);
    }
    
    // Find palette objects
    paletteIds.forEach(id => {
      const palette = paletteStore.palettes.find(p => p.id === id);
      if (palette) assigned.push(palette);
    });
    
    return assigned;
  }
}
