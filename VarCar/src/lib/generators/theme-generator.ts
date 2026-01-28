/**
 * Theme Generator (Layer 7)
 * Generates theme variations (MyJio, JioFinance, JioHome) that alias to Appearance
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

const CATEGORIES = ['Surfaces', 'Buttons', 'Text', 'Icons'] as const;

export class ThemeGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['MyJio', 'JioFinance', 'JioHome'];
    
    this.log(`Generating Theme variables with ${modes.length} themes`);
    
    // Get brand name
    const brandName = this.brand.name || 'Brand';
    
    for (const category of CATEGORIES) {
      for (const scale of SCALE_NAMES) {
        const name = `${brandName}/${category}/[Theme] ${scale}`;
        
        // Each theme mode aliases to the same Appearance variable
        // but potentially with different appearance contexts
        const appearanceName = `${brandName}/Default/[appearance] ${scale}`;
        
        modes.forEach((theme, idx) => {
          // Find Appearance variable (use Primary appearance for most themes)
          const appearanceVars = this.registry.findByCollection('appearance')
            .filter(v => v.name === appearanceName && v.modeName === 'Primary');
          
          if (appearanceVars.length === 0) {
            this.warn(`Appearance variable not found: ${appearanceName} (Primary)`);
            return;
          }
          
          const appearanceVar = appearanceVars[0];
          
          variables.push({
            id: this.generateVariableId(),
            name,
            collectionId: this.layer.id,
            collectionName: this.layer.collectionName,
            layer: this.layer.order,
            modeId: `mode_${idx}`,
            modeName: theme,
            aliasToId: appearanceVar.id,
            aliasToName: appearanceName,
            metadata: { scale, context: category }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} theme variables`);
    return variables;
  }
}
