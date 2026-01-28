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
    const paletteStore = usePaletteStore.getState();
    
    this.log(`Generating from ${paletteStore.palettes.length} palettes`);
    
    // For each palette in RangDe
    for (const palette of paletteStore.palettes) {
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
}
