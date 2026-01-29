/**
 * Hierarchical Groups Sidebar
 * Displays multi-level accordion for hierarchical variable navigation
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronsUpDown, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { HierarchyParser, HierarchyNode } from '@/lib/hierarchy-parser';

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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  // Filter tree by search query
  const filteredTree = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      return hierarchyTree;
    }
    
    const matchingNodes = HierarchyParser.searchNodes(hierarchyTree, searchQuery);
    
    // Build filtered tree with only matching paths
    const filteredRoots = new Map<string, HierarchyNode>();
    
    matchingNodes.forEach(node => {
      // Recreate path from root to this node
      let currentLevel = filteredRoots;
      
      node.path.forEach((segment, index) => {
        if (!currentLevel.has(segment)) {
          // Find original node to copy data
          const originalNode = HierarchyParser.findNode(hierarchyTree, node.path.slice(0, index + 1));
          if (originalNode) {
            currentLevel.set(segment, {
              ...originalNode,
              children: new Map()
            });
          }
        }
        
        const currentNode = currentLevel.get(segment);
        if (currentNode) {
          currentLevel = currentNode.children;
        }
      });
    });
    
    return filteredRoots;
  }, [hierarchyTree, searchQuery]);
  
  // Auto-expand all nodes when searching
  useEffect(() => {
    if (searchQuery && searchQuery.trim().length > 0) {
      const allPaths = HierarchyParser.flattenTree(filteredTree).map(node => node.fullPath);
      expandAllHierarchyNodes(allPaths);
    }
  }, [searchQuery, filteredTree]);
  
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
      <div key={node.fullPath}>
        {/* Node button */}
        <button
          onClick={() => {
            if (hasChildren) {
              // Toggle expansion if has children
              toggleHierarchyNode(node.fullPath);
            }
            // Set as active filter
            setHierarchyPath(node.path);
          }}
          className={`
            w-full flex items-center justify-between gap-2
            text-left text-[11px] transition-colors
            hover:bg-interactive-hover
            ${isSelected ? 'bg-surface-selected border-l-2 border-l-primary' : ''}
            ${isAncestor && !isSelected ? 'bg-surface/20' : ''}
          `}
          style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}
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
        </button>
        
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
      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-foreground-secondary">
          Groups
        </span>
        <button
          onClick={() => useVariablesViewStore.getState().toggleGroupsSidebar()}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-interactive-hover text-foreground-tertiary hover:text-foreground-secondary transition-colors"
          title="Collapse Groups"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground-tertiary" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 px-2 pl-7 pr-7 text-xs bg-background border-border/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-interactive-hover rounded-full transition-colors cursor-pointer"
            >
              <X className="h-3 w-3 text-foreground-tertiary" />
            </button>
          )}
        </div>
      </div>
      
      {/* Expand/Collapse All */}
      {hierarchyTree.size > 0 && (
        <div className="px-2 pb-2 flex gap-1">
          <button
            onClick={() => {
              const allPaths = HierarchyParser.flattenTree(hierarchyTree).map(node => node.fullPath);
              expandAllHierarchyNodes(allPaths);
            }}
            className="flex-1 text-[10px] text-foreground-tertiary hover:text-foreground-secondary px-2 py-1 rounded hover:bg-interactive-hover transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={() => collapseAllHierarchyNodes()}
            className="flex-1 text-[10px] text-foreground-tertiary hover:text-foreground-secondary px-2 py-1 rounded hover:bg-interactive-hover transition-colors"
          >
            Collapse All
          </button>
        </div>
      )}
      
      {/* All Option */}
      <button
        onClick={() => setHierarchyPath([])}
        className={`
          w-full px-3 py-2 flex items-center justify-between
          text-left text-[11px] transition-colors
          hover:bg-interactive-hover
          ${hierarchyPath.length === 0 ? 'bg-surface-selected border-l-2 border-l-primary' : ''}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${hierarchyPath.length === 0 ? 'text-foreground' : 'text-foreground-secondary'}`}>
            All
          </div>
        </div>
        <div className="text-[10px] text-foreground-tertiary flex-shrink-0">
          {totalCount}
        </div>
      </button>
      
      {/* Hierarchy tree */}
      <ScrollArea className="flex-1">
        <div className="pb-2">
          {Array.from(filteredTree.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(node => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  );
}
