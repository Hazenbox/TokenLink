/**
 * Groups Manager
 * Modal for managing groups (color families)
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { FigmaGroup } from '@/models/brand';

interface GroupsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: FigmaGroup[];
  onCreateGroup?: (groupName: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onRenameGroup?: (groupId: string, newName: string) => void;
}

export function GroupsManager({
  open,
  onOpenChange,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onRenameGroup
}: GroupsManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateGroup = () => {
    if (newGroupName.trim() && onCreateGroup) {
      onCreateGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleStartEdit = (group: FigmaGroup) => {
    setEditingGroupId(group.id);
    setEditingName(group.name);
  };

  const handleSaveEdit = () => {
    if (editingGroupId && editingName.trim() && onRenameGroup) {
      onRenameGroup(editingGroupId, editingName.trim());
      setEditingGroupId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new group */}
          <div className="flex gap-2">
            <Input
              placeholder="New group name (e.g. Indigo, Grey)..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
              className="flex-1"
            />
            <Button onClick={handleCreateGroup} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Groups list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center gap-2 p-2 rounded border border-border hover:bg-surface/50"
              >
                {editingGroupId === group.id ? (
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
                    <span className="flex-1 text-sm">
                      {group.name}
                      <span className="ml-2 text-xs text-foreground-tertiary">
                        ({Math.round(group.variableCount)} variables)
                      </span>
                    </span>
                    <Button
                      onClick={() => handleStartEdit(group)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Rename group"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => onDeleteGroup?.(group.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      title="Delete group"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {groups.length === 0 && (
            <p className="text-center text-sm text-foreground-tertiary py-8">
              No groups yet. Create one to organize your variables.
            </p>
          )}

          <p className="text-xs text-foreground-tertiary">
            Groups help organize variables by color family (e.g., Indigo, Grey, Green).
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
