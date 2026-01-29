/**
 * Appearance Generator (Layer 6)
 * Generates appearance contexts (Neutral, Primary, Secondary, etc.) that alias to Fill Emphasis
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

const APPEARANCE_CONTEXTS = [
  'Neutral',
  'Primary',
  'Secondary',
  'Sparkle',
  'Positive',
  'Negative',
  'Warning',
  'Informative',
  'Brand BG'
] as const;

export class AppearanceGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || Array.from(APPEARANCE_CONTEXTS);
    
    this.log(`Generating Appearance variables with ${modes.length} appearance contexts`);
    
    // Get brand name for variable naming
    const brandName = this.brand.name || 'Brand';
    
    for (const scale of SCALE_NAMES) {
      // ONE variable per scale with MULTIPLE appearance modes
      const name = `${brandName}/Default/[appearance] ${scale}`;
      
      modes.forEach((appearance, idx) => {
        // Get palette name for this appearance
        const paletteName = this.getPaletteForAppearance(appearance);
        
        if (!paletteName) {
          this.warn(`No palette assigned for appearance: ${appearance}`);
          return;
        }
        
        // Find Fill Emphasis variable for this palette
        // Use 'Subtle' emphasis for Neutral, 'Bold' for others
        const emphasisMode = appearance === 'Neutral' ? 'Subtle' : 'Bold';
        const fillEmphasisName = `${paletteName}/[Child] ${scale}`;
        
        const fillEmphasisVars = this.registry.findByCollection('fill-emphasis')
          .filter(v => v.name === fillEmphasisName && v.modeName === emphasisMode);
        
        if (fillEmphasisVars.length === 0) {
          this.warn(`Fill Emphasis variable not found: ${fillEmphasisName} (${emphasisMode})`);
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
          modeName: appearance,
          aliasToId: fillEmphasisVar.id,
          aliasToName: fillEmphasisName,
          metadata: { scale, appearance, targetPalette: paletteName }
        });
      });
    }
    
    this.log(`Generated ${variables.length} appearance variables`);
    return variables;
  }
  
  /**
   * Map appearance context to assigned palette name
   */
  private getPaletteForAppearance(appearance: string): string | null {
    if (!this.brand.colors) return null;
    
    switch (appearance) {
      case 'Neutral': return this.brand.colors.neutral?.paletteName || null;
      case 'Primary': return this.brand.colors.primary?.paletteName || null;
      case 'Secondary': return this.brand.colors.secondary?.paletteName || null;
      case 'Sparkle': return this.brand.colors.sparkle?.paletteName || null;
      case 'Positive': return this.brand.colors.semantic?.positive?.paletteName || null;
      case 'Negative': return this.brand.colors.semantic?.negative?.paletteName || null;
      case 'Warning': return this.brand.colors.semantic?.warning?.paletteName || null;
      case 'Informative': return this.brand.colors.semantic?.informative?.paletteName || null;
      case 'Brand BG': return this.brand.colors.sparkle?.paletteName || null;
      default: return null;
    }
  }
}
