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
 * Convert hex color to RGB object
 */
function hexToRGB(hex: string): { r: number; g: number; b: number; a: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b, a: 1 };
}

export class PrimitivesGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    
    // Get assigned palettes from brand
    const assignedPalettes = this.getAssignedPalettes();
    if (assignedPalettes.length === 0) {
      this.warn('No palettes assigned to brand');
      return variables;
    }
    
    this.log(`Generating from ${assignedPalettes.length} assigned palettes: ${assignedPalettes.map(p => p.name).join(', ')}`);
    
    // For each ASSIGNED palette only
    for (const palette of assignedPalettes) {
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
          
          variables.push({
            id: this.generateVariableId(),
            name,
            collectionId: this.layer.id,
            collectionName: this.layer.collectionName,
            layer: this.layer.order,
            modeId: 'default',
            modeName: 'Mode 1',
            value: rgb,
            metadata: { step, scale }
          });
        }
      }
    }
    
    this.log(`Generated ${variables.length} primitive variables`);
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
