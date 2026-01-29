/**
 * Modes Manager
 * Modal for managing modes in a collection
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { FigmaMode } from '@/models/brand';

interface ModesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modes: FigmaMode[];
  onAddMode?: (modeName: string) => void;
  onRemoveMode?: (modeId: string) => void;
  onRenameMode?: (modeId: string, newName: string) => void;
}

export function ModesManager({
  open,
  onOpenChange,
  modes,
  onAddMode,
  onRemoveMode,
  onRenameMode
}: ModesManagerProps) {
  const [newModeName, setNewModeName] = useState('');
  const [editingModeId, setEditingModeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddMode = () => {
    if (newModeName.trim() && onAddMode) {
      onAddMode(newModeName.trim());
      setNewModeName('');
    }
  };

  const handleStartEdit = (mode: FigmaMode) => {
    setEditingModeId(mode.id);
    setEditingName(mode.name);
  };

  const handleSaveEdit = () => {
    if (editingModeId && editingName.trim() && onRenameMode) {
      onRenameMode(editingModeId, editingName.trim());
      setEditingModeId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingModeId(null);
    setEditingName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Modes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new mode */}
          <div className="flex gap-2">
            <Input
              placeholder="New mode name..."
              value={newModeName}
              onChange={(e) => setNewModeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMode()}
              className="flex-1"
            />
            <Button onClick={handleAddMode} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Modes list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {modes.map((mode) => (
              <div
                key={mode.id}
                className="flex items-center gap-2 p-2 rounded border border-border hover:bg-surface/50"
              >
                {editingModeId === mode.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button onClick={handleSaveEdit} size="sm" variant="outline">
                      Save
                    </Button>
                    <Button onClick={handleCancelEdit} size="sm" variant="outline">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{mode.name}</span>
                    <Button
                      onClick={() => handleStartEdit(mode)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Rename mode"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => onRemoveMode?.(mode.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      title="Delete mode"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-foreground-tertiary">
            Note: Deleting a mode will affect all variables that use it.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
