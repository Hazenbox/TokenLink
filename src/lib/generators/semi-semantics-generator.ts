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
    // Check if multi-brand mode
    if (this.allBrands && this.allBrands.length > 1) {
      return this.generateMultiBrand();
    } else {
      return this.generateSingleBrand();
    }
  }
  
  /**
   * Generate for single brand
   */
  private generateSingleBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    
    if (!this.brand.colors) {
      this.warn('No colors configured for brand');
      return variables;
    }
    
    // Collect all assigned palettes
    const palettes = [
      { name: this.brand.colors.neutral?.paletteName, ref: this.brand.colors.neutral },
      { name: this.brand.colors.primary?.paletteName, ref: this.brand.colors.primary },
      { name: this.brand.colors.secondary?.paletteName, ref: this.brand.colors.secondary },
      { name: this.brand.colors.sparkle?.paletteName, ref: this.brand.colors.sparkle },
      { name: this.brand.colors.semantic?.positive?.paletteName, ref: this.brand.colors.semantic?.positive },
      { name: this.brand.colors.semantic?.negative?.paletteName, ref: this.brand.colors.semantic?.negative },
      { name: this.brand.colors.semantic?.warning?.paletteName, ref: this.brand.colors.semantic?.warning },
      { name: this.brand.colors.semantic?.informative?.paletteName, ref: this.brand.colors.semantic?.informative }
    ].filter(p => p.name && p.ref);
    
    // Remove duplicates (same palette assigned to multiple roles)
    const uniquePalettes = Array.from(
      new Map(palettes.map(p => [p.name, p])).values()
    );
    
    this.log(`Generating Semi-Semantics for ${uniquePalettes.length} palettes`);
    
    // Generate variables for each palette (using palette name)
    for (const paletteInfo of uniquePalettes) {
      const paletteName = paletteInfo.name!;
      
      for (const step of STEPS) {
        for (const scale of SCALE_NAMES) {
          const name = `${paletteName}/${step}/[Semi semantics] ${scale}`;
          const primitiveName = `${paletteName}/${step}/${scale}`;
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
            metadata: { step, scale, palette: paletteName }
          });
        }
      }
    }
    
    this.log(`Generated ${variables.length} semi-semantic variables`);
    return variables;
  }
  
  /**
   * Generate for multiple brands (merge all unique palettes)
   */
  private generateMultiBrand(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const brands = this.allBrands!;
    
    this.log(`Generating Semi-Semantics (multi-brand) for ${brands.length} brands`);
    
    // Collect ALL unique palette names from all brands
    const allPaletteNames = new Set<string>();
    
    brands.forEach(brand => {
      if (!brand.colors) return;
      
      const paletteRefs = [
        brand.colors.neutral,
        brand.colors.primary,
        brand.colors.secondary,
        brand.colors.sparkle,
        brand.colors.semantic?.positive,
        brand.colors.semantic?.negative,
        brand.colors.semantic?.warning,
        brand.colors.semantic?.informative
      ].filter(Boolean);
      
      paletteRefs.forEach(ref => {
        if (ref?.paletteName) {
          allPaletteNames.add(ref.paletteName);
        }
      });
    });
    
    this.log(`Collected ${allPaletteNames.size} unique palettes from all brands: ${Array.from(allPaletteNames).join(', ')}`);
    
    // Generate variables for each unique palette
    allPaletteNames.forEach(paletteName => {
      for (const step of STEPS) {
        for (const scale of SCALE_NAMES) {
          const name = `${paletteName}/${step}/[Semi semantics] ${scale}`;
          const primitiveName = `${paletteName}/${step}/${scale}`;
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
            metadata: { step, scale, palette: paletteName }
          });
        }
      }
    });
    
    this.log(`Generated ${variables.length} semi-semantic variables (merged from ${brands.length} brands)`);
    return variables;
  }
}
