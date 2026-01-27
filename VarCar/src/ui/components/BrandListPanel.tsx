/**
 * Brand List Panel
 * Left sidebar showing list of brands with CRUD operations
 */

import React, { useState } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Copy, Plus, Check, X } from 'lucide-react';

export function BrandListPanel() {
  const brands = useBrandStore((state) => state.brands);
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const createBrand = useBrandStore((state) => state.createBrand);
  const deleteBrand = useBrandStore((state) => state.deleteBrand);
  const duplicateBrand = useBrandStore((state) => state.duplicateBrand);
  const setActiveBrand = useBrandStore((state) => state.setActiveBrand);
  const renameBrand = useBrandStore((state) => state.renameBrand);

  const [isCreating, setIsCreating] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateBrand = () => {
    if (newBrandName.trim()) {
      createBrand(newBrandName.trim());
      setNewBrandName('');
      setIsCreating(false);
    }
  };

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      renameBrand(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Brands</h2>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            className="h-8 px-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Create new brand input */}
        {isCreating && (
          <div className="flex gap-2 mt-2">
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Brand name..."
              className="flex-1 h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBrand();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button
              onClick={handleCreateBrand}
              size="sm"
              className="h-8 px-2"
              disabled={!newBrandName.trim()}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                setIsCreating(false);
                setNewBrandName('');
              }}
              size="sm"
              variant="outline"
              className="h-8 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Brand list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {brands.length === 0 ? (
            <div className="text-center py-8 text-foreground-secondary text-sm">
              No brands yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className={`
                    group relative rounded-lg p-3 cursor-pointer transition-colors
                    ${
                      activeBrandId === brand.id
                        ? 'bg-surface-elevated border-2 border-blue-500'
                        : 'bg-surface-elevated border border-border hover:border-border-strong'
                    }
                  `}
                  onClick={() => setActiveBrand(brand.id)}
                >
                  {/* Brand name (editable) */}
                  {editingId === brand.id ? (
                    <div className="flex gap-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit();
                        }}
                        size="sm"
                        className="h-7 px-2"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-sm text-foreground truncate"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(brand.id, brand.name);
                          }}
                        >
                          {brand.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-foreground-secondary">
                            {brand.syncedAt ? '✓ Synced' : '○ Not synced'}
                          </span>
                          {brand.updatedAt > (brand.syncedAt || 0) && brand.syncedAt && (
                            <span className="text-xs text-orange-500">Modified</span>
                          )}
                        </div>
                      </div>

                      {/* Actions (shown on hover) */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBrand(brand.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Are you sure you want to delete "${brand.name}"?`
                              )
                            ) {
                              deleteBrand(brand.id);
                            }
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Color indicators */}
                  {!editingId && (
                    <div className="flex gap-1 mt-2">
                      {[
                        brand.colors.primary,
                        brand.colors.secondary,
                        brand.colors.sparkle,
                        brand.colors.neutral
                      ].map((ref, idx) => (
                        <div
                          key={idx}
                          className={`
                            h-2 flex-1 rounded
                            ${ref.paletteId ? 'bg-blue-400' : 'bg-border'}
                          `}
                          title={ref.paletteName || 'Not assigned'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
