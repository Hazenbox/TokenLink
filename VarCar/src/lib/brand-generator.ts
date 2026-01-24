/**
 * Brand Generator
 * Generates complete variable sets from brand configuration and RangDe palettes
 */

import { Brand, GeneratedVariable, GeneratedBrand, BrandStatistics, ValidationResult } from "@/models/brand";
import { usePaletteStore } from "@/store/palette-store";
import { generateAllScales } from "@/lib/colors/scale-generator";
import { Step, STEPS } from "@/lib/colors/color-utils";

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

    // Generate scales for all steps
    const allScales = generateAllScales(palette.steps, palette.primaryStep);

    // Create variables for each step and scale
    for (const step of STEPS) {
      const stepScales = allScales[step];
      if (!stepScales) continue;

      for (const scaleName of SCALE_NAMES) {
        const scaleKey = SCALE_KEY_MAP[scaleName];
        const scaleResult = (stepScales as any)[scaleKey];
        
        if (!scaleResult || !scaleResult.hex) continue;

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

        const variable: GeneratedVariable = {
          name: variableName,
          collection: '9 Theme',
          mode: this.brand.name,
          value: scaleResult.hex,
          type: 'color',
          scopes: ['ALL_SCOPES'],
          sourceScale: scaleName,
          sourcePalette: paletteRef.paletteName
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
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // Check required palette assignments
    const requiredRoles = ['primary', 'secondary', 'sparkle', 'neutral'] as const;
    for (const role of requiredRoles) {
      if (!brand.colors[role].paletteId) {
        errors.push(`Missing ${role} palette assignment`);
      }
    }

    // Check semantic colors
    const semanticRoles = ['positive', 'negative', 'warning', 'informative'] as const;
    for (const role of semanticRoles) {
      if (!brand.colors.semantic[role].paletteId) {
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
      brand.colors.semantic.positive,
      brand.colors.semantic.negative,
      brand.colors.semantic.warning,
      brand.colors.semantic.informative
    ];

    for (const ref of allPaletteRefs) {
      if (ref.paletteId && !paletteStore.palettes.find((p) => p.id === ref.paletteId)) {
        errors.push(`Palette "${ref.paletteName}" not found in RangDe`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info
    };
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
