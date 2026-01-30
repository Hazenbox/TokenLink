/**
 * Theme Generator (Layer 7)
 * Generates theme variables that alias to Appearance layer
 * - Single brand: creates one variable per scale/category with one mode
 * - Multi-brand: creates one variable per scale/category with modes for ALL brands
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
    // Check if multi-brand mode
    if (this.allBrands && this.allBrands.length > 1) {
      return this.generateMultiBrand();
    } else {
      return this.generateSingleBrand();
    }
  }
  
  /**
   * Generate for single brand (one mode per variable)
   */
  private generateSingleBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    
    // Get brand name - use as mode name for single brand
    const brandName = this.brand.name || 'Brand';
    
    // Get mode from layer config (should be [brandName] for single brand)
    // Fallback to brand name if modes array is empty or undefined
    const modes = this.layer.modes && this.layer.modes.length > 0 
      ? this.layer.modes 
      : [brandName];
    
    // For single brand, we expect exactly one mode
    const modeName = modes[0] || brandName;
    
    this.log(`Generating Theme variables (single brand) with mode: ${modeName}`);
    
    for (const category of CATEGORIES) {
      for (const scale of SCALE_NAMES) {
        const name = `${brandName}/${category}/[Theme] ${scale}`;
        
        // Find Appearance variable for this brand
        // Use Primary appearance mode
        const appearanceName = `${brandName}/Default/[appearance] ${scale}`;
        const appearanceVars = this.registry.findByCollection('appearance')
          .filter(v => v.name === appearanceName && v.modeName === 'Primary');
        
        if (appearanceVars.length === 0) {
          this.warn(`Appearance variable not found: ${appearanceName} (Primary)`);
          continue;
        }
        
        const appearanceVar = appearanceVars[0];
        
        // Create single variable with single mode for single brand
        variables.push({
          id: this.generateVariableId(),
          name,
          collectionId: this.layer.id,
          collectionName: this.layer.collectionName,
          layer: this.layer.order,
          modeId: 'mode_0',
          modeName: modeName,
          aliasToId: appearanceVar.id,
          aliasToName: appearanceName,
          metadata: { scale, context: category }
        });
      }
    }
    
    this.log(`Generated ${variables.length} theme variables`);
    return variables;
  }
  
  /**
   * Generate for multiple brands (one variable with modes for each brand)
   */
  private generateMultiBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const brands = this.allBrands!;
    
    this.log(`Generating Theme variables (multi-brand) for ${brands.length} brands`);
    
    // Use first brand's name as organizational prefix
    // TODO: Make this configurable
    const orgPrefix = brands[0].name.split(/(?=[A-Z])/)[0] || brands[0].name;
    
    for (const category of CATEGORIES) {
      for (const scale of SCALE_NAMES) {
        // ONE variable name for all brands
        const name = `${orgPrefix}/${category}/[Theme] ${scale}`;
        
        // Create mode for EACH brand
        brands.forEach((brand, idx) => {
          // Find Appearance variable for this specific brand
          // Variable naming: {BrandName}/Default/[appearance] {Scale}
          const appearanceName = `${brand.name}/Default/[appearance] ${scale}`;
          const appearanceVars = this.registry.findByCollection('appearance')
            .filter(v => v.name === appearanceName && v.modeName === 'Primary');
          
          if (appearanceVars.length === 0) {
            this.warn(`Appearance variable not found for brand "${brand.name}": ${appearanceName} (Primary)`);
            return;
          }
          
          const appearanceVar = appearanceVars[0];
          
          // Create variable entry for this mode
          variables.push({
            id: this.generateVariableId(),
            name, // Same name for all modes
            collectionId: this.layer.id,
            collectionName: this.layer.collectionName,
            layer: this.layer.order,
            modeId: `mode_${idx}`,
            modeName: brand.name, // Mode name = brand name
            aliasToId: appearanceVar.id,
            aliasToName: appearanceName,
            metadata: { scale, context: category, brandName: brand.name }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} theme variables (${variables.length / brands.length} per brand)`);
    return variables;
  }
}
