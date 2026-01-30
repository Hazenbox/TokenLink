/**
 * Brand Generator
 * Generates complete variable sets from brand configuration and RangDe palettes
 */

import { Brand, GeneratedVariable, GeneratedBrand, BrandStatistics, ValidationResult } from "@/models/brand";
import { usePaletteStore } from "@/store/palette-store";
import { generateAllScales } from "@/lib/colors/scale-generator";
import { Step, STEPS } from "@/lib/colors/color-utils";
import { VariableRegistry, VariableEntry } from "./variable-registry";
import { useLayerMappingStore } from "@/store/layer-mapping-store";
import { getEnabledLayers } from "@/models/layer-mapping";
import { BaseLayerGenerator } from "./generators/base-layer-generator";
import { PrimitivesGenerator } from "./generators/primitives-generator";
import { SemiSemanticsGenerator } from "./generators/semi-semantics-generator";
import { ColourModeGenerator } from "./generators/colour-mode-generator";
import { BackgroundLevelGenerator } from "./generators/background-level-generator";
import { FillEmphasisGenerator } from "./generators/fill-emphasis-generator";
import { InteractionStateGenerator } from "./generators/interaction-state-generator";
import { AppearanceGenerator } from "./generators/appearance-generator";
import { ThemeGenerator } from "./generators/theme-generator";
import { BrandVariantGenerator } from "./generators/brand-variant-generator";

/**
 * Appearance contexts for variable generation
 */
const APPEARANCE_CONTEXTS = [
  'Neutral',
  'Primary',
  'Secondary',
  'Sparkle',
  'Positive',
  'Negative',
  'Warning',
  'Informative'
] as const;

type AppearanceContext = typeof APPEARANCE_CONTEXTS[number];

/**
 * Scale names for each appearance context
 */
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

type ScaleName = typeof SCALE_NAMES[number];

/**
 * Map scale names to keys in StepScales
 */
const SCALE_KEY_MAP: Record<ScaleName, keyof any> = {
  'Surface': 'surface',
  'High': 'high',
  'Medium': 'medium',
  'Low': 'low',
  'Heavy': 'heavy',
  'Bold': 'bold',
  'Bold A11Y': 'boldA11Y',
  'Minimal': 'minimal'
};

/**
 * BrandGenerator class - generates variables from brand configuration
 */
export class BrandGenerator {
  private brand: Brand;
  private variables: GeneratedVariable[] = [];
  private statistics: BrandStatistics;
  private validation: ValidationResult;

  constructor(brand: Brand) {
    this.brand = brand;
    this.statistics = this.initializeStatistics();
    this.validation = { valid: true, errors: [], warnings: [], info: [] };
  }

  /**
   * Initialize empty statistics
   */
  private initializeStatistics(): BrandStatistics {
    return {
      totalVariables: 0,
      collections: ['9 Theme'],
      modes: [this.brand.name],
      paletteUsage: {},
      contrastIssues: 0,
      aliasDepth: 1
    };
  }

  /**
   * Get palette ID for an appearance context
   */
  private getPaletteForAppearance(appearance: AppearanceContext): { id: string; name: string } | null {
    const appearanceLower = appearance.toLowerCase();
    
    // Map to brand colors
    if (appearanceLower === 'neutral') return this.brand.colors.neutral;
    if (appearanceLower === 'primary') return this.brand.colors.primary;
    if (appearanceLower === 'secondary') return this.brand.colors.secondary;
    if (appearanceLower === 'sparkle') return this.brand.colors.sparkle;
    if (appearanceLower === 'positive') return this.brand.colors.semantic.positive;
    if (appearanceLower === 'negative') return this.brand.colors.semantic.negative;
    if (appearanceLower === 'warning') return this.brand.colors.semantic.warning;
    if (appearanceLower === 'informative') return this.brand.colors.semantic.informative;
    
    return null;
  }

  /**
   * Load palette from palette store
   */
  private loadPalette(paletteId: string) {
    const paletteStore = usePaletteStore.getState();
    return paletteStore.palettes.find((p) => p.id === paletteId);
  }

