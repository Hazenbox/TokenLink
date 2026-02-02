/**
 * Palette Categorization Utilities
 * 
 * Handles automatic categorization of color palettes into Core, Functional, and Extended
 * primitive collections to manage Figma's 5,000 variable per collection limit.
 * 
 * Based on industry standards from Vodafone UK, Google Material, IBM Carbon, and Atlassian.
 */

export type PaletteCategory = 'core' | 'functional' | 'extended';

/**
 * Figma collection names for the three primitive collections
 */
export const COLLECTION_NAMES: Record<PaletteCategory, string> = {
  core: '00_Primitives_Core',
  functional: '00_Primitives_Functional',
  extended: '00_Primitives_Extended',
};

/**
 * User-friendly descriptions for each category
 */
export const CATEGORY_DESCRIPTIONS: Record<PaletteCategory, string> = {
  core: 'Neutrals and primary brand colors',
  functional: 'Status and feedback colors',
  extended: 'Accent and secondary colors',
};

/**
 * Keywords used to identify functional/status colors
 */
const FUNCTIONAL_KEYWORDS = [
  'success',
  'error',
  'warning',
  'info',
  'positive',
  'negative',
  'caution',
  'informative',
  'danger',
  'alert',
] as const;

/**
 * Keywords used to identify core/neutral/primary colors
 */
const CORE_KEYWORDS = [
  'grey',
  'gray',
  'neutral',
  'white',
  'black',
  'primary',
  'brand',
  'base',
  'greyscale',
  'grayscale',
] as const;

/**
 * Constants for Figma variable limits and calculations
 */
export const VARIABLES_PER_PALETTE = 192; // 24 steps × 8 scales
export const FIGMA_VARIABLE_LIMIT = 5000;
export const MAX_PALETTES_PER_COLLECTION = Math.floor(
  FIGMA_VARIABLE_LIMIT / VARIABLES_PER_PALETTE
); // 26 palettes

/**
 * Categorize a palette based on its name
 * 
 * @param paletteName - The name of the palette to categorize
 * @returns The category ('core', 'functional', or 'extended')
 * 
 * @example
 * categorizePalette('Grey') // 'core'
 * categorizePalette('Success') // 'functional'
 * categorizePalette('Rose gold') // 'extended'
 */
export function categorizePalette(paletteName: string): PaletteCategory {
  const nameLower = paletteName.toLowerCase();
  
  // Check functional keywords first (more specific)
  if (FUNCTIONAL_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return 'functional';
  }
  
  // Check core keywords
  if (CORE_KEYWORDS.some(keyword => nameLower.includes(keyword))) {
    return 'core';
  }
  
  // Default to extended for everything else
  return 'extended';
}

/**
 * Calculate the total number of variables for a given palette count
 * 
 * @param paletteCount - Number of palettes
 * @returns Total number of variables (palette count × 192)
 */
export function calculateVariableCount(paletteCount: number): number {
  return paletteCount * VARIABLES_PER_PALETTE;
}

/**
 * Group palettes by their category
 * 
 * @param palettes - Array of palettes with id and name
 * @returns Object with palettes grouped by category
 */
export function groupPalettesByCategory(
  palettes: Array<{ id: string; name: string }>
): Record<PaletteCategory, Array<{ id: string; name: string }>> {
  const grouped: Record<PaletteCategory, Array<{ id: string; name: string }>> = {
    core: [],
    functional: [],
    extended: [],
  };
  
  palettes.forEach(palette => {
    const category = categorizePalette(palette.name);
    grouped[category].push(palette);
  });
  
  return grouped;
}

/**
 * Check if a set of palette counts would exceed Figma's limits
 * 
 * @param counts - Variable counts per category
 * @returns Object indicating which categories exceed the limit
 */
export function checkLimits(counts: Record<PaletteCategory, number>): {
  hasOverLimit: boolean;
  overLimit: PaletteCategory[];
  warnings: PaletteCategory[];
} {
  const overLimit: PaletteCategory[] = [];
  const warnings: PaletteCategory[] = [];
  
  (Object.keys(counts) as PaletteCategory[]).forEach(category => {
    const count = counts[category];
    if (count > FIGMA_VARIABLE_LIMIT) {
      overLimit.push(category);
    } else if (count > 4900) {
      warnings.push(category);
    }
  });
  
  return {
    hasOverLimit: overLimit.length > 0,
    overLimit,
    warnings,
  };
}

/**
 * Get a user-friendly label for a category
 */
export function getCategoryLabel(category: PaletteCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Get color scheme for category (for UI display)
 */
export function getCategoryColor(category: PaletteCategory): {
  bg: string;
  text: string;
  badge: string;
} {
  switch (category) {
    case 'core':
      return {
        bg: 'bg-slate-50 dark:bg-slate-900',
        text: 'text-slate-700 dark:text-slate-300',
        badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      };
    case 'functional':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300',
      };
    case 'extended':
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300',
      };
  }
}
