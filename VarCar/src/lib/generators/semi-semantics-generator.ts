/**
 * Semi Semantics Generator (Layer 1)
 * Generates semantic color groupings that alias to primitives
 */

import { BaseLayerGenerator } from './base-layer-generator';
import { VariableEntry } from '@/lib/variable-registry';
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

export class SemiSemanticsGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    
    // Generate Grey scale variables (uses neutral palette)
    const neutralPalette = this.brand.colors?.neutral;
    if (!neutralPalette || !neutralPalette.paletteName) {
      this.warn('No neutral palette configured, skipping Grey scale generation');
      return variables;
    }
    
    this.log(`Generating Grey scale using palette: ${neutralPalette.paletteName}`);
    
    for (const step of STEPS) {
      for (const scale of SCALE_NAMES) {
        const name = `Grey/${step}/${scale}`;
        const primitiveName = `${neutralPalette.paletteName}/${step}/${scale}`;
        const primitiveVar = this.resolveAliasTarget(primitiveName, 'primitives');
        
        if (!primitiveVar) {
          this.warn(`Primitive not found: ${primitiveName}`);
          continue;
        }
        
        variables.push({
          id: this.generateVariableId(),
          name,
          collectionId: this.layer.id,
          collectionName: this.layer.collectionName,
          layer: this.layer.order,
          modeId: 'default',
          modeName: 'Mode 1',
          aliasToId: primitiveVar.id,
          aliasToName: primitiveName,
          metadata: { step, scale }
        });
      }
    }
    
    this.log(`Generated ${variables.length} semi-semantic variables`);
    return variables;
  }
}
