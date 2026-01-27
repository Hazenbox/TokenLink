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
 * Brand configuration
 */
export interface Brand {
  id: string;
  name: string;
  colors: BrandColors;
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
 * Figma Variables UI Types
 * Types for presenting VarCar data in Figma's Variables UI paradigm
 */

/**
 * Figma Mode - represents different contexts for variable values
 */
export interface FigmaMode {
  id: string;
  name: string; // "Surface", "High", "Medium", "Low", "Heavy", "Bold", "Bold A11Y", "Minimal"
}

/**
 * Figma Collection - represents a group of variables with shared modes
 */
export interface FigmaCollection {
  id: string;
  name: string;
  modes: FigmaMode[];
  defaultModeId: string;
  variableCount: number;
}

/**
 * Figma Group - represents a color group for organizing variables
 */
export interface FigmaGroup {
  id: string;
  name: string; // "Indigo", "Grey", "Green", etc.
  collectionId: string;
  variableCount: number;
}

/**
 * Figma Variable Value - can be direct color or alias
 */
export interface FigmaVariableValue {
  type: 'COLOR';
  value?: string; // Direct hex
  aliasTo?: { variableId: string; modeId: string }; // Alias reference
}

/**
 * Figma Variable - single variable with multiple mode values
 */
export interface FigmaVariable {
  id: string;
  name: string; // "[Primary] Indigo 200"
  groupId: string;
  collectionId: string;
  valuesByMode: Record<string, FigmaVariableValue>; // modeId → value
  resolvedValuesByMode: Record<string, string>; // modeId → resolved hex color
}
