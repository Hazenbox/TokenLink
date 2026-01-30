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

// Contexts for Semantics hierarchy (surface elevation levels)
const SEMANTICS_CONTEXTS = ['Default', 'Minimal', 'Subtle', 'Bold', 'Elevated'] as const;

// Emphasis levels for each context
const EMPHASIS_LEVELS = ['Ghost', 'Minimal', 'Subtle', 'Bold'] as const;

// Interaction states
const INTERACTION_STATES = ['Idle', 'Hover', 'Pressed'] as const;

export class ColourModeGenerator extends BaseLayerGenerator {
  /**
   * Get surface step for a semantic context (from stacking logic)
   */
  private getContextSurfaceStep(context: string, isLight: boolean): Step {
    const surfaceMap = {
      'Default': isLight ? 2500 : 200,
      'Minimal': isLight ? 2400 : 300,
      'Subtle': isLight ? 2300 : 400,
      'Bold': 0,  // Calculate separately with contrast (simplified for now)
      'Elevated': isLight ? 2500 : 300
    };
    return surfaceMap[context as keyof typeof surfaceMap] as Step;
  }

  /**
   * Get emphasis root step from context surface (from stacking logic)
   */
  private getEmphasisRoot(contextSurface: Step, emphasis: string, isLight: boolean): Step {
    const dir = isLight ? -1 : 1;
    const emphasisMap = {
      'Ghost': 0,      // +0 from context surface
      'Minimal': 1,    // +1 from context surface
      'Subtle': 2,     // +2 from context surface
      'Bold': 0        // Calculate separately with contrast (simplified for now)
    };
    const offset = emphasisMap[emphasis as keyof typeof emphasisMap];
    return getStepFromIndex(getStepIndex(contextSurface) + (offset * dir));
  }

  /**
   * Get state step from emphasis root (from stacking logic)
   */
  private getStateStep(emphasisRoot: Step, state: string, isLight: boolean): Step {
    const dir = isLight ? -1 : 1;
    const stateMap = {
      'Idle': 0,       // +0 from emphasis root
      'Hover': 1,      // +1 from emphasis root
      'Pressed': 2     // +2 from emphasis root
    };
    const offset = stateMap[state as keyof typeof stateMap];
    return getStepFromIndex(getStepIndex(emphasisRoot) + (offset * dir));
  }

  generate(): VariableEntry[] {
    const variables: VariableEntry[] = [];
    const modes = this.layer.modes || ['Light', 'Dark'];
    
    // Check if multi-brand mode
    const isMultiBrand = this.allBrands && this.allBrands.length > 1;
    const paletteNames = isMultiBrand 
      ? this.getAllBrandsPaletteNames()
      : this.getAssignedPaletteNames();
    
    this.log(`Generating Colour Mode variables with ${modes.length} modes${isMultiBrand ? ` (multi-brand: ${this.allBrands!.length} brands)` : ''}`);
    this.log(`Processing ${paletteNames.length} palettes: ${paletteNames.join(', ')}`);
    
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
    
    this.log(`Generated ${variables.length} Root variables`);
    
    // === Generate Semantics Variables ===
    // Pattern: {palette}/Semantics/{context}/{emphasis}/{state}/[Colour Mode] {scale}
    this.log('Generating Semantics variables with full hierarchy...');
    
    const semanticsStartCount = variables.length;
    
    for (const paletteName of paletteNames) {
      for (const context of SEMANTICS_CONTEXTS) {
        for (const emphasis of EMPHASIS_LEVELS) {
          for (const state of INTERACTION_STATES) {
            for (const scale of SCALE_NAMES) {
              const name = `${paletteName}/Semantics/${context}/${emphasis}/${state}/[Colour Mode] ${scale}`;
              
              // Create entries for each mode (Light and Dark)
              modes.forEach((mode, idx) => {
                const isLight = mode === 'Light';
                
                // Step 1: Get context surface step
                const contextSurface = this.getContextSurfaceStep(context, isLight);
                
                // Step 2: Get emphasis root from context surface
                const emphasisRoot = this.getEmphasisRoot(contextSurface, emphasis, isLight);
                
                // Step 3: Get state step from emphasis root
                const targetStep = this.getStateStep(emphasisRoot, state, isLight);
                
                // Target semi-semantic variable
                const semiSemanticName = `${paletteName}/${targetStep}/[Semi semantics] ${scale}`;
                const semiSemanticVar = this.resolveAliasTarget(semiSemanticName, 'semi-semantics');
                
                if (!semiSemanticVar) {
                  this.warn(`Semi-semantic not found: ${semiSemanticName} (for ${name} in ${mode})`);
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
                  metadata: { context, emphasis, state, scale, palette: paletteName, mode }
                });
              });
            }
          }
        }
      }
    }
    
    const semanticsCount = variables.length - semanticsStartCount;
    this.log(`Generated ${semanticsCount} Semantics variables`);
    this.log(`Generated ${variables.length} total colour mode variables (Root + Semantics)`);
    
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
