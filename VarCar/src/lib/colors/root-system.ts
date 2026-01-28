/**
 * Root System Logic
 * 
 * Implements the Root offset system used in Figma's multi-collection architecture.
 * This creates a semantic abstraction where "Root", "Root +1", "Root +2" etc.
 * represent "steps darker" that automatically adapt to Light/Dark modes.
 * 
 * Key Principles:
 * - Light Mode: Root = 2500 (lightest), Root +1 = 2400 (darker), direction = -1
 * - Dark Mode: Root = 200 (darkest for dark bg), Root +1 = 300 (lighter), direction = +1
 * - This keeps semantic consistency: "Surface" is always light, "Bold" is always dark
 */

import { Step, STEPS } from './color-utils';

/**
 * Get the Root step for a given mode
 * 
 * @param isLight - Whether this is light mode
 * @returns Root step: 2500 for light, 200 for dark
 */
export function getRootStep(isLight: boolean): Step {
  return isLight ? 2500 : 200;
}

/**
 * Get the direction multiplier for Root offsets
 * 
 * @param isLight - Whether this is light mode
 * @returns -1 for light (going darker = lower numbers), +1 for dark (going darker = higher numbers)
 */
export function getRootDirection(isLight: boolean): -1 | 1 {
  return isLight ? -1 : 1;
}

/**
 * Get step index in the STEPS array
 */
export function getStepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

/**
 * Get step from index, clamped to valid range
 */
export function getStepFromIndex(index: number): Step {
  const clampedIndex = Math.max(0, Math.min(STEPS.length - 1, index));
  return STEPS[clampedIndex];
}

/**
 * Calculate a Root offset step
 * 
 * @param root - The Root step to start from
 * @param offset - Number of steps to offset (positive = darker)
 * @param isLight - Whether this is light mode
 * @returns The calculated step
 * 
 * @example
 * // Light mode
 * getRootOffset(2500, 0, true)  // → 2500 (Root)
 * getRootOffset(2500, 1, true)  // → 2400 (Root +1, one step darker)
 * getRootOffset(2500, 2, true)  // → 2300 (Root +2, two steps darker)
 * 
 * // Dark mode
 * getRootOffset(200, 0, false)  // → 200 (Root)
 * getRootOffset(200, 1, false)  // → 300 (Root +1, one step darker)
 * getRootOffset(200, 2, false)  // → 400 (Root +2, two steps darker)
 */
export function getRootOffset(root: Step, offset: number, isLight: boolean): Step {
  const rootIndex = getStepIndex(root);
  const direction = getRootDirection(isLight);
  const targetIndex = rootIndex + (offset * direction);
  return getStepFromIndex(targetIndex);
}

/**
 * Calculate Root offset label for display (e.g., "root", "root+1", "root-1")
 * 
 * @param rootStep - The Root step
 * @param currentStep - The current step to label
 * @returns Label string like "root", "root+1", "root-1"
 */
export function getRootOffsetLabel(rootStep: Step, currentStep: Step): string {
  const rootIndex = getStepIndex(rootStep);
  const currentIndex = getStepIndex(currentStep);
  
  const offset = currentIndex - rootIndex;
  
  if (offset === 0) return 'root';
  if (offset > 0) return `root+${offset}`;
  return `root${offset}`; // negative numbers already have minus sign
}

/**
 * Get Root offset for Fill Emphasis variants
 * These define the base surface colors for each emphasis level
 */
export interface FillEmphasisRoots {
  ghost: Step;      // Same as surface (Root +0)
  minimal: Step;    // One step from surface (Root +1)
  subtle: Step;     // Two steps from surface (Root +2)
  bold: Step;       // Custom calculation based on contrast
}

/**
 * Calculate Fill Emphasis root steps
 * 
 * @param surfaceStep - The surface step to base calculations on
 * @param isLight - Whether this is light mode
 * @returns Object with root steps for each emphasis level
 */
