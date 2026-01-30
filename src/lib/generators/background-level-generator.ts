/**
 * Background Level Generator (Layer 4)
 * Generates surface stacking levels that alias to Interaction State
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
    
    // Check if multi-brand mode
    const isMultiBrand = this.allBrands && this.allBrands.length > 1;
    const paletteNames = isMultiBrand 
      ? this.getAllBrandsPaletteNames()
      : this.getAssignedPaletteNames();
    
    this.log(`Generating Background Level variables with ${modes.length} modes${isMultiBrand ? ` (multi-brand: ${this.allBrands!.length} brands)` : ''}`);
    this.log(`Processing ${paletteNames.length} palettes: ${paletteNames.join(', ')}`);
    
    for (const paletteName of paletteNames) {
      for (const scale of SCALE_NAMES) {
        const name = `${paletteName}/[Parent] ${scale}`;
        
        // Map each level mode to appropriate Interaction State
        const levelStateMap: Record<string, { state: string, emphasis: string }> = {
          'Level 0': { state: 'Idle', emphasis: 'Ghost' },
          'Level 1': { state: 'Hover', emphasis: 'Minimal' },
          'Level 2': { state: 'Pressed', emphasis: 'Subtle' },
          'Bold': { state: 'Idle', emphasis: 'Bold' },
          'Elevated': { state: 'Focus', emphasis: 'Subtle' }
        };
        
        modes.forEach((mode, idx) => {
          const stateConfig = levelStateMap[mode] || { state: 'Idle', emphasis: 'Ghost' };
          const interactionStateName = `${paletteName}/Default/${stateConfig.emphasis}/[Interaction state] ${scale}`;
          
          const interactionStateVars = this.registry.findByCollection('interaction-state')
            .filter(v => v.name === interactionStateName && v.modeName === stateConfig.state);
          
          if (interactionStateVars.length === 0) {
            this.warn(`Interaction State variable not found: ${interactionStateName} (${stateConfig.state})`);
            return;
          }
          
          const interactionStateVar = interactionStateVars[0];
          
          variables.push({
            id: this.generateVariableId(),
            name,
            collectionId: this.layer.id,
            collectionName: this.layer.collectionName,
            layer: this.layer.order,
            modeId: `mode_${idx}`,
            modeName: mode,
            aliasToId: interactionStateVar.id,
            aliasToName: interactionStateName,
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
