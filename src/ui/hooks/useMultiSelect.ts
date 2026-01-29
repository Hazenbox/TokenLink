/**
 * Hook for managing multi-select state of nodes and modes
 */

import { useState, useCallback } from 'react';

export interface MultiSelectState {
  selectedNodes: Set<string>;
  selectedModes: Map<string, Set<string>>; // variableId -> Set of modeIds
}

export function useMultiSelect() {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedModes, setSelectedModes] = useState<Map<string, Set<string>>>(new Map());

  // Toggle node selection
  const toggleNodeSelection = useCallback((nodeId: string, isMultiSelect: boolean) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        // Also remove all modes from this node
        setSelectedModes(prevModes => {
          const newModes = new Map(prevModes);
          newModes.delete(nodeId);
          return newModes;
        });
      } else {
        if (!isMultiSelect) {
          newSet.clear();
          setSelectedModes(new Map());
        }
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  // Toggle mode selection
  const toggleModeSelection = useCallback((nodeId: string, modeId: string, isMultiSelect: boolean) => {
    setSelectedModes(prev => {
      const newModes = new Map(prev);
      
      if (!isMultiSelect) {
        // Clear all selections
        newModes.clear();
        setSelectedNodes(new Set());
      }

      const nodeModes = newModes.get(nodeId) || new Set();
      if (nodeModes.has(modeId)) {
        nodeModes.delete(modeId);
        if (nodeModes.size === 0) {
          newModes.delete(nodeId);
        } else {
          newModes.set(nodeId, nodeModes);
        }
      } else {
        nodeModes.add(modeId);
        newModes.set(nodeId, nodeModes);
      }
      
      return newModes;
    });
  }, []);

  // Select all
  const selectAll = useCallback((allNodeIds: string[]) => {
    setSelectedNodes(new Set(allNodeIds));
    setSelectedModes(new Map());
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
    setSelectedModes(new Map());
  }, []);

  // Check if node is selected
  const isNodeSelected = useCallback((nodeId: string) => {
    return selectedNodes.has(nodeId);
  }, [selectedNodes]);

  // Check if mode is selected
  const isModeSelected = useCallback((nodeId: string, modeId: string) => {
    const nodeModes = selectedModes.get(nodeId);
    return nodeModes ? nodeModes.has(modeId) : false;
  }, [selectedModes]);

  // Get selection count
  const getSelectionCount = useCallback(() => {
    let count = selectedNodes.size;
    selectedModes.forEach(modes => {
      count += modes.size;
    });
    return count;
  }, [selectedNodes, selectedModes]);

  // Get all selected items
  const getSelectedItems = useCallback(() => {
    const items: Array<{ type: 'node' | 'mode'; nodeId: string; modeId?: string }> = [];
    
    selectedNodes.forEach(nodeId => {
      items.push({ type: 'node', nodeId });
    });
    
    selectedModes.forEach((modes, nodeId) => {
      modes.forEach(modeId => {
        items.push({ type: 'mode', nodeId, modeId });
      });
    });
    
    return items;
  }, [selectedNodes, selectedModes]);

  return {
    selectedNodes,
    selectedModes,
    toggleNodeSelection,
    toggleModeSelection,
    selectAll,
    clearSelection,
    isNodeSelected,
    isModeSelected,
    getSelectionCount,
    getSelectedItems,
  };
}