  /**
   * Generate variables for a single appearance context
   */
  private generateAppearanceVariables(appearance: AppearanceContext): void {
    const paletteRef = this.getPaletteForAppearance(appearance);
    
    if (!paletteRef || !paletteRef.paletteId) {
      this.validation.warnings.push(`Missing palette for ${appearance}`);
      return;
    }

    const palette = this.loadPalette(paletteRef.paletteId);
    
    if (!palette) {
      this.validation.errors.push(`Palette "${paletteRef.paletteName}" not found for ${appearance}`);
      return;
    }

    // Track palette usage
    this.statistics.paletteUsage[paletteRef.paletteName] = 
      (this.statistics.paletteUsage[paletteRef.paletteName] || 0) + 1;

    // Validate palette.steps has hex values (not OKLCH)
    const sampleStep = palette.steps[600] || palette.steps[1000] || palette.steps[200];
    if (sampleStep && sampleStep.startsWith('oklch(')) {
      this.validation.errors.push(
        `Palette "${palette.name}" has OKLCH values - expected HEX. ` +
        `This suggests palette-loader.ts conversion failed.`
      );
      return; // Don't generate broken variables
    }

    // Generate scales for all steps
    const allScales = generateAllScales(palette.steps, palette.primaryStep);

    // Create variables for each step and scale
    for (const step of STEPS) {
      const stepScales = allScales[step];
      if (!stepScales) continue;

      for (const scaleName of SCALE_NAMES) {
        const scaleKey = SCALE_KEY_MAP[scaleName];
        const scaleResult = (stepScales as any)[scaleKey];
        
        // Enhanced validation
        if (!scaleResult || !scaleResult.hex) {
          console.warn(`[Generator] Missing scale result for ${palette.name}/${step}/${scaleName}`);
          continue;
        }
        
        // Validate hex format
        if (!scaleResult.hex.startsWith('#') || scaleResult.hex.length !== 7) {
          this.validation.warnings.push(
            `Invalid hex for ${palette.name}/${step}/${scaleName}: ${scaleResult.hex}`
          );
          continue; // Skip invalid hex
        }

        // Create variable name: BrandName/Appearance/[appearance] Scale
        // Example: MyJio/Primary/[primary] Bold
        const variableName = `${this.brand.name}/${appearance}/[${appearance.toLowerCase()}] ${scaleName}`;

        // Check contrast for warnings
        if (scaleResult.contrastRatio < 3.0 && (scaleName === 'Bold' || scaleName === 'Bold A11Y')) {
          this.statistics.contrastIssues++;
          this.validation.warnings.push(
            `Low contrast (${scaleResult.contrastRatio.toFixed(2)}) for ${variableName} at step ${step}`
          );
        }

        // Generate aliased variable that references RangDe palette
        const variable: GeneratedVariable = {
          name: variableName,
          collection: '9 Theme',
          mode: this.brand.name,
          value: scaleResult.hex, // Keep for preview/display
          aliasTo: {
            paletteId: paletteRef.paletteId,
            paletteName: paletteRef.paletteName,
            step: step,
            scale: scaleName
          },
          type: 'color',
          scopes: ['ALL_SCOPES'],
          sourceScale: scaleName,
          sourcePalette: paletteRef.paletteName,
          isAliased: true
        };

        this.variables.push(variable);
      }
    }
  }

  /**
   * Generate all variables for the brand
   */
  public generate(): GeneratedBrand {
    this.variables = [];
    this.validation = { valid: true, errors: [], warnings: [], info: [] };

    // Generate variables for each appearance context
    for (const appearance of APPEARANCE_CONTEXTS) {
      this.generateAppearanceVariables(appearance);
    }

    // Update statistics
    this.statistics.totalVariables = this.variables.length;
    this.validation.valid = this.validation.errors.length === 0;

    // Add info about generation
    this.validation.info.push(`Generated ${this.variables.length} variables`);
    this.validation.info.push(`Used ${Object.keys(this.statistics.paletteUsage).length} palettes`);

    return {
      brand: this.brand,
      variables: this.variables,
      statistics: this.statistics,
      validation: this.validation
    };
  }

  /**
   * Preview generation without creating variables
   */
  public preview(): {
    variableCount: number;
    palettesUsed: string[];
    missingPalettes: string[];
    warnings: string[];
  } {
    const palettesUsed: Set<string> = new Set();
    const missingPalettes: Set<string> = new Set();
    const warnings: string[] = [];
    let variableCount = 0;

    for (const appearance of APPEARANCE_CONTEXTS) {
      const paletteRef = this.getPaletteForAppearance(appearance);
      
      if (!paletteRef || !paletteRef.paletteId) {
        missingPalettes.add(appearance);
        continue;
      }

      const palette = this.loadPalette(paletteRef.paletteId);
      
      if (!palette) {
        warnings.push(`Palette "${paletteRef.paletteName}" not found`);
        continue;
      }

      palettesUsed.add(paletteRef.paletteName);
      
      // Count: 24 steps × 8 scales = 192 variables per appearance
      variableCount += STEPS.length * SCALE_NAMES.length;
    }

    return {
      variableCount,
      palettesUsed: Array.from(palettesUsed),
      missingPalettes: Array.from(missingPalettes),
      warnings
    };
  }

