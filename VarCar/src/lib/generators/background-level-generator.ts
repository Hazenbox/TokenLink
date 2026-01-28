/**
 * Background Level Generator (Layer 3)
 * Generates surface stacking levels that alias to Colour Mode
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

export class BackgroundLevelGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Level 0', 'Level 1', 'Level 2', 'Bold', 'Elevated'];
    
    this.log(`Generating Background Level variables with ${modes.length} modes`);
    
    for (const scale of SCALE_NAMES) {
      const name = `Grey/[Parent] ${scale}`;
      
      // Map each level mode to appropriate Colour Mode context
      const levelContextMap: Record<string, string> = {
        'Level 0': 'Root',
        'Level 1': 'Default',
        'Level 2': 'Default',
        'Bold': 'Root',
        'Elevated': 'Default'
      };
      
      modes.forEach((mode, idx) => {
        const context = levelContextMap[mode] || 'Root';
        const colourModeName = `Grey/Semi semantics/${context}/[Colour Mode] ${scale}`;
        
        // Find the Colour Mode variable (we need to check both Light and Dark modes)
        // For simplicity, we'll alias to Light mode (mode_0)
        const colourModeVar = this.registry.findByName(colourModeName, 'colour-mode');
        
        if (!colourModeVar) {
          this.warn(`Colour Mode variable not found: ${colourModeName}`);
          return;
        }
        
        variables.push({
          id: this.generateVariableId(),
          name,
          collectionId: this.layer.id,
          collectionName: this.layer.collectionName,
          layer: this.layer.order,
          modeId: `mode_${idx}`,
          modeName: mode,
          aliasToId: colourModeVar.id,
          aliasToName: colourModeName,
          metadata: { scale, level: mode }
        });
      });
    }
    
    this.log(`Generated ${variables.length} background level variables`);
    return variables;
  }
}
