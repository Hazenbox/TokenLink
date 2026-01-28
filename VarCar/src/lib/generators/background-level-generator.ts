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
    
    const paletteNames = this.getAssignedPaletteNames();
    
    for (const paletteName of paletteNames) {
      for (const scale of SCALE_NAMES) {
        const name = `${paletteName}/[Parent] ${scale}`;
        
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
          const colourModeName = `${paletteName}/Semi semantics/${context}/[Colour Mode] ${scale}`;
          
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
            metadata: { scale, level: mode, palette: paletteName }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} background level variables`);
    return variables;
  }
  
  private getAssignedPaletteNames(): string[] {
    if (!this.brand.colors) return [];
    
    const names = new Set<string>();
    if (this.brand.colors.neutral?.paletteName) names.add(this.brand.colors.neutral.paletteName);
    if (this.brand.colors.primary?.paletteName) names.add(this.brand.colors.primary.paletteName);
    if (this.brand.colors.secondary?.paletteName) names.add(this.brand.colors.secondary.paletteName);
    if (this.brand.colors.sparkle?.paletteName) names.add(this.brand.colors.sparkle.paletteName);
    if (this.brand.colors.semantic?.positive?.paletteName) names.add(this.brand.colors.semantic.positive.paletteName);
    if (this.brand.colors.semantic?.negative?.paletteName) names.add(this.brand.colors.semantic.negative.paletteName);
    if (this.brand.colors.semantic?.warning?.paletteName) names.add(this.brand.colors.semantic.warning.paletteName);
    if (this.brand.colors.semantic?.informative?.paletteName) names.add(this.brand.colors.semantic.informative.paletteName);
    
    return Array.from(names);
  }
}
