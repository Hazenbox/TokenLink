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
    
    const paletteNames = this.getAssignedPaletteNames();
    
    for (const paletteName of paletteNames) {
      for (const scale of SCALE_NAMES) {
        const name = `${paletteName}/[Child] ${scale}`;
        
        // Map each emphasis mode to appropriate Background Level mode
        const emphasisLevelMap: Record<string, string> = {
          'Ghost': 'Level 0',
          'Minimal': 'Level 1',
          'Subtle': 'Level 2',
          'Bold': 'Bold'
        };
        
        modes.forEach((mode, idx) => {
          const levelMode = emphasisLevelMap[mode] || 'Level 0';
          const backgroundLevelName = `${paletteName}/[Parent] ${scale}`;
          
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
            metadata: { scale, emphasis: mode, palette: paletteName }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} fill emphasis variables`);
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
