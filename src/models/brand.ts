/**
 * Brand Automation Types
 * Defines data structures for the brand automation system
 */

import { Step } from "@/lib/colors/color-utils";

/**
 * Reference to a palette in the RangDe system
 */
export interface PaletteReference {
  paletteId: string;
  paletteName: string;
}

/**
 * Semantic color assignments (positive, negative, warning, informative)
 */
export interface SemanticColors {
  positive: PaletteReference;
  negative: PaletteReference;
  warning: PaletteReference;
  informative: PaletteReference;
}

/**
 * All color assignments for a brand
 */
export interface BrandColors {
  primary: PaletteReference;
  secondary: PaletteReference;
  sparkle: PaletteReference;
  neutral: PaletteReference;
  semantic: SemanticColors;
}

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation result for a brand
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Statistics about a brand's variables
 */
export interface BrandStatistics {
  totalVariables: number;
  collections: string[];
  modes: string[];
  paletteUsage: Record<string, number>;
  contrastIssues: number;
  aliasDepth: number;
}

/**
 * Audit log entry for tracking changes
 */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: 'create' | 'update' | 'delete' | 'sync' | 'rollback';
  brandId: string;
  brandName: string;
  userId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Backup snapshot of brand state
 */
export interface BrandBackup {
  id: string;
  timestamp: number;
  brand: Brand;
  metadata: {
    reason: string;
    autoSaved: boolean;
  };
}

/**
 * Brand configuration (Figma File = Design System Project)
 * A Brand acts as a container for multiple collections, similar to a Figma file
 */
export interface Brand {
  id: string;
  name: string;                    // e.g., "OneUI Foundations"
  
  // NEW: Multiple independent collections
  collections?: FigmaCollection[]; // Primitives, Semantic, Theme, Platform, etc.
  
  // DEPRECATED: Single colors (kept for backward compatibility during migration)
  colors?: BrandColors;
  
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  version: number;
  
  // Optional metadata
  description?: string;
  tags?: string[];
  template?: string;
}

/**
 * Alias reference information for variables
 */
export interface AliasReference {
  paletteId: string;
  paletteName: string;
  step: Step;
  scale: string;
}

/**
 * Generated variable information (supports both direct values and aliases)
 */
export interface GeneratedVariable {
  name: string;
  collection: string;
  mode: string;
  value?: string; // Direct hex value (optional if aliased)
  aliasTo?: AliasReference; // Alias reference (optional if direct value)
  type: 'color';
  scopes: string[];
  sourceScale?: string;
  sourcePalette?: string;
  isAliased?: boolean; // Flag to indicate if this is an aliased variable
}

/**
 * Generated brand with all variables
 */
export interface GeneratedBrand {
  brand: Brand;
  variables: GeneratedVariable[];
  statistics: BrandStatistics;
  validation: ValidationResult;
}

/**
 * Sync operation status
 */
export type SyncStatus = 'idle' | 'validating' | 'previewing' | 'syncing' | 'success' | 'error';

/**
 * Sync operation result
 */
export interface SyncResult {
  success: boolean;
  brandId: string;
  timestamp: number;
  variablesSynced: number;
  modesAdded: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Export/Import format for brands
 */
export interface BrandExport {
  version: '1.0';
  exportDate: number;
  brands: Brand[];
  metadata: {
    source: string;
    author?: string;
    description?: string;
  };
}

/**
 * Template for creating new brands
 */
export interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  colors: BrandColors;
  tags: string[];
  isDefault?: boolean;
}

/**
 * Graph node for visualization
 */
export interface BrandGraphNode {
  id: string;
  type: 'collection' | 'variable' | 'alias' | 'value';
  label: string;
  data: any;
  level: number;
}

/**
 * Graph edge for visualization
 */
export interface BrandGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'alias' | 'contains' | 'references';
  label?: string;
}

/**
 * Complete graph structure for visualization
 */
export interface BrandGraph {
  nodes: BrandGraphNode[];
  edges: BrandGraphEdge[];
  statistics: {
    totalNodes: number;
    totalEdges: number;
    maxDepth: number;
    aliasChains: number;
  };
}

/**
 * Figma Variables Architecture (Correct Implementation)
 * Based on official Figma documentation and real-world structure analysis
 */

/**
 * CollectionMode - Mode within a collection
 * Each collection has independent modes (e.g., "Light/Dark", "Neutral/Primary", "MyJio/JioFinance")
 */
export interface CollectionMode {
  modeId: string;        // Unique ID (e.g., "23:2", "mode_neutral")
  name: string;          // Display name (e.g., "Neutral", "Light", "MyJio")
}

