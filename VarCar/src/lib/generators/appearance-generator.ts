/**
 * Appearance Generator (Layer 6)
 * Generates appearance contexts (Neutral, Primary, Secondary, etc.) that alias to Fill Emphasis
 */

import { BaseLayerGenerator } from './base-layer-generator';
import { VariableEntry } from '@/lib/variable-registry';

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

const APPEARANCE_CONTEXTS = [
  'Neutral',
  'Primary',
  'Secondary',
  'Sparkle',
  'Positive',
  'Negative',
  'Warning',
  'Informative',
  'Brand BG'
] as const;

export class AppearanceGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || Array.from(APPEARANCE_CONTEXTS);
    
    this.log(`Generating Appearance variables with ${modes.length} appearance contexts`);
    
    // Get brand name for variable naming
    const brandName = this.brand.name || 'Brand';
    
    for (const scale of SCALE_NAMES) {
      // Each appearance has its own set of modes
      const name = `${brandName}/Default/[appearance] ${scale}`;
      
      modes.forEach((appearance, idx) => {
        // Map appearance to fill emphasis mode
        // For simplicity, map most to 'Bold', but can be customized
        const emphasisMode = appearance === 'Neutral' ? 'Subtle' : 'Bold';
        const fillEmphasisName = `Grey/[Child] ${scale}`;
        
        // Find Fill Emphasis variable with appropriate mode
        const fillEmphasisVars = this.registry.findByCollection('fill-emphasis')
          .filter(v => v.name === fillEmphasisName && v.modeName === emphasisMode);
        
        if (fillEmphasisVars.length === 0) {
          this.warn(`Fill Emphasis variable not found: ${fillEmphasisName} (${emphasisMode})`);
          return;
        }
        
        const fillEmphasisVar = fillEmphasisVars[0];
        
        variables.push({
          id: this.generateVariableId(),
          name,
          collectionId: this.layer.id,
          collectionName: this.layer.collectionName,
          layer: this.layer.order,
          modeId: `mode_${idx}`,
          modeName: appearance,
          aliasToId: fillEmphasisVar.id,
          aliasToName: fillEmphasisName,
          metadata: { scale, appearance }
        });
      });
    }
    
    this.log(`Generated ${variables.length} appearance variables`);
    return variables;
  }
}
