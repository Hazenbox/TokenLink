/**
 * Hierarchical Groups Sidebar
 * Displays multi-level accordion for hierarchical variable navigation
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronsUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { HierarchyParser, HierarchyNode } from '@/lib/hierarchy-parser';
import { SidebarItem } from '../common/SidebarItem';

interface HierarchicalGroupsSidebarProps {
  onCreateGroup?: () => void;
}

// Memoized HierarchyNodeItem component to prevent inline arrow functions in map
interface HierarchyNodeItemProps {
  node: HierarchyNode;
  hasChildren: boolean;
  isSelected: boolean;
  isAncestor: boolean;
  isExpanded: boolean;
  expandedHierarchyNodes: Set<string>;
  onNodeClick: (node: HierarchyNode, hasChildren: boolean) => void;
  onChevronClick: (fullPath: string, e: React.MouseEvent) => void;
  isPathSelected: (path: string[]) => boolean;
  isAncestorOfSelected: (path: string[]) => boolean;
}

const HierarchyNodeItem = React.memo(function HierarchyNodeItem({
  node,
  hasChildren,
  isSelected,
  isAncestor,
  isExpanded,
  expandedHierarchyNodes,
  onNodeClick,
  onChevronClick,
  isPathSelected,
  isAncestorOfSelected
}: HierarchyNodeItemProps) {
  const indentLevel = node.level;
  const paddingLeft = 4 + (indentLevel * 6); // 4px base + 6px per level
  
  return (
    <div style={{ paddingLeft: `${Math.max(0, paddingLeft - 4)}px` }}>
      <SidebarItem
        isActive={isSelected}
        onClick={() => onNodeClick(node, hasChildren)}
        className={isAncestor && !isSelected ? 'bg-surface/20' : ''}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Chevron for expandable nodes */}
          {hasChildren ? (
            <div 
              className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-foreground-tertiary"
              onClick={(e) => onChevronClick(node.fullPath, e)}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </div>
          ) : (
            <div className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          
          {/* Node name */}
          <div className={`font-normal truncate ${isSelected ? 'text-foreground' : 'text-foreground-secondary'}`}>
            {node.name}
          </div>
        </div>
        
        {/* Variable count badge */}
        <div className="text-[10px] text-foreground-tertiary flex-shrink-0">
          {node.variableCount}
        </div>
      </SidebarItem>
      
      {/* Children (if expanded) */}
      {hasChildren && isExpanded && (
        <div>
          {Array.from(node.children.values())
            .sort((a, b) => {
              // Sort: numeric steps descending, then alphabetically
              const aNum = parseInt(a.name);
              const bNum = parseInt(b.name);
              if (!isNaN(aNum) && !isNaN(bNum)) {
                return bNum - aNum; // Descending for numbers (2500, 2400, 2300)
              }
              return a.name.localeCompare(b.name);
            })
            .map(child => {
              const childHasChildren = child.children.size > 0;
              const childIsExpanded = expandedHierarchyNodes.has(child.fullPath);
              const childIsSelected = isPathSelected(child.path);
              const childIsAncestor = isAncestorOfSelected(child.path);
              
              return (
                <HierarchyNodeItem
                  key={child.fullPath}
                  node={child}
                  hasChildren={childHasChildren}
                  isSelected={childIsSelected}
                  isAncestor={childIsAncestor}
                  isExpanded={childIsExpanded}
                  expandedHierarchyNodes={expandedHierarchyNodes}
                  onNodeClick={onNodeClick}
                  onChevronClick={onChevronClick}
                  isPathSelected={isPathSelected}
                  isAncestorOfSelected={isAncestorOfSelected}
                />
              );
            })}
        </div>
      )}
    </div>
  );
});

