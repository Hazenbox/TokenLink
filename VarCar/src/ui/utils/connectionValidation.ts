/**
 * Utilities for validating connections during drag operations
 */

import { VariableGraph } from '../../models/graph';

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Parse handle ID to extract variable and mode IDs
 */
export function parseHandleId(handleId: string): { variableId: string; modeId: string; type: 'source' | 'target' } | null {
  const parts = handleId.split('-');
  if (parts.length < 3) return null;
  
  const type = parts[parts.length - 1] as 'source' | 'target';
  const modeId = parts[parts.length - 2];
  const variableId = parts.slice(0, -2).join('-');
  
  return { variableId, modeId, type };
}

/**
 * Validate if a connection between two handles is allowed
 */
export function validateConnection(
  sourceHandleId: string,
  targetHandleId: string,
  graph: VariableGraph
): ValidationResult {
  const source = parseHandleId(sourceHandleId);
  const target = parseHandleId(targetHandleId);

  if (!source || !target) {
    return { isValid: false, reason: 'Invalid handle' };
  }

  // Can't connect to the same variable
  if (source.variableId === target.variableId) {
    return { isValid: false, reason: 'Cannot create alias to the same variable' };
  }

  // Get variables
  const sourceVariable = graph.variables.get(source.variableId);
  const targetVariable = graph.variables.get(target.variableId);

  if (!sourceVariable || !targetVariable) {
    return { isValid: false, reason: 'Variable not found' };
  }

  // Check if modes exist
  const sourceMode = sourceVariable.modes.find(m => m.id === source.modeId);
  const targetMode = targetVariable.modes.find(m => m.id === target.modeId);

  if (!sourceMode || !targetMode) {
    return { isValid: false, reason: 'Mode not found' };
  }

  // Check if alias already exists
  const aliasExists = graph.aliases.some(alias => {
    return alias.fromVariableId === source.variableId &&
           alias.toVariableId === target.variableId &&
           alias.modeMap[source.modeId] === target.modeId;
  });

  if (aliasExists) {
    return { isValid: false, reason: 'Alias already exists' };
  }

  // Type compatibility check (optional - can be enhanced)
  if (sourceVariable.variableType && targetVariable.variableType) {
    if (sourceVariable.variableType !== targetVariable.variableType) {
      return { isValid: false, reason: `Type mismatch: ${sourceVariable.variableType} → ${targetVariable.variableType}` };
    }
  }

  // Check for circular dependency
  if (wouldCreateCycle(source.variableId, target.variableId, graph)) {
    return { isValid: false, reason: 'Would create circular dependency' };
  }

  return { isValid: true };
}

/**
 * Check if creating an alias would create a circular dependency
 */
function wouldCreateCycle(sourceId: string, targetId: string, graph: VariableGraph): boolean {
  const visited = new Set<string>();
  const queue: string[] = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current === sourceId) {
      return true; // Found a cycle
    }

    if (visited.has(current)) continue;
    visited.add(current);

    // Find all aliases where current is the source
    const outgoingAliases = graph.aliases.filter(a => a.fromVariableId === current);
    outgoingAliases.forEach(alias => {
      if (!visited.has(alias.toVariableId)) {
        queue.push(alias.toVariableId);
      }
    });
  }

  return false;
}

/**
 * Get all valid and invalid target handles for a given source handle
 */
export function getTargetHandleValidation(
  sourceHandleId: string,
  graph: VariableGraph
): { validTargets: Set<string>; invalidTargets: Map<string, string> } {
  const validTargets = new Set<string>();
  const invalidTargets = new Map<string, string>();

  const source = parseHandleId(sourceHandleId);
  if (!source) {
    return { validTargets, invalidTargets };
  }

  // Check all variables and their modes
  graph.variables.forEach(variable => {
    variable.modes.forEach(mode => {
      const targetHandleId = `${variable.id}-${mode.id}-target`;
      const validation = validateConnection(sourceHandleId, targetHandleId, graph);
      
      if (validation.isValid) {
        validTargets.add(targetHandleId);
      } else if (validation.reason) {
        invalidTargets.set(targetHandleId, validation.reason);
      }
    });
  });

  return { validTargets, invalidTargets };
}
