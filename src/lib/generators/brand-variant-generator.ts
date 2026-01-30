/**
 * Brand Variant Generator (Layer 8)
 * Generates brand variant variables that alias to Theme layer
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

const TOKEN_CATEGORIES = ['Primary', 'Secondary', 'Accent', 'Surface'] as const;

export class BrandVariantGenerator extends BaseLayerGenerator {
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
    
    this.log(`Generating Brand Variant variables (single brand) with mode: ${modeName}`);
    
    for (const tokenCategory of TOKEN_CATEGORIES) {
      for (const scale of SCALE_NAMES) {
        const name = `${brandName}/${tokenCategory}/[Brand] ${scale}`;
        
        // Find Theme variable for this brand
        // Map to the Surfaces category from Theme layer
        const themeName = `${brandName}/Surfaces/[Theme] ${scale}`;
        
        // Find Theme variable with current brand's mode
        const themeVar = this.registry.findByCollection('theme')
          .find(v => v.name === themeName && v.modeName === modeName);
        
        if (!themeVar) {
          this.warn(`Theme variable not found: ${themeName} (mode: ${modeName})`);
          continue;
        }
        
        // Create single variable with single mode for single brand
        variables.push({
          id: this.generateVariableId(),
          name,
          collectionId: this.layer.id,
          collectionName: this.layer.collectionName,
          layer: this.layer.order,
          modeId: 'mode_0',
          modeName: modeName,
          aliasToId: themeVar.id,
          aliasToName: themeName,
          metadata: { scale, context: tokenCategory }
        });
      }
    }
    
    this.log(`Generated ${variables.length} brand variant variables`);
    return variables;
  }
  
  /**
   * Generate for multiple brands (one variable with modes for each brand)
   */
  private generateMultiBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const brands = this.allBrands!;
    
    this.log(`Generating Brand Variant variables (multi-brand) for ${brands.length} brands`);
    
    // Use first brand's name as organizational prefix
    // TODO: Make this configurable
    const orgPrefix = brands[0].name.split(/(?=[A-Z])/)[0] || brands[0].name;
    
    for (const tokenCategory of TOKEN_CATEGORIES) {
      for (const scale of SCALE_NAMES) {
        // ONE variable name for all brands
        const name = `${orgPrefix}/${tokenCategory}/[Brand] ${scale}`;
        
        // Create mode for EACH brand
        brands.forEach((brand, idx) => {
          // Find Theme variable for this specific brand
          // Theme variable naming: {OrgPrefix}/{Category}/[Theme] {Scale}
          // We need to find the Theme variable mode that matches this brand
          const themeName = `${orgPrefix}/Surfaces/[Theme] ${scale}`;
          const themeVar = this.registry.findByCollection('theme')
            .find(v => v.name === themeName && v.modeName === brand.name);
          
          if (!themeVar) {
            this.warn(`Theme variable not found for brand "${brand.name}": ${themeName} (mode: ${brand.name})`);
            return;
          }
          
          // Create variable entry for this mode
          variables.push({
            id: this.generateVariableId(),
            name, // Same name for all modes
            collectionId: this.layer.id,
            collectionName: this.layer.collectionName,
            layer: this.layer.order,
            modeId: `mode_${idx}`,
            modeName: brand.name, // Mode name = brand name
            aliasToId: themeVar.id,
            aliasToName: themeName,
            metadata: { scale, context: tokenCategory, brandName: brand.name }
          });
        });
      }
    }
    
    this.log(`Generated ${variables.length} brand variant variables (${variables.length / brands.length} per brand)`);
    return variables;
  }
}
