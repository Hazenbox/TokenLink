/**
 * Colour Mode Generator (Layer 2)
 * Generates Light/Dark mode variables that alias to semi-semantics
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

const CONTEXTS = ['Root', 'Default'] as const;

export class ColourModeGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Light', 'Dark'];
    
    this.log(`Generating Colour Mode variables with ${modes.length} modes`);
    
    const paletteNames = this.getAssignedPaletteNames();
    
    for (const paletteName of paletteNames) {
      for (const context of CONTEXTS) {
        for (const scale of SCALE_NAMES) {
          const name = `${paletteName}/Semi semantics/${context}/[Colour Mode] ${scale}`;
          
          // Light mode uses high steps (2500), Dark mode uses low steps (200)
          const lightStep = 2500;
          const darkStep = 200;
          
          const lightSource = `${paletteName}/${lightStep}/[Semi semantics] ${scale}`;
          const darkSource = `${paletteName}/${darkStep}/[Semi semantics] ${scale}`;
          
          const lightVar = this.resolveAliasTarget(lightSource, 'semi-semantics');
          const darkVar = this.resolveAliasTarget(darkSource, 'semi-semantics');
          
          if (!lightVar || !darkVar) {
            this.warn(`Source variables not found for ${name}`);
            continue;
          }
          
          // Create entries for each mode (Light and Dark)
          modes.forEach((mode, idx) => {
            const aliasTarget = idx === 0 ? lightVar : darkVar;
            const aliasSourceName = idx === 0 ? lightSource : darkSource;
            
            variables.push({
              id: this.generateVariableId(),
              name,
              collectionId: this.layer.id,
              collectionName: this.layer.collectionName,
              layer: this.layer.order,
              modeId: `mode_${idx}`,
              modeName: mode,
              aliasToId: aliasTarget.id,
              aliasToName: aliasSourceName,
              metadata: { context, scale, palette: paletteName }
            });
          });
        }
      }
    }
    
    this.log(`Generated ${variables.length} colour mode variables`);
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
