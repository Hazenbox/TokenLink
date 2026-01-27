/**
 * Brand List Panel
 * Left sidebar showing list of brands with CRUD operations
 */

import React, { useState } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Copy, Plus, Check, X, Edit2 } from 'lucide-react';

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

  const handleStartEdit = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">Brands</h2>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            className="h-7 px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            New
          </Button>
        </div>

        {/* Create new brand input */}
        {isCreating && (
          <div className="flex gap-1 mt-2">
            <Input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Brand name..."
              className="flex-1 h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBrand();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button
              onClick={handleCreateBrand}
              size="sm"
              className="h-7 px-2"
              disabled={!newBrandName.trim()}
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => {
                setIsCreating(false);
                setNewBrandName('');
              }}
              size="sm"
              variant="outline"
              className="h-7 px-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Brand list */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {brands.length === 0 ? (
            <div className="text-center py-8 text-foreground-secondary text-xs">
              No brands yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className={`
                    rounded-md p-2 cursor-pointer transition-colors
                    ${
                      activeBrandId === brand.id
                        ? 'bg-surface-elevated border border-blue-500'
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
                        className="flex-1 h-6 text-xs"
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
                        className="h-6 px-1.5"
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
                        className="h-6 px-1.5"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-xs text-foreground truncate flex-1">
                          {brand.name}
                        </h3>
                        {/* Actions - Always visible */}
                        <div className="flex gap-0.5 ml-2">
                          <Button
                            onClick={(e) => handleStartEdit(brand.id, brand.name, e)}
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBrand(brand.id);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
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
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-[10px] text-foreground-secondary">
                        {brand.syncedAt ? '✓ Synced' : '○ Not synced'}
                        {brand.updatedAt > (brand.syncedAt || 0) && brand.syncedAt && (
                          <span className="text-orange-500 ml-1">• Modified</span>
                        )}
                      </div>
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
