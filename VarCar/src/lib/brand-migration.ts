/**
 * Brand Migration Utility
 * Migrates legacy brands (single colors) to new multi-collection architecture
 */

import { Brand, FigmaCollection, BrandColors } from '@/models/brand';

/**
 * Legacy Brand interface (for type safety during migration)
 */
interface LegacyBrand extends Omit<Brand, 'collections'> {
  colors: BrandColors;
  collections?: never;
}

/**
 * Check if a brand needs migration
 */
export function needsMigration(brand: Brand): boolean {
  // Brand needs migration if it has colors but no collections
  return !!brand.colors && (!brand.collections || brand.collections.length === 0);
}

/**
 * Migrate legacy brand to new multi-collection architecture
 * 
 * Creates 2 collections:
 * 1. Primitives Collection - Raw palette colors with single mode
 * 2. Appearances Collection - Semantic tokens with 8 modes (one per appearance context)
 */
export function migrateLegacyBrand(oldBrand: LegacyBrand): Brand {
  const brandId = oldBrand.id;
  
  console.log(`[Migration] Migrating legacy brand: ${oldBrand.name}`);
  
  // 1. Primitives Collection (raw scales)
  const primitivesCollection: FigmaCollection = {
    id: `col_${brandId}_primitives`,
    name: `${oldBrand.name} - Primitives`,
    modes: [
      { modeId: 'mode_default', name: 'Default' }
    ],
    defaultModeId: 'mode_default',
    variableIds: [],
    remote: false,
    hiddenFromPublishing: false,
    generationType: 'primitives',
    paletteAssignments: {
      'Neutral': oldBrand.colors.neutral,
      'Primary': oldBrand.colors.primary,
      'Secondary': oldBrand.colors.secondary,
      'Sparkle': oldBrand.colors.sparkle,
      'Positive': oldBrand.colors.semantic.positive,
      'Negative': oldBrand.colors.semantic.negative,
      'Warning': oldBrand.colors.semantic.warning,
      'Informative': oldBrand.colors.semantic.informative
    }
  };
  
  // 2. Appearances Collection (semantic with modes)
  const appearancesCollection: FigmaCollection = {
    id: `col_${brandId}_appearances`,
    name: `${oldBrand.name} - Appearances`,
    modes: [
      { modeId: 'mode_neutral', name: 'Neutral' },
      { modeId: 'mode_primary', name: 'Primary' },
      { modeId: 'mode_secondary', name: 'Secondary' },
      { modeId: 'mode_sparkle', name: 'Sparkle' },
      { modeId: 'mode_positive', name: 'Positive' },
      { modeId: 'mode_negative', name: 'Negative' },
      { modeId: 'mode_warning', name: 'Warning' },
      { modeId: 'mode_informative', name: 'Informative' }
    ],
    defaultModeId: 'mode_neutral',
    variableIds: [],
    remote: false,
    hiddenFromPublishing: false,
    generationType: 'semantic',
    primitiveCollectionId: primitivesCollection.id
  };
  
  const migratedBrand: Brand = {
    ...oldBrand,
    collections: [primitivesCollection, appearancesCollection],
    // Keep colors for backward compatibility
    colors: oldBrand.colors
  };
  
  console.log(`[Migration] Successfully migrated brand with ${migratedBrand.collections?.length || 0} collections`);
  
  return migratedBrand;
}

/**
 * Batch migrate all legacy brands
 */
export function migrateAllLegacyBrands(brands: Brand[]): Brand[] {
  return brands.map(brand => {
    if (needsMigration(brand)) {
      return migrateLegacyBrand(brand as LegacyBrand);
    }
    return brand;
  });
}

/**
 * Get default collection for a brand (backward compatibility helper)
 * Returns the first primitives collection or the first collection
 */
export function getDefaultCollection(brand: Brand): FigmaCollection | null {
  if (!brand.collections || brand.collections.length === 0) {
    return null;
  }
  
  // Prefer primitives collection
  const primitivesCol = brand.collections.find(c => c.generationType === 'primitives');
  if (primitivesCol) {
    return primitivesCol;
  }
  
  // Otherwise return first collection
  return brand.collections[0];
}

/**
 * Get collection by ID
 */
export function getCollectionById(brand: Brand, collectionId: string): FigmaCollection | null {
  if (!brand.collections) return null;
  return brand.collections.find(c => c.id === collectionId) || null;
}

/**
 * Get collection by type
 */
export function getCollectionByType(
  brand: Brand, 
  type: 'primitives' | 'semantic' | 'component'
): FigmaCollection | null {
  if (!brand.collections) return null;
  return brand.collections.find(c => c.generationType === type) || null;
}