export function getFillEmphasisRoots(surfaceStep: Step, isLight: boolean): FillEmphasisRoots {
  return {
    ghost: surfaceStep,                              // Root +0
    minimal: getRootOffset(surfaceStep, 1, isLight), // Root +1
    subtle: getRootOffset(surfaceStep, 2, isLight),  // Root +2
    bold: surfaceStep // Placeholder - actual Bold uses contrast calculation
  };
}

/**
 * Get Root offset for Interaction State variants
 * These define how interactive states progress from idle
 */
export interface InteractionStateOffsets {
  idle: number;     // 0 (same as root)
  hover: number;    // +1 (one step darker)
  pressed: number;  // +2 (two steps darker)
  focus: number;    // 0 (same as idle, but with focus ring)
}

/**
 * Get standard interaction state offsets
 * 
 * @returns Object with offset values for each interaction state
 */
export function getInteractionStateOffsets(): InteractionStateOffsets {
  return {
    idle: 0,
    hover: 1,
    pressed: 2,
    focus: 0
  };
}

/**
 * Calculate interaction state steps from a root
 * 
 * @param root - The root step to base interactions on
 * @param isLight - Whether this is light mode
 * @returns Object with steps for each interaction state
 */
export function getInteractionStateSteps(root: Step, isLight: boolean) {
  const offsets = getInteractionStateOffsets();
  
  return {
    idle: getRootOffset(root, offsets.idle, isLight),
    hover: getRootOffset(root, offsets.hover, isLight),
    pressed: getRootOffset(root, offsets.pressed, isLight),
    focus: getRootOffset(root, offsets.focus, isLight)
  };
}

/**
 * Get Background Level root offsets
 * These define surface elevation in the UI
 */
export interface BackgroundLevelRoots {
  level0: Step;    // Default background (Root)
  level1: Step;    // Elevated by 1 step
  level2: Step;    // Elevated by 2 steps
  bold: Step;      // Bold background (custom)
  elevated: Step;  // Highest elevation
}

/**
 * Calculate Background Level root steps
 * 
 * @param baseRoot - The base root step (usually 2500 for light, 200 for dark)
 * @param isLight - Whether this is light mode
 * @returns Object with root steps for each background level
 */
export function getBackgroundLevelRoots(baseRoot: Step, isLight: boolean): BackgroundLevelRoots {
  return {
    level0: baseRoot,                                // Root +0
    level1: getRootOffset(baseRoot, 1, isLight),     // Root +1
    level2: getRootOffset(baseRoot, 2, isLight),     // Root +2
    bold: baseRoot,                                  // Placeholder
    elevated: isLight ? 2500 : 300                   // Special case
  };
}

/**
 * Generate Root variable name for Color Mode collection
 * 
 * @param colorFamily - Color family name (e.g., "Grey", "Indigo")
 * @param offset - Root offset (0 = "Root", 1 = "Root +1", etc.)
 * @param scaleType - Scale type (Surface, High, Medium, etc.)
 * @returns Variable name like "Grey/Semi semantics/Root/[Colour Mode] Surface"
 */
export function generateRootVariableName(
  colorFamily: string,
  offset: number,
  scaleType: string
): string {
  const rootLabel = offset === 0 ? 'Root' : `Root +${offset}`;
  return `${colorFamily}/Semi semantics/${rootLabel}/[Colour Mode] ${scaleType}`;
}

/**
 * Calculate the target semi-semantic variable name for a Root alias
 * 
 * @param colorFamily - Color family name (e.g., "Grey", "Indigo")
 * @param offset - Root offset
 * @param scaleType - Scale type
 * @param isLight - Whether this is light mode
 * @returns Semi-semantic variable name like "Grey/2500/Surface" or "Grey/300/Surface"
 */
export function getRootTargetVariable(
  colorFamily: string,
  offset: number,
  scaleType: string,
  isLight: boolean
): string {
  const root = getRootStep(isLight);
  const targetStep = getRootOffset(root, offset, isLight);
  return `${colorFamily}/${targetStep}/${scaleType}`;
}
