/**
 * Collections Sidebar
 * Displays list of collections for Figma-style Variables UI
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, X, Trash2 } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { FigmaCollection } from '@/models/brand';

interface CollectionsSidebarProps {
  onCreateCollection?: () => void;
}

interface CollectionItemProps {
  collection: FigmaCollection;
  isActive: boolean;
  onClick: () => void;
}

function CollectionItem({ collection, isActive, onClick }: CollectionItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2 flex items-center justify-between
        text-left text-[11px] transition-colors
        hover:bg-interactive-hover
        ${isActive ? 'bg-surface-selected border-l-2 border-l-primary' : ''}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground-secondary'}`}>
          {collection.name}
        </div>
      </div>
      <div className="ml-2 text-[10px] text-foreground-tertiary">
        {collection.variableCount}
      </div>
    </button>
  );
}

export function CollectionsSidebar({ onCreateCollection }: CollectionsSidebarProps) {
  // Simple state selector - no function calls
  const collections = useBrandStore((state) => state.figmaCollections, shallow);
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const setActiveCollection = useVariablesViewStore((state) => state.setActiveCollection);
  const collectionsCollapsed = useVariablesViewStore((state) => state.collectionsCollapsed);
  
  // Initialization guard to prevent infinite loop
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auto-select first collection if none selected (only once on mount)
  useEffect(() => {
    if (!isInitialized && collections.length > 0 && !activeCollectionId) {
      setActiveCollection(collections[0].id);
      setIsInitialized(true);
    }
  }, [collections.length, activeCollectionId, setActiveCollection, isInitialized]);
  
  // Handle collection click
  const handleCollectionClick = useCallback((id: string) => {
    setActiveCollection(id);
  }, [setActiveCollection]);
  
  // Handle cleanup of ml_ prefixed collections
  const handleCleanupMlCollections = useCallback(() => {
    const mlCollections = collections.filter(c => c.name.startsWith('ml_'));
    
    if (mlCollections.length === 0) {
      alert('No ml_ prefixed collections found.');
      return;
    }
    
    const confirmMsg = `Delete ${mlCollections.length} collections with ml_ prefix?\n\n${mlCollections.map(c => c.name).join('\n')}\n\nThis cannot be undone.`;
    
    if (confirm(confirmMsg)) {
      parent.postMessage({ 
        pluginMessage: { type: 'cleanup-ml-collections' } 
      }, '*');
    }
  }, [collections]);
  
  // Filter collections by search query
  const filteredCollections = collections.filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-foreground-secondary">
          Collections
        </span>
        <div className="flex items-center gap-1">
          {/* Cleanup ml_ collections button */}
          {collections.some(c => c.name.startsWith('ml_')) && (
            <button
              onClick={handleCleanupMlCollections}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 text-red-500/70 hover:text-red-500 transition-colors"
              title="Delete ml_ prefixed collections"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onCreateCollection}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-interactive-hover text-foreground-tertiary hover:text-foreground-secondary transition-colors"
            title="Add Collection"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
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
      
      {/* Collections List */}
      <ScrollArea className="flex-1">
        {collections.length === 0 ? (
          <div className="px-3 py-8 text-center text-[10px] text-foreground-tertiary">
            No collections
            <br />
            Create a brand to start
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="px-3 py-8 text-center text-[10px] text-foreground-tertiary">
            No collections found
            <br />
            Try a different search
          </div>
        ) : (
          <div className="py-1">
            {filteredCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isActive={activeCollectionId === collection.id}
                onClick={() => handleCollectionClick(collection.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
