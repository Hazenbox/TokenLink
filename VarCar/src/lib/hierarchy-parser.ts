/**
 * Hierarchy Parser
 * Parses slash-delimited variable names into a hierarchical tree structure
 */

import { FigmaVariable } from '@/models/brand';

/**
 * Tree node representing a segment in the variable name hierarchy
 */
export interface HierarchyNode {
  /** Segment name (e.g., "Grey", "Semi semantics", "Root") */
  name: string;
  
  /** Full path from root to this node (e.g., ["Grey", "Semi semantics", "Root"]) */
  path: string[];
  
  /** Full path as string (e.g., "Grey/Semi semantics/Root") */
  fullPath: string;
  
  /** Number of variables at this level and below */
  variableCount: number;
  
  /** Number of variables at exactly this level (leaf nodes only) */
  leafVariableCount: number;
  
  /** Child nodes */
  children: Map<string, HierarchyNode>;
  
  /** Depth level (0 = root) */
  level: number;
  
  /** Whether this node has any leaf variables directly */
  isLeaf: boolean;
}

/**
 * Parse variable names into a hierarchical tree structure
 */
export class HierarchyParser {
  /**
   * Build hierarchy tree from variables
   * @param variables - Array of Figma variables
   * @returns Map of root nodes (first segment → node)
   */
  static buildTree(variables: FigmaVariable[]): Map<string, HierarchyNode> {
    const rootNodes = new Map<string, HierarchyNode>();
    
    variables.forEach(variable => {
      const segments = this.parseVariableName(variable.name);
      
      if (segments.length === 0) {
        // Skip variables with no name or empty segments
        return;
      }
      
      // Navigate/create tree path
      let currentLevel = rootNodes;
      let currentPath: string[] = [];
      
      segments.forEach((segment, index) => {
        currentPath.push(segment);
        const isLastSegment = index === segments.length - 1;
        
        if (!currentLevel.has(segment)) {
          // Create new node
          currentLevel.set(segment, {
            name: segment,
            path: [...currentPath],
            fullPath: currentPath.join('/'),
            variableCount: 0,
            leafVariableCount: 0,
            children: new Map(),
            level: index,
            isLeaf: false
          });
        }
        
        const node = currentLevel.get(segment)!;
        
        // Increment counts
        node.variableCount++;
        
        if (isLastSegment) {
          node.leafVariableCount++;
          node.isLeaf = true;
        }
        
        // Move to next level
        currentLevel = node.children;
      });
    });
    
    return rootNodes;
  }
  
  /**
   * Parse variable name into segments
   * @param name - Variable name (e.g., "Grey/2500/Surface")
   * @returns Array of segments
   */
  static parseVariableName(name: string): string[] {
    return name
      .split('/')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0);
  }
  
  /**
   * Get all nodes as a flat array (for search/filtering)
   * @param rootNodes - Root level nodes
   * @returns Flat array of all nodes
   */
  static flattenTree(rootNodes: Map<string, HierarchyNode>): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    
    const traverse = (nodes: Map<string, HierarchyNode>) => {
      nodes.forEach(node => {
        result.push(node);
        if (node.children.size > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(rootNodes);
    return result;
  }
  
  /**
   * Find node by path
   * @param rootNodes - Root level nodes
   * @param path - Path segments to find
   * @returns Node if found, null otherwise
   */
  static findNode(
    rootNodes: Map<string, HierarchyNode>,
    path: string[]
  ): HierarchyNode | null {
    if (path.length === 0) return null;
    
    let currentLevel = rootNodes;
    let node: HierarchyNode | undefined;
    
    for (const segment of path) {
      node = currentLevel.get(segment);
      if (!node) return null;
      currentLevel = node.children;
    }
    
    return node || null;
  }
  
  /**
   * Get all descendant nodes (recursive)
   * @param node - Starting node
   * @returns Array of all descendant nodes
   */
  static getDescendants(node: HierarchyNode): HierarchyNode[] {
    const result: HierarchyNode[] = [];
    
    const traverse = (n: HierarchyNode) => {
      n.children.forEach(child => {
        result.push(child);
        traverse(child);
      });
    };
    
    traverse(node);
    return result;
  }
  
  /**
   * Search nodes by query string
   * @param rootNodes - Root level nodes
   * @param query - Search query
   * @returns Array of matching nodes with their paths
   */
  static searchNodes(
    rootNodes: Map<string, HierarchyNode>,
    query: string
  ): HierarchyNode[] {
    if (!query || query.trim().length === 0) {
      return this.flattenTree(rootNodes);
    }
    
    const lowerQuery = query.toLowerCase();
    const allNodes = this.flattenTree(rootNodes);
    
    return allNodes.filter(node => 
      node.name.toLowerCase().includes(lowerQuery) ||
      node.fullPath.toLowerCase().includes(lowerQuery)
    );
  }
  
  /**
   * Get total variable count across all nodes
   * @param rootNodes - Root level nodes
   * @returns Total variable count
   */
  static getTotalVariableCount(rootNodes: Map<string, HierarchyNode>): number {
    let total = 0;
    rootNodes.forEach(node => {
      total += node.variableCount;
    });
    return total;
  }
  
  /**
   * Convert path array to string
   * @param path - Path segments
   * @returns Path as string (e.g., "Grey/Semi semantics/Root")
   */
  static pathToString(path: string[]): string {
    return path.join('/');
  }
  
  /**
   * Check if a variable matches a given path
   * @param variableName - Full variable name
   * @param path - Path segments to match
   * @returns True if variable starts with path
   */
  static variableMatchesPath(variableName: string, path: string[]): boolean {
    if (path.length === 0) return true;
    
    const pathString = this.pathToString(path);
    return variableName.startsWith(pathString + '/') || variableName === pathString;
  }
  
  /**
   * Get the last segment of a variable name (for display)
   * @param variableName - Full variable name
   * @returns Last segment
   */
  static getLastSegment(variableName: string): string {
    const segments = this.parseVariableName(variableName);
    return segments.length > 0 ? segments[segments.length - 1] : variableName;
  }
  
  /**
   * Get all segments except the last (for context)
   * @param variableName - Full variable name
   * @returns All segments except last, joined
   */
  static getParentPath(variableName: string): string {
    const segments = this.parseVariableName(variableName);
    if (segments.length <= 1) return '';
    return segments.slice(0, -1).join('/');
  }
}
