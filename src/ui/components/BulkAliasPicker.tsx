/**
 * Bulk alias creation modal for multi-selected items
 */

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

interface BulkAliasPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Array<{ type: 'node' | 'mode'; nodeId: string; modeId?: string }>;
  variables: any[];
  groups: any[];
  collections: any[];
  onCreateAliases: (mappings: Array<{
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
  }>) => void;
}

export function BulkAliasPicker({
  isOpen,
  onClose,
  selectedItems,
  variables,
  groups,
  collections,
  onCreateAliases,
}: BulkAliasPickerProps) {
  const [targetCollectionId, setTargetCollectionId] = useState<string>('');
  const [targetVariableId, setTargetVariableId] = useState<string>('');
  const [modeMappings, setModeMappings] = useState<Map<string, string>>(new Map());

  if (!isOpen) return null;

  // Get source modes from selected items
  const sourceModes = useMemo(() => {
    const modes: Array<{ variableId: string; modeId: string; variableName: string; modeName: string }> = [];
    
    selectedItems.forEach(item => {
      const variable = variables.find(v => v.id === item.nodeId);
      if (!variable) return;
      
      if (item.type === 'mode' && item.modeId) {
        const mode = variable.modes.find((m: any) => m.id === item.modeId);
        if (mode) {
          modes.push({
            variableId: variable.id,
            modeId: mode.id,
            variableName: variable.name,
            modeName: mode.name,
          });
        }
      } else if (item.type === 'node') {
        // Include all modes from the variable
        variable.modes.forEach((mode: any) => {
          modes.push({
            variableId: variable.id,
            modeId: mode.id,
            variableName: variable.name,
            modeName: mode.name,
          });
        });
      }
    });
    
    return modes;
  }, [selectedItems, variables]);

  // Get target variables in selected collection
  const targetVariables = useMemo(() => {
    if (!targetCollectionId) return [];
    
    return variables.filter(v => {
      const group = groups.find(g => g.id === v.groupId);
      return group?.collectionId === targetCollectionId;
    });
  }, [targetCollectionId, variables, groups]);

  // Get target modes
  const targetModes = useMemo(() => {
    if (!targetVariableId) return [];
    const variable = variables.find(v => v.id === targetVariableId);
    return variable?.modes || [];
  }, [targetVariableId, variables]);

  // Auto-match modes by name
  const autoMatchModes = () => {
    const newMappings = new Map<string, string>();
    
    sourceModes.forEach(sourceMode => {
      const matchingMode = targetModes.find((tm: any) => tm.name === sourceMode.modeName);
      if (matchingMode) {
        newMappings.set(sourceMode.modeId, matchingMode.id);
      }
    });
    
    setModeMappings(newMappings);
  };

  // Handle create aliases
  const handleCreate = () => {
    const aliasesToCreate: Array<{
      sourceVariableId: string;
      sourceModeId: string;
      targetVariableId: string;
      targetModeId: string;
    }> = [];

    sourceModes.forEach(sourceMode => {
      const targetModeId = modeMappings.get(sourceMode.modeId);
      if (targetModeId && targetVariableId) {
        aliasesToCreate.push({
          sourceVariableId: sourceMode.variableId,
          sourceModeId: sourceMode.modeId,
          targetVariableId: targetVariableId,
          targetModeId: targetModeId,
        });
      }
    });

    if (aliasesToCreate.length > 0) {
      onCreateAliases(aliasesToCreate);
      onClose();
    }
  };

  const validMappingsCount = Array.from(modeMappings.values()).filter(v => v).length;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          zIndex: 10001,
          minWidth: '600px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-color)' }}>
            Create Bulk Aliases
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Source info */}
        <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--secondary-bg)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Selected sources:
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-color)', fontWeight: 500 }}>
            {sourceModes.length} mode{sourceModes.length !== 1 ? 's' : ''} from {selectedItems.length} variable{selectedItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Target Collection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-color)' }}>
            Target Collection
          </label>
          <select
            value={targetCollectionId}
            onChange={(e) => {
              setTargetCollectionId(e.target.value);
              setTargetVariableId('');
              setModeMappings(new Map());
            }}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-color)',
              fontSize: '13px',
            }}
          >
            <option value="">Select collection...</option>
            {collections.map(col => (
              <option key={col.id} value={col.id}>{col.name}</option>
            ))}
          </select>
        </div>

        {/* Target Variable */}
        {targetCollectionId && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-color)' }}>
              Target Variable
            </label>
            <select
              value={targetVariableId}
              onChange={(e) => {
                setTargetVariableId(e.target.value);
                setModeMappings(new Map());
              }}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-color)',
                fontSize: '13px',
              }}
            >
              <option value="">Select variable...</option>
              {targetVariables.map((v: any) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Mode mappings */}
        {targetVariableId && targetModes.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-color)' }}>
                Mode Mappings
              </label>
              <button
                onClick={autoMatchModes}
                style={{
                  padding: '6px 12px',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Auto-match by name
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              {sourceModes.map((sourceMode, index) => (
                <div
                  key={`${sourceMode.variableId}-${sourceMode.modeId}`}
                  style={{
                    padding: '12px',
                    borderBottom: index < sourceModes.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-color)' }}>
                    {sourceMode.variableName} · {sourceMode.modeName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>→</div>
                  <select
                    value={modeMappings.get(sourceMode.modeId) || ''}
                    onChange={(e) => {
                      const newMappings = new Map(modeMappings);
                      if (e.target.value) {
                        newMappings.set(sourceMode.modeId, e.target.value);
                      } else {
                        newMappings.delete(sourceMode.modeId);
                      }
                      setModeMappings(newMappings);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '4px',
                      color: 'var(--text-color)',
                      fontSize: '12px',
                    }}
                  >
                    <option value="">Select target mode...</option>
                    {targetModes.map((tm: any) => (
                      <option key={tm.id} value={tm.id}>{tm.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: 'var(--text-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={validMappingsCount === 0}
            style={{
              padding: '10px 20px',
              background: validMappingsCount > 0 ? 'var(--primary-color)' : 'var(--border-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: validMappingsCount > 0 ? 'pointer' : 'not-allowed',
              opacity: validMappingsCount > 0 ? 1 : 0.5,
            }}
          >
            Create {validMappingsCount} alias{validMappingsCount !== 1 ? 'es' : ''}
          </button>
        </div>
      </div>
    </>
  );
}
