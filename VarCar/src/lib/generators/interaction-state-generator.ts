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
    
    const paletteNames = this.getAssignedPaletteNames();
    
    // Generate for each palette
    for (const paletteName of paletteNames) {
      // Generate for each fill emphasis type
      for (const emphasisType of FILL_EMPHASIS_TYPES) {
        for (const scale of SCALE_NAMES) {
          const name = `${paletteName}/Default/${emphasisType}/[Interaction state] ${scale}`;
          
          // Alias to Fill Emphasis layer
          const fillEmphasisName = `${paletteName}/[Child] ${scale}`;
          
          modes.forEach((mode, idx) => {
            // Find Fill Emphasis variable with appropriate emphasis mode
            const fillEmphasisVars = this.registry.findByCollection('fill-emphasis')
              .filter(v => v.name === fillEmphasisName && v.modeName === emphasisType);
            
            if (fillEmphasisVars.length === 0) {
              this.warn(`Fill Emphasis variable not found: ${fillEmphasisName} (${emphasisType})`);
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
              modeName: mode,
              aliasToId: fillEmphasisVar.id,
              aliasToName: fillEmphasisName,
              metadata: { scale, state: mode, context: emphasisType, palette: paletteName }
            });
          });
        }
      }
    }
    
    this.log(`Generated ${variables.length} interaction state variables`);
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