export function HierarchicalGroupsSidebar({ onCreateGroup }: HierarchicalGroupsSidebarProps) {
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const hierarchyPath = useVariablesViewStore((state) => state.hierarchyPath);
  const setHierarchyPath = useVariablesViewStore((state) => state.setHierarchyPath);
  const expandedHierarchyNodes = useVariablesViewStore((state) => state.expandedHierarchyNodes);
  const toggleHierarchyNode = useVariablesViewStore((state) => state.toggleHierarchyNode);
  const expandAllHierarchyNodes = useVariablesViewStore((state) => state.expandAllHierarchyNodes);
  const collapseAllHierarchyNodes = useVariablesViewStore((state) => state.collapseAllHierarchyNodes);
  
  // Get variables for current collection
  const allVariablesMap = useBrandStore((state) => state.figmaVariablesByCollection, shallow);
  
  // Build hierarchy tree from variables
  const hierarchyTree = useMemo(() => {
    const variables = allVariablesMap.get(activeCollectionId || '') || [];
    return HierarchyParser.buildTree(variables);
  }, [allVariablesMap, activeCollectionId]);
  
  // Calculate total count for "All" option
  const totalCount = useMemo(() => 
    HierarchyParser.getTotalVariableCount(hierarchyTree),
    [hierarchyTree]
  );
  
  // Check if current path is selected
  const isPathSelected = (path: string[]): boolean => {
    if (hierarchyPath.length !== path.length) return false;
    return path.every((segment, index) => hierarchyPath[index] === segment);
  };
  
  // Check if a path is ancestor of selected path
  const isAncestorOfSelected = (path: string[]): boolean => {
    if (path.length >= hierarchyPath.length) return false;
    return path.every((segment, index) => hierarchyPath[index] === segment);
  };
  
  // Create stable callbacks to prevent new function references on every render
  const handleNodeClick = useCallback((node: HierarchyNode, hasChildren: boolean) => {
    if (hasChildren) {
      // Toggle expansion if has children
      toggleHierarchyNode(node.fullPath);
    }
    // Set as active filter
    setHierarchyPath(node.path);
  }, [toggleHierarchyNode, setHierarchyPath]);
  
  const handleChevronClick = useCallback((fullPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleHierarchyNode(fullPath);
  }, [toggleHierarchyNode]);
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-9 px-3 py-1.5 border-b border-border/30 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-foreground-secondary">
          Groups
        </span>
        <button
          onClick={() => {
            // If any nodes are expanded, collapse all; otherwise expand all
            if (expandedHierarchyNodes.size > 0) {
              collapseAllHierarchyNodes();
            } else {
              const allPaths = HierarchyParser.flattenTree(hierarchyTree).map(node => node.fullPath);
              expandAllHierarchyNodes(allPaths);
            }
          }}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-interactive-hover text-foreground-tertiary hover:text-foreground-secondary transition-colors"
          title={expandedHierarchyNodes.size > 0 ? "Collapse All" : "Expand All"}
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* All Option */}
      <div className="px-2 pt-2">
        <SidebarItem 
          isActive={hierarchyPath.length === 0} 
          onClick={() => setHierarchyPath([])}
        >
          <div className="flex-1 min-w-0">
            <div className={`font-normal truncate ${hierarchyPath.length === 0 ? 'text-foreground' : 'text-foreground-secondary'}`}>
              All
            </div>
          </div>
          <div className="text-[10px] text-foreground-tertiary flex-shrink-0">
            {totalCount}
          </div>
        </SidebarItem>
      </div>
      
      {/* Hierarchy tree */}
      <ScrollArea className="flex-1" style={{ overflowX: 'auto' }}>
        <div className="px-2 pt-1 pb-2 space-y-0.5 min-w-max">
          {Array.from(hierarchyTree.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(node => {
              const hasChildren = node.children.size > 0;
              const isExpanded = expandedHierarchyNodes.has(node.fullPath);
              const isSelected = isPathSelected(node.path);
              const isAncestor = isAncestorOfSelected(node.path);
              
              return (
                <HierarchyNodeItem
                  key={node.fullPath}
                  node={node}
                  hasChildren={hasChildren}
                  isSelected={isSelected}
                  isAncestor={isAncestor}
                  isExpanded={isExpanded}
                  expandedHierarchyNodes={expandedHierarchyNodes}
                  onNodeClick={handleNodeClick}
                  onChevronClick={handleChevronClick}
                  isPathSelected={isPathSelected}
                  isAncestorOfSelected={isAncestorOfSelected}
                />
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
}
