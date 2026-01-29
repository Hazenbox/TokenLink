/**
 * Alias validation utilities
 * Ensures design token hierarchy is maintained (primitives should never be aliased)
 */

import { CollectionType } from '../models/types';

/**
 * Defines the hierarchy level for each collection type
 * Lower numbers = foundation level (should never be aliased)
 * Higher numbers = higher level tokens (can be aliased)
 */
const HIERARCHY_LEVELS: Record<CollectionType, number> = {
  primitive: 0,  // Foundation - raw values, never aliased
  semantic: 1,   // Meaning layer - references primitives
  interaction: 1, // Interaction states - references primitives (same level as semantic)
  theme: 2,      // Theme layer - references semantic
  brand: 1,      // Brand layer - references primitives (same level as semantic)
};

/**
 * Validation result interface
 */
export interface AliasValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Validates if an alias direction follows design token hierarchy rules
 * 
 * Rules:
 * - Primitives should NEVER be aliased (they are the foundation)
 * - Higher level tokens can alias to lower level tokens
 * - Same level tokens can alias to each other (e.g., semantic <-> interaction)
 * 
 * @param sourceCollectionType - The collection type being aliased (loses its value)
 * @param targetCollectionType - The collection type being referenced (keeps its value)
 * @returns Validation result with error message if invalid
 */
export function validateAliasDirection(
  sourceCollectionType: CollectionType,
  targetCollectionType: CollectionType
): AliasValidationResult {
  const sourceLevel = HIERARCHY_LEVELS[sourceCollectionType];
  const targetLevel = HIERARCHY_LEVELS[targetCollectionType];

  // Rule 1: Primitives should NEVER be aliased
  if (sourceCollectionType === 'primitive') {
    return {
      valid: false,
      error: `Cannot create alias: Primitive collections should never be aliased.\n\n` +
             `Primitive tokens must maintain their raw values as the foundation of your design system.\n\n` +
             `Current attempt: ${sourceCollectionType} → ${targetCollectionType}`,
      suggestion: `Reverse the alias direction: ${targetCollectionType} → ${sourceCollectionType}`
    };
  }

  // Rule 2: Cannot alias to a higher level (e.g., primitive cannot alias to semantic)
  // This is redundant with Rule 1 but kept for clarity
  if (sourceLevel < targetLevel) {
    return {
      valid: false,
      error: `Invalid alias direction: Lower-level tokens cannot alias to higher-level tokens.\n\n` +
             `Attempted: ${sourceCollectionType} (level ${sourceLevel}) → ${targetCollectionType} (level ${targetLevel})`,
      suggestion: `Reverse the alias direction: ${targetCollectionType} → ${sourceCollectionType}`
    };
  }

  // Rule 3: Same level or higher-to-lower is valid
  return { valid: true };
}

/**
 * Gets a human-readable explanation of the token hierarchy
 */
export function getHierarchyExplanation(): string {
  return `
Design Token Hierarchy (lowest to highest):

Level 0: Primitive - Raw values (colors, spacing, etc.)
         → Never aliased, always contains actual values
         
Level 1: Semantic/Interaction/Brand - Meaningful tokens
         → Can alias to primitives
         
Level 2: Theme - Theme-specific tokens
         → Can alias to semantic or primitives

Valid alias directions:
✅ Semantic → Primitive
✅ Interaction → Primitive
✅ Brand → Primitive
✅ Theme → Semantic
✅ Theme → Primitive

Invalid alias directions:
❌ Primitive → Semantic
❌ Primitive → Interaction
❌ Primitive → Theme
❌ Primitive → Brand
  `.trim();
}

/**
 * Formats a detailed error message for UI display
 */
export function formatAliasError(
  sourceCollectionType: CollectionType,
  targetCollectionType: CollectionType,
  sourceVariableName?: string,
  targetVariableName?: string
): string {
  const validation = validateAliasDirection(sourceCollectionType, targetCollectionType);
  
  if (validation.valid) {
    return '';
  }

  let message = validation.error || 'Invalid alias direction';
  
  if (sourceVariableName && targetVariableName) {
    message += `\n\nSpecific variables:\n`;
    message += `  Source: ${sourceVariableName} (${sourceCollectionType})\n`;
    message += `  Target: ${targetVariableName} (${targetCollectionType})`;
  }
  
  if (validation.suggestion) {
    message += `\n\n💡 Suggestion: ${validation.suggestion}`;
  }

  return message;
}
