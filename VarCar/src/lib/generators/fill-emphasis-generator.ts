/**
 * Fill Emphasis Generator (Layer 4)
 * Generates visual hierarchy levels that alias to Background Level
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

export class FillEmphasisGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Ghost', 'Minimal', 'Subtle', 'Bold'];
    
    this.log(`Generating Fill Emphasis variables with ${modes.length} modes`);
    
    for (const scale of SCALE_NAMES) {
      const name = `Grey/[Child] ${scale}`;
      
      // Map each emphasis mode to appropriate Background Level mode
      const emphasisLevelMap: Record<string, string> = {
        'Ghost': 'Level 0',
        'Minimal': 'Level 1',
        'Subtle': 'Level 2',
        'Bold': 'Bold'
      };
      
      modes.forEach((mode, idx) => {
        const levelMode = emphasisLevelMap[mode] || 'Level 0';
        const backgroundLevelName = `Grey/[Parent] ${scale}`;
        
        // Find the Background Level variable with the appropriate mode
        const backgroundLevelVars = this.registry.findByCollection('background-level')
          .filter(v => v.name === backgroundLevelName && v.modeName === levelMode);
        
        if (backgroundLevelVars.length === 0) {
          this.warn(`Background Level variable not found: ${backgroundLevelName} (${levelMode})`);
          return;
        }
        
        const backgroundLevelVar = backgroundLevelVars[0];
        
        variables.push({
          id: this.generateVariableId(),
          name,
          collectionId: this.layer.id,
          collectionName: this.layer.collectionName,
          layer: this.layer.order,
          modeId: `mode_${idx}`,
          modeName: mode,
          aliasToId: backgroundLevelVar.id,
          aliasToName: backgroundLevelName,
          metadata: { scale, emphasis: mode }
        });
      });
    }
    
    this.log(`Generated ${variables.length} fill emphasis variables`);
    return variables;
  }
}