  /**
   * Static method to validate brand before generation
   */
  public static validate(brand: Brand): ValidationResult {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      const info: string[] = [];

      // Check required palette assignments
      const requiredRoles = ['primary', 'secondary', 'sparkle', 'neutral'] as const;
      for (const role of requiredRoles) {
        if (!brand.colors[role]?.paletteId) {
          errors.push(`Missing ${role} palette assignment`);
        }
      }

      // Check semantic colors
      const semanticRoles = ['positive', 'negative', 'warning', 'informative'] as const;
      for (const role of semanticRoles) {
        if (!brand.colors.semantic?.[role]?.paletteId) {
          warnings.push(`Missing ${role} semantic color assignment`);
        }
      }

      // Check if palettes exist
      const paletteStore = usePaletteStore.getState();
      const allPaletteRefs = [
        brand.colors.primary,
        brand.colors.secondary,
        brand.colors.sparkle,
        brand.colors.neutral,
        brand.colors.semantic?.positive,
        brand.colors.semantic?.negative,
        brand.colors.semantic?.warning,
        brand.colors.semantic?.informative
      ].filter(Boolean); // Remove undefined values

      for (const ref of allPaletteRefs) {
        if (ref?.paletteId && !paletteStore.palettes.find((p) => p.id === ref.paletteId)) {
          errors.push(`Palette "${ref.paletteName}" not found in RangDe`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        info
      };
    } catch (error) {
      console.error('Brand validation error:', error);
      return {
        valid: false,
        errors: ['Validation failed: ' + ((error as Error)?.message || 'Unknown error')],
        warnings: [],
        info: []
      };
    }
  }

  /**
   * Generate variables using full multi-layer architecture
   */
  public generateWithLayers(): GeneratedBrand {
    console.log('=== Multi-Layer Variable Generation Started ===');
    
    const registry = new VariableRegistry();
    const layerConfig = useLayerMappingStore.getState().config;
    const enabledLayers = getEnabledLayers(layerConfig);
    
    console.log(`Generating ${enabledLayers.length} enabled layers`);
    
    // Generate each layer in order
    for (const layer of enabledLayers) {
      console.log(`\nGenerating Layer ${layer.order}: ${layer.displayName}`);
      
      try {
        const generator = this.createLayerGenerator(layer, registry);
        const layerVariables = generator.generate();
        
        // Register all variables in the registry
        layerVariables.forEach(v => registry.register(v));
        
        console.log(`✓ Generated ${layerVariables.length} variables for ${layer.displayName}`);
      } catch (error) {
        console.error(`✗ Error generating ${layer.displayName}:`, error);
        this.validation.errors.push(`Failed to generate ${layer.displayName}: ${error}`);
      }
    }
    
    // Get statistics from registry
    const stats = registry.getStatistics();
    console.log('\n=== Generation Statistics ===');
    console.log(`Total variables: ${stats.totalVariables}`);
    console.log(`Max alias depth: ${stats.maxAliasDepth}`);
    console.log('Variables by layer:', stats.variablesByLayer);
    
    // Convert registry entries to GeneratedVariable format
    const allVariables = this.convertToGeneratedVariables(registry);
    
    // Update statistics
    this.statistics.totalVariables = allVariables.length;
    this.statistics.aliasDepth = stats.maxAliasDepth;
    this.statistics.collections = Object.keys(stats.variablesByCollection);
    this.validation.valid = this.validation.errors.length === 0;
    
    this.validation.info.push(`Generated ${allVariables.length} variables across ${enabledLayers.length} layers`);
    this.validation.info.push(`Maximum alias depth: ${stats.maxAliasDepth}`);
    
    console.log('=== Multi-Layer Variable Generation Complete ===\n');
    
    return {
      brand: this.brand,
      variables: allVariables,
      statistics: this.statistics,
      validation: this.validation
    };
  }
  
  /**
   * Create appropriate generator for a layer
   */
  private createLayerGenerator(layer: any, registry: VariableRegistry): BaseLayerGenerator {
    switch (layer.generationType) {
      case 'primitives':
        return new PrimitivesGenerator(layer, registry, this.brand);
      case 'semantic':
        return new SemiSemanticsGenerator(layer, registry, this.brand);
      case 'mode':
        return new ColourModeGenerator(layer, registry, this.brand);
      case 'hierarchy':
        if (layer.id === 'background-level') {
          return new BackgroundLevelGenerator(layer, registry, this.brand);
        }
        if (layer.id === 'fill-emphasis') {
          return new FillEmphasisGenerator(layer, registry, this.brand);
        }
        throw new Error(`Unknown hierarchy layer: ${layer.id}`);
      case 'state':
        return new InteractionStateGenerator(layer, registry, this.brand);
      case 'contextual':
        return new AppearanceGenerator(layer, registry, this.brand);
      case 'theme':
        return new ThemeGenerator(layer, registry, this.brand);
      case 'brand':
        return new BrandVariantGenerator(layer, registry, this.brand);
      default:
        throw new Error(`Unknown layer generation type: ${layer.generationType}`);
    }
  }
  
  /**
   * Create generator for multi-brand layers (Theme, Brand)
   * These generators need access to all brands to create variables with modes for each brand
   */
  private createLayerGeneratorMultiBrand(layer: any, registry: VariableRegistry, allBrands: Brand[]): BaseLayerGenerator {
    switch (layer.generationType) {
      case 'theme':
        return new ThemeGenerator(layer, registry, this.brand, allBrands);
      case 'brand':
        return new BrandVariantGenerator(layer, registry, this.brand, allBrands);
      default:
        throw new Error(`Multi-brand generator not supported for layer type: ${layer.generationType}`);
    }
  }
  
  /**
   * Convert VariableEntry to GeneratedVariable format
   */
  private convertToGeneratedVariables(registry: VariableRegistry): GeneratedVariable[] {
    const allEntries = registry.getAllVariables();
    const converted: GeneratedVariable[] = [];
    
    for (const entry of allEntries) {
      // Determine if this variable has a value or is aliased
      const isAliased = !!entry.aliasToId;
      
      // For preview, we need to resolve the RGB value through the alias chain
      let previewValue: string | undefined;
      if (entry.value) {
        // Direct RGB value - convert to hex with validation
        const r = Math.round(entry.value.r * 255);
        const g = Math.round(entry.value.g * 255);
        const b = Math.round(entry.value.b * 255);
        
        // Validate RGB values
        if (isNaN(r) || isNaN(g) || isNaN(b)) {
          console.error(`[brand-generator convertToGeneratedVariables] Invalid RGB for ${entry.name}:`, entry.value);
          console.error(`  r=${entry.value.r} (${r}), g=${entry.value.g} (${g}), b=${entry.value.b} (${b})`);
          // Skip this variable or use fallback
          previewValue = undefined;
        } else {
          previewValue = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
      } else if (isAliased) {
        // Trace back through alias chain to find RGB value
        const chain = registry.getAliasChain(entry.id);
        const primitive = chain[chain.length - 1];
        if (primitive && primitive.value) {
          const r = Math.round(primitive.value.r * 255);
          const g = Math.round(primitive.value.g * 255);
          const b = Math.round(primitive.value.b * 255);
          
          // Validate RGB values
          if (isNaN(r) || isNaN(g) || isNaN(b)) {
            console.error(`[brand-generator convertToGeneratedVariables] Invalid RGB in alias chain for ${entry.name}:`, primitive.value);
            previewValue = undefined;
          } else {
            previewValue = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          }
        }
      }
      
      converted.push({
        name: entry.name,
        collection: entry.collectionName,
        mode: entry.modeName,
        value: previewValue,
        aliasTo: entry.aliasToName ? {
          paletteId: '',  // Not applicable for multi-layer
          paletteName: entry.aliasToName,
          step: entry.metadata.step || 600,
          scale: entry.metadata.scale || 'Bold'
        } : undefined,
        type: 'color',
        scopes: ['ALL_SCOPES'],
        isAliased,
        sourceScale: entry.metadata.scale,
        sourcePalette: entry.collectionName
      });
    }
    
    return converted;
  }

  /**
   * Static method to generate a complete brand
   */
  public static generateBrand(brand: Brand): GeneratedBrand {
    const generator = new BrandGenerator(brand);
    return generator.generate();
  }

  /**
   * Static method to preview generation
   */
  public static previewBrand(brand: Brand) {
    const generator = new BrandGenerator(brand);
    return generator.preview();
  }
  
  /**
   * Static method to generate with layer mappings (single brand)
   */
  public static generateBrandWithLayers(brand: Brand): GeneratedBrand {
    const generator = new BrandGenerator(brand);
    return generator.generateWithLayers();
  }
  
  /**
   * Static method to generate all brands with layer mappings (multi-brand)
   * Generates shared layers once, then per-brand and aggregate layers
   * 
   * @param brands - Array of all brands to generate
   * @returns GeneratedBrand with variables from all brands
   */
  public static generateAllBrandsWithLayers(brands: Brand[]): GeneratedBrand {
    console.log('=== Multi-Brand Variable Generation Started ===');
    console.log(`Generating variables for ${brands.length} brands`);
    
    if (brands.length === 0) {
      console.warn('[BrandGenerator] No brands provided for generation');
      return {
        brand: { id: '', name: 'Empty', colors: {} as BrandColors, createdAt: Date.now(), updatedAt: Date.now(), version: 1 },
        variables: [],
        statistics: { totalVariables: 0, collections: [], modes: [], paletteUsage: {}, contrastIssues: 0, aliasDepth: 0 },
        validation: { valid: true, errors: [], warnings: ['No brands to generate'], info: [] }
      };
    }
    
    // Use first brand as primary for structure (all brands share same layer structure)
    const primaryBrand = brands[0];
    const registry = new VariableRegistry();
    const layerConfig = useLayerMappingStore.getState().config;
    const enabledLayers = getEnabledLayers(layerConfig);
    
    console.log(`Generating ${enabledLayers.length} enabled layers`);
    
    const validation: ValidationResult = { valid: true, errors: [], warnings: [], info: [] };
    
    // Generate each layer in order
    for (const layer of enabledLayers) {
      console.log(`\nGenerating Layer ${layer.order}: ${layer.displayName}`);
      
      try {
        let layerVariables: VariableEntry[] = [];
        
        // For layers 0-5 (shared layers): generate once using primary brand
        if (layer.order <= 5) {
          const generator = new BrandGenerator(primaryBrand).createLayerGenerator(layer, registry);
          layerVariables = generator.generate();
        }
        // For layer 6 (Appearance): generate per brand
        else if (layer.id === 'appearance') {
          for (const brand of brands) {
            const generator = new BrandGenerator(brand).createLayerGenerator(layer, registry);
            const brandVars = generator.generate();
            layerVariables.push(...brandVars);
          }
        }
        // For layers 7-8 (Theme, Brand): aggregate all brands
        else if (layer.id === 'theme' || layer.id === 'brand') {
          // Pass all brands to these generators
          const generator = new BrandGenerator(primaryBrand).createLayerGeneratorMultiBrand(layer, registry, brands);
          layerVariables = generator.generate();
        }
        // Default: use primary brand
        else {
          const generator = new BrandGenerator(primaryBrand).createLayerGenerator(layer, registry);
          layerVariables = generator.generate();
        }
        
        // Register all variables in the registry
        layerVariables.forEach(v => registry.register(v));
        
        console.log(`✓ Generated ${layerVariables.length} variables for ${layer.displayName}`);
      } catch (error) {
        console.error(`✗ Error generating ${layer.displayName}:`, error);
        validation.errors.push(`Failed to generate ${layer.displayName}: ${error}`);
      }
    }
    
    // Get statistics from registry
    const stats = registry.getStatistics();
    console.log('\n=== Generation Statistics ===');
    console.log(`Total variables: ${stats.totalVariables}`);
    console.log(`Max alias depth: ${stats.maxAliasDepth}`);
    console.log('Variables by layer:', stats.variablesByLayer);
    
    // Convert registry entries to GeneratedVariable format
    const generator = new BrandGenerator(primaryBrand);
    const allVariables = generator.convertToGeneratedVariables(registry);
    
    // Build statistics
    const statistics: BrandStatistics = {
      totalVariables: allVariables.length,
      collections: Object.keys(stats.variablesByCollection),
      modes: brands.map(b => b.name),
      paletteUsage: {},
      contrastIssues: 0,
      aliasDepth: stats.maxAliasDepth
    };
    
    validation.valid = validation.errors.length === 0;
    validation.info.push(`Generated ${allVariables.length} variables across ${enabledLayers.length} layers for ${brands.length} brands`);
    validation.info.push(`Maximum alias depth: ${stats.maxAliasDepth}`);
    
    console.log('=== Multi-Brand Variable Generation Complete ===\n');
    
    return {
      brand: primaryBrand, // Return primary brand as reference
      variables: allVariables,
      statistics,
      validation
    };
  }
}

/**
 * Utility to get variable count estimate
 */
export function estimateVariableCount(appearanceContexts: number): number {
  // Each appearance context: 24 steps × 8 scales = 192 variables
  return appearanceContexts * 24 * 8;
}

/**
 * Utility to format variable name
 */
export function formatVariableName(
  brandName: string,
  appearance: string,
  scale: string
): string {
  return `${brandName}/${appearance}/[${appearance.toLowerCase()}] ${scale}`;
}
