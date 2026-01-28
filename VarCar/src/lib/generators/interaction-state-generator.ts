/**
 * Interaction State Generator (Layer 5)
 * Generates interactive states (Idle, Hover, Pressed, Focus) that alias to Colour Mode
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

const FILL_EMPHASIS_TYPES = ['Ghost', 'Minimal', 'Subtle', 'Bold'] as const;

export class InteractionStateGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Idle', 'Hover', 'Pressed', 'Focus'];
    
    this.log(`Generating Interaction State variables with ${modes.length} modes`);
    
    // Generate for each fill emphasis type
    for (const emphasisType of FILL_EMPHASIS_TYPES) {
      for (const scale of SCALE_NAMES) {
        const name = `Grey/Default/${emphasisType}/[Interaction state] ${scale}`;
        
        // All interaction states alias back to Colour Mode
        // Different states might use slightly different steps, but for simplicity
        // we'll alias to the same Colour Mode variable
        const colourModeName = `Grey/Semi semantics/Default/[Colour Mode] ${scale}`;
        
        modes.forEach((mode, idx) => {
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
            metadata: { scale, state: mode, context: emphasisType }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} interaction state variables`);
    return variables;
  }
}
