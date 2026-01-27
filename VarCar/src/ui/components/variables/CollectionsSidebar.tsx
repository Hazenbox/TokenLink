/**
 * Collections Sidebar
 * Displays list of collections for Figma-style Variables UI
 */

import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        hover:bg-surface/50
        ${isActive ? 'bg-surface-selected border-l-2 border-l-blue-500' : ''}
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
  const collections = useBrandStore((state) => state.getFigmaCollections()) || [];
  const { activeCollectionId, setActiveCollection, collectionsCollapsed } = useVariablesViewStore();
  
  // Auto-select first collection if none selected
  useEffect(() => {
    if (collections.length > 0 && !activeCollectionId) {
      setActiveCollection(collections[0].id);
    }
  }, [collections.length, activeCollectionId]);
  
  if (collectionsCollapsed) {
    return (
      <div className="w-12 border-r border-border/20 bg-surface-elevated flex flex-col items-center py-2">
        <button
          onClick={() => useVariablesViewStore.getState().toggleCollectionsSidebar()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface/50 text-foreground-tertiary"
          title="Expand Collections"
        >
          ☰
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-[180px] border-r border-border/20 bg-surface-elevated flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-medium text-foreground-secondary">
          Collections
        </span>
        <button
          onClick={onCreateCollection}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface/50 text-foreground-tertiary"
          title="Add Collection"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Collections List */}
      <ScrollArea className="flex-1">
        {collections.length === 0 ? (
          <div className="px-3 py-8 text-center text-[10px] text-foreground-tertiary">
            No collections
            <br />
            Create a brand to start
          </div>
        ) : (
          <div className="py-1">
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isActive={activeCollectionId === collection.id}
                onClick={() => setActiveCollection(collection.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
