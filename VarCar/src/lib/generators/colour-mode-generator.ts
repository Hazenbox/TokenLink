/**
 * Colour Mode Generator (Layer 2)
 * Generates Light/Dark mode variables with Root system that alias to semi-semantics
 * 
 * Uses proven stacking logic from SurfaceStacking.tsx
 * - Light mode: Root = 2500, Root +1 = 2400 (going darker, direction = -1)
 * - Dark mode: Root = 200, Root +1 = 300 (going lighter, direction = +1)
 */

import { BaseLayerGenerator } from './base-layer-generator';
import { VariableEntry } from '@/lib/variable-registry';
import { getStepIndex, getStepFromIndex } from '@/lib/colors/root-system';
import { Step } from '@/lib/colors/color-utils';

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

// Generate Root, Root +1, Root +2, ..., Root +6
const ROOT_OFFSETS = [0, 1, 2, 3, 4, 5, 6] as const;

export class ColourModeGenerator extends BaseLayerGenerator {
  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Light', 'Dark'];
    
    this.log(`Generating Colour Mode variables with ${modes.length} modes`);
    
    const paletteNames = this.getAssignedPaletteNames();
    
    for (const paletteName of paletteNames) {
      for (const offset of ROOT_OFFSETS) {
        for (const scale of SCALE_NAMES) {
          // Generate Root-based variable name (Root, Root +1, Root +2, etc.)
          const rootLabel = offset === 0 ? 'Root' : `Root +${offset}`;
          const name = `${paletteName}/Semi semantics/${rootLabel}/[Colour Mode] ${scale}`;
          
          // Create entries for each mode (Light and Dark)
          modes.forEach((mode, idx) => {
            const isLight = mode === 'Light';
            
            // Use proven stacking logic from SurfaceStacking.tsx (lines 191, 223-227)
            // Base step for each mode
            const surfaceStep: Step = isLight ? 2500 : 200;
            
            // Direction: -1 for light (darker = lower numbers), +1 for dark (darker = higher numbers)
            const dir = isLight ? -1 : 1;
            
            // Calculate target step using getStepIndex/getStepFromIndex (same as SurfaceStacking.tsx)
            // Formula: targetStep = getStepFromIndex(getStepIndex(surfaceStep) + (offset * dir))
            const targetStep = getStepFromIndex(getStepIndex(surfaceStep) + (offset * dir));
            
            // Target semi-semantic variable name
            const semiSemanticName = `${paletteName}/${targetStep}/[Semi semantics] ${scale}`;
            const semiSemanticVar = this.resolveAliasTarget(semiSemanticName, 'semi-semantics');
            
            if (!semiSemanticVar) {
              this.warn(`Semi-semantic variable not found: ${semiSemanticName} (for ${name} in ${mode} mode)`);
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
              aliasToId: semiSemanticVar.id,
              aliasToName: semiSemanticName,
              metadata: { rootOffset: offset, scale, palette: paletteName, mode }
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
