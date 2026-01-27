/**
 * Variable Editor
 * Modal for creating and editing variables
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FigmaMode, FigmaGroup } from '@/models/brand';

interface VariableEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modes: FigmaMode[];
  groups: FigmaGroup[];
  onSave?: (data: {
    name: string;
    groupId: string;
    valuesByMode: Record<string, string>;
  }) => void;
  initialData?: {
    name: string;
    groupId: string;
    valuesByMode: Record<string, string>;
  };
}

export function VariableEditor({
  open,
  onOpenChange,
  modes,
  groups,
  onSave,
  initialData
}: VariableEditorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [groupId, setGroupId] = useState(initialData?.groupId || groups[0]?.id || '');
  const [valuesByMode, setValuesByMode] = useState<Record<string, string>>(
    initialData?.valuesByMode || {}
  );

  const handleSave = () => {
    if (name.trim() && onSave) {
      onSave({
        name: name.trim(),
        groupId,
        valuesByMode
      });
      onOpenChange(false);
    }
  };

  const handleColorChange = (modeId: string, color: string) => {
    setValuesByMode((prev) => ({
      ...prev,
      [modeId]: color
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Variable' : 'Create Variable'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Variable Name */}
          <div className="space-y-2">
            <Label>Variable Name</Label>
            <Input
              placeholder="e.g. [Primary] Indigo 200"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Group Selection */}
          <div className="space-y-2">
            <Label>Group</Label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface text-sm"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Values */}
          <div className="space-y-2">
            <Label>Mode Values</Label>
            <div className="space-y-3 p-4 border border-border rounded bg-surface-elevated">
              {modes.map((mode) => (
                <div key={mode.id} className="flex items-center gap-3">
                  <label className="w-24 text-sm text-foreground-secondary">
                    {mode.name}
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={valuesByMode[mode.id] || '#000000'}
                      onChange={(e) => handleColorChange(mode.id, e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      placeholder="#000000"
                      value={valuesByMode[mode.id] || ''}
                      onChange={(e) => handleColorChange(mode.id, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {initialData ? 'Save Changes' : 'Create Variable'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
