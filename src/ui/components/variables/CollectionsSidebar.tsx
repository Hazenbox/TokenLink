/**
 * Collections Sidebar
 * Displays list of collections for Figma-style Variables UI
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Trash2, MoreHorizontal } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { IconButton } from '../common/IconButton';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { FigmaCollection } from '@/models/brand';
import { EmptyState } from '../EmptyState';
import { cn } from '@colors/utils';

// Style constants to prevent object recreation on every render
const LOADING_STATE_STYLE = {
  padding: '20px',
  textAlign: 'center' as const,
  color: 'var(--text-secondary)',
  fontSize: '12px'
};

const SCROLL_AREA_STYLE = {
  overflowX: 'auto' as const
};

interface CollectionsSidebarProps {
  onCreateCollection?: () => void;
}

interface CollectionItemProps {
  collection: FigmaCollection;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onClick: (id: string) => void;
  onStartEdit: (id: string, name: string) => void;
  onEditChange: (name: string) => void;
  onEditSave: (id: string) => void;
  onEditCancel: () => void;
}

const CollectionItem = React.memo(function CollectionItem({ 
  collection, 
  isActive, 
  isEditing,
  editingName,
  onClick, 
  onStartEdit,
  onEditChange,
  onEditSave,
  onEditCancel
}: CollectionItemProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  return (
    <div
      className={cn(
        "group flex h-7 items-center justify-between rounded-lg pl-3 pr-1 text-xs transition-colors cursor-pointer select-none",
        isActive
          ? "bg-surface-elevated"
          : "hover:bg-surface"
      )}
      onClick={() => onClick(collection.id)}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        {isEditing ? (
          <Input
            value={editingName}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={() => onEditSave(collection.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave(collection.id);
              if (e.key === "Escape") onEditCancel();
            }}
            className="h-5 px-1 py-0 text-xs rounded-lg flex-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className={`truncate text-xs font-normal ${isActive ? 'text-foreground' : 'text-foreground-secondary'}`}>
                {collection.name}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-foreground-tertiary">
                {collection.variableCount}
              </span>
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                  <IconButton
                    icon={MoreHorizontal}
                    variant="ghost"
                    size="sm"
                    aria-label="More options"
                    className={cn(
                      "h-5 w-5 transition-opacity",
                      menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(true);
                    }}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end" side="right">
                  <div className="flex flex-col">
                    <button
                      className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        onStartEdit(collection.id, collection.name);
                      }}
                    >
                      Rename
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </div>
    </div>
  );
});

export function CollectionsSidebar({ onCreateCollection }: CollectionsSidebarProps) {
  // Simple state selector - no function calls
  const collections = useBrandStore((state) => state.figmaCollections, shallow);
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const setActiveCollection = useVariablesViewStore((state) => state.setActiveCollection);
  const collectionsCollapsed = useVariablesViewStore((state) => state.collectionsCollapsed);
  const updateCollection = useBrandStore((state) => state.updateCollection);
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const isLoading = useBrandStore((state) => state.isLoading);
  
  // Use ref for initialization to prevent re-renders and avoid hook-after-conditional-return issue
  const isInitializedRef = useRef(false);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  
  // Store editingName in a ref so callbacks don't need it as dependency
  const editingNameRef = useRef(editingName);
  editingNameRef.current = editingName;
  
  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS (React rules of hooks)
  
  // Create stable callbacks to prevent new function references on every render
  const handleClick = useCallback((collectionId: string) => {
    setActiveCollection(collectionId);
  }, [setActiveCollection]);
  
  const handleStartEditCollection = useCallback((collectionId: string, collectionName: string) => {
    setEditingId(collectionId);
    setEditingName(collectionName);
  }, []);
  
  // Fix: Read editingName from ref inside callback to avoid dependency on frequently changing state
  const handleSaveEditCollection = useCallback((collectionId: string) => {
    const currentEditingName = editingNameRef.current;
    const currentActiveBrandId = useBrandStore.getState().activeBrandId;
    if (currentEditingName.trim() && currentActiveBrandId) {
      useBrandStore.getState().updateCollection(currentActiveBrandId, collectionId, { name: currentEditingName.trim() });
    }
    setEditingId(null);
    setEditingName("");
  }, []); // No dependencies - reads from refs and getState()
  
  const handleCancelEditCollection = useCallback(() => {
    setEditingId(null);
    setEditingName("");
  }, []);
  
  // Handle cleanup of ml_ prefixed collections
  const handleCleanupMlCollections = useCallback(() => {
    const mlCollections = collections.filter(c => c.name.startsWith('ml_'));
    
    if (mlCollections.length === 0) {
      console.log('[Collections] No ml_ prefixed collections found to clean up.');
      return;
    }
    
    const confirmMsg = `Delete ${mlCollections.length} collections with ml_ prefix?\n\n${mlCollections.map(c => c.name).join('\n')}\n\nThis cannot be undone.`;
    
    if (confirm(confirmMsg)) {
      parent.postMessage({ 
        pluginMessage: { type: 'cleanup-ml-collections' } 
      }, '*');
    }
  }, [collections]);
  
  // Auto-select first collection if none selected
  // Uses ref to ensure this only runs once and doesn't cause infinite loops
  useEffect(() => {
    // Only auto-select if:
    // 1. Not already initialized
    // 2. Collections exist
    // 3. No collection is currently selected (read from store directly to avoid dep)
    const currentActiveCollection = useVariablesViewStore.getState().activeCollectionId;
    if (!isInitializedRef.current && collections.length > 0 && !currentActiveCollection) {
      isInitializedRef.current = true;
      useVariablesViewStore.getState().setActiveCollection(collections[0].id);
    }
    // Mark as initialized even if conditions weren't met, to prevent future runs
    if (collections.length > 0) {
      isInitializedRef.current = true;
    }
  }, [collections.length]);
  
  // Defensive check: prevent rendering with undefined/empty collections during loading
  // NOW AFTER ALL HOOKS to comply with React's rules of hooks
  if (!collections || (collections.length === 0 && isLoading)) {
    return (
      <div className="flex flex-col h-full p-4">
        <div style={LOADING_STATE_STYLE}>
          {isLoading ? 'Loading collections...' : 'No collections yet'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-9 px-3 py-1.5 border-b border-border/30 flex items-center justify-between flex-shrink-0">
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
        </div>
      </div>
      
      {/* Collections List */}
      <ScrollArea className="flex-1" style={SCROLL_AREA_STYLE}>
        {collections.length === 0 ? (
          <EmptyState
            title="No collections"
            description="Create a brand to start"
            className="py-4"
          />
        ) : (
          <div className="px-2 pt-2 pb-1 space-y-0.5 min-w-max">
            {collections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isActive={activeCollectionId === collection.id}
                isEditing={editingId === collection.id}
                editingName={editingName}
                onClick={handleClick}
                onStartEdit={handleStartEditCollection}
                onEditChange={setEditingName}
                onEditSave={handleSaveEditCollection}
                onEditCancel={handleCancelEditCollection}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
