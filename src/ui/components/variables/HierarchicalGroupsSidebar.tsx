/**
 * Hierarchical Groups Sidebar
 * Displays multi-level accordion for hierarchical variable navigation
 */

import React, { useEffect, useMemo, useState } from 'react';
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
  
  // Render a single node
  const renderNode = (node: HierarchyNode): React.ReactNode => {
    const hasChildren = node.children.size > 0;
    const isExpanded = expandedHierarchyNodes.has(node.fullPath);
    const isSelected = isPathSelected(node.path);
    const isAncestor = isAncestorOfSelected(node.path);
    
    const indentLevel = node.level;
    const paddingLeft = 12 + (indentLevel * 12); // 12px base + 12px per level
    
    return (
      <div key={node.fullPath} style={{ paddingLeft: `${Math.max(0, paddingLeft - 12)}px` }}>
        <SidebarItem
          isActive={isSelected}
          onClick={() => {
            if (hasChildren) {
              // Toggle expansion if has children
              toggleHierarchyNode(node.fullPath);
            }
            // Set as active filter
            setHierarchyPath(node.path);
          }}
          className={isAncestor && !isSelected ? 'bg-surface/20' : ''}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Chevron for expandable nodes */}
            {hasChildren ? (
              <div 
                className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center text-foreground-tertiary"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHierarchyNode(node.fullPath);
                }}
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
            <div className={`font-medium truncate ${isSelected ? 'text-foreground' : 'text-foreground-secondary'}`}>
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
              .map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };
  
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
      <div className="px-2">
        <SidebarItem 
          isActive={hierarchyPath.length === 0} 
          onClick={() => setHierarchyPath([])}
        >
          <div className="flex-1 min-w-0">
            <div className={`font-medium truncate ${hierarchyPath.length === 0 ? 'text-foreground' : 'text-foreground-secondary'}`}>
              All
            </div>
          </div>
          <div className="text-[10px] text-foreground-tertiary flex-shrink-0">
            {totalCount}
          </div>
        </SidebarItem>
      </div>
      
      {/* Hierarchy tree */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {Array.from(hierarchyTree.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(node => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  );
}