/**
 * VariableValueByMode - Variable value for a specific mode
 * Can be direct value or alias to another variable
 */
export interface VariableValueByMode {
  [modeId: string]: {
    type: 'COLOR' | 'ALIAS';
    
    // For direct color values
    value?: string;      // Hex color "#ffffff"
    
    // For aliases (can reference variables in same or different collections)
    aliasId?: string;           // Variable ID being referenced
    aliasCollectionId?: string; // Collection of referenced variable (for cross-collection aliases)
  };
}

/**
 * FigmaVariable - Single design token with values per mode
 * Uses slash-based naming for grouping (e.g., "Grey/2500/Surface")
 */
export interface FigmaVariable {
  id: string;
  name: string;                    // e.g., "Grey/2500/Surface" or "[appearance] Surface"
  description?: string;
  resolvedType: 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';
  valuesByMode: VariableValueByMode;        // Different value per mode
  resolvedValuesByMode: { [modeId: string]: string };  // Resolved final values
  variableCollectionId: string;    // Parent collection
  scopes?: string[];
  codeSyntax?: Record<string, string>;
}

/**
 * FigmaCollection - Independent container with its own modes
 * Multiple collections per brand/project (like real Figma files)
 */
export interface FigmaCollection {
  id: string;
  name: string;                    // e.g., "00_Semi semantics", "1 Appearance"
  modes: CollectionMode[];         // Independent modes for this collection (1-9+)
  defaultModeId: string;
  variableIds: string[];           // All variables in this collection
  remote: boolean;
  hiddenFromPublishing?: boolean;
  
  // VarCar-specific: Collection type classification
  collectionType?: CollectionType;
  generationType?: 'primitives' | 'semantic' | 'component'; // DEPRECATED: use collectionType
  
  // For primitive collections: palette assignments
  paletteAssignments?: {
    [groupName: string]: {       // "Grey", "Indigo", etc.
      paletteId: string;
      paletteName: string;
    };
  };
  
  // For semantic/contextual collections: reference to source collection
  primitiveCollectionId?: string;
  sourceCollectionId?: string; // More general - for any collection referencing another
}

/**
 * Collection Types - All 16 collection types from Figma architecture
 */
export type CollectionType =
  // Foundation layers (actual color values)
  | 'primitives'           // 00_Primitives: Base RGB values (25 vars)
  | 'semi-semantics'       // 00_Semi semantics: Named scales like Grey/2500 (2,688 vars)
  
  // Contextual layers (aliases with Root system)
  | 'color-mode'           // 02 Colour Mode: Light/Dark with Root notation (4,614 vars)
  | 'interaction-state'    // 4 Interaction state: Idle/Hover/Pressed/Focus (2,280 vars)
  | 'background-level'     // 3 Background Level: Surface elevation (442 vars)
  | 'fill-emphasis'        // 2 Fill emphasis: Ghost/Minimal/Subtle/Bold (120 vars)
  | 'appearance'           // 1 Appearance: Semantic contexts (41 vars)
  
  // Theme & Brand layers
  | 'theme'                // 9 Theme: Multi-brand themes (224 vars)
  | 'brand'                // 10 Brand: Brand-specific tokens (618 vars)
  
  // Cross-cutting concerns
  | 'platform'             // 7 Platform: Responsive breakpoints (87 vars)
  | 'density'              // 6 Density: Spacing variants (222 vars)
  | 'language'             // 8 Language: RTL/LTR (37 vars)
  | 'motion'               // 11 Motion: Animation intensity (16 vars)
  | 'disabled'             // 4.5 Disabled: Boolean state (1 var)
  
  // Placeholders
  | 'placeholder';         // X01, X03 placeholders

/**
 * FigmaGroup - Derived from variable names (not a native Figma entity)
 * Groups are extracted from slash-based naming conventions
 */
export interface FigmaGroup {
  id: string;
  name: string;            // "Grey", "Indigo", "[appearance]", etc.
  collectionId: string;
  variableCount: number;
  steps?: string[];        // For primitives: ["2500", "2400", "2300", ...]
}

/**
 * DEPRECATED: Old Figma Mode interface (kept for backward compatibility)
 * @deprecated Use CollectionMode instead
 */
export interface FigmaMode {
  id: string;
  name: string;
}

/**
 * DEPRECATED: Old Figma Variable Value interface (kept for backward compatibility)
 * @deprecated Use VariableValueByMode instead
 */
export interface FigmaVariableValue {
  type: 'COLOR';
  value?: string;
  aliasTo?: { variableId: string; modeId: string };
}
