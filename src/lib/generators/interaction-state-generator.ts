/**
 * Interaction State Generator (Layer 3)
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
    
    // Check if multi-brand mode
    const isMultiBrand = this.allBrands && this.allBrands.length > 1;
    const paletteNames = isMultiBrand 
      ? this.getAllBrandsPaletteNames()
      : this.getAssignedPaletteNames();
    
    this.log(`Generating Interaction State variables with ${modes.length} modes${isMultiBrand ? ` (multi-brand: ${this.allBrands!.length} brands)` : ''}`);
    this.log(`Processing ${paletteNames.length} palettes: ${paletteNames.join(', ')}`);
    
    // Generate for each palette
    for (const paletteName of paletteNames) {
      // Generate for each fill emphasis type (for variable naming structure)
      for (const emphasisType of FILL_EMPHASIS_TYPES) {
        for (const scale of SCALE_NAMES) {
          const name = `${paletteName}/Default/${emphasisType}/[Interaction state] ${scale}`;
          
          // Alias to Colour Mode layer (Root variables)
          // Map interaction state to Root offset
          const stateRootMap: Record<string, string> = {
            'Idle': 'Root',
            'Hover': 'Root +1',
            'Pressed': 'Root +2',
            'Focus': 'Root +3'
          };
          
          modes.forEach((mode, idx) => {
            const rootOffset = stateRootMap[mode] || 'Root';
            const colourModeName = `${paletteName}/Semi semantics/${rootOffset}/[Colour Mode] ${scale}`;
            
            // Find Colour Mode variable
            const colourModeVars = this.registry.findByCollection('colour-mode')
              .filter(v => v.name === colourModeName && v.modeName === 'Light');
            
            if (colourModeVars.length === 0) {
              this.warn(`Colour Mode variable not found: ${colourModeName} (Light)`);
              return;
            }
            
            const colourModeVar = colourModeVars[0];
            
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
  
  /**
   * Get all unique palette names from all brands (for multi-brand mode)
   */
  private getAllBrandsPaletteNames(): string[] {
    if (!this.allBrands) return this.getAssignedPaletteNames();
    
    const names = new Set<string>();
    
    this.allBrands.forEach(brand => {
      if (!brand.colors) return;
      
      if (brand.colors.neutral?.paletteName) names.add(brand.colors.neutral.paletteName);
      if (brand.colors.primary?.paletteName) names.add(brand.colors.primary.paletteName);
      if (brand.colors.secondary?.paletteName) names.add(brand.colors.secondary.paletteName);
      if (brand.colors.sparkle?.paletteName) names.add(brand.colors.sparkle.paletteName);
      if (brand.colors.semantic?.positive?.paletteName) names.add(brand.colors.semantic.positive.paletteName);
      if (brand.colors.semantic?.negative?.paletteName) names.add(brand.colors.semantic.negative.paletteName);
      if (brand.colors.semantic?.warning?.paletteName) names.add(brand.colors.semantic.warning.paletteName);
      if (brand.colors.semantic?.informative?.paletteName) names.add(brand.colors.semantic.informative.paletteName);
    });
    
    return Array.from(names);
  }
}
