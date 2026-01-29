/**
 * Feature flags for VarCar plugin
 * Use these to enable/disable features for gradual rollout or quick rollback
 */
export const FEATURES = {
  COLORS_TAB: true,          // Main color generation feature
  FIGMA_SYNC: true,          // Sync colors to Figma variables
  SURFACE_STACKING: true,    // Surface stacking preview
  ADVANCED_IMPORT: false     // Advanced import options (future)
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature];
}
