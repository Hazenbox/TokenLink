/**
 * Modal dialog for creating variable aliases
 */

import React, { useState, useEffect } from 'react';
import { CollectionType } from '../../models/types';
import { validateAliasDirection, formatAliasError } from '../../utils/aliasValidation';

interface Mode {
  id: string;
  name: string;
  value: any;
}

interface Variable {
  id: string;
  name: string;
  groupId: string;
  variableType?: string;
  modes: Mode[];
}

interface Group {
  id: string;
  name: string;
  collectionId: string;
}

interface Collection {
  id: string;
  name: string;
  type: CollectionType;
}

interface AliasModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceVariable?: Variable;
  sourceModeId?: string;
  targetVariable?: Variable;
  targetModeId?: string;
  variables: Variable[];
  groups?: Group[];
  collections?: Collection[];
  onCreateAlias: (data: {
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
  }) => void;
  onCheckCircularDependency?: (sourceId: string, targetId: string) => Promise<boolean>;
}

export function AliasModal({
  isOpen,
  onClose,
  sourceVariable,
  sourceModeId,
  targetVariable,
  targetModeId,
  variables,
  groups = [],
  collections = [],
  onCreateAlias,
  onCheckCircularDependency,
}: AliasModalProps) {
  const [selectedSourceVariableId, setSelectedSourceVariableId] = useState<string>('');
  const [selectedSourceModeId, setSelectedSourceModeId] = useState<string>('');
  const [selectedTargetVariableId, setSelectedTargetVariableId] = useState<string>('');
  const [selectedTargetModeId, setSelectedTargetModeId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Initialize with pre-selected source if provided
  useEffect(() => {
    if (sourceVariable) {
      setSelectedSourceVariableId(sourceVariable.id);
      if (sourceModeId) {
        setSelectedSourceModeId(sourceModeId);
      } else if (sourceVariable.modes.length > 0) {
        setSelectedSourceModeId(sourceVariable.modes[0].id);
      }
    }
  }, [sourceVariable, sourceModeId]);

  // Initialize with pre-selected target if provided
  useEffect(() => {
    if (targetVariable) {
      setSelectedTargetVariableId(targetVariable.id);
      if (targetModeId) {
        setSelectedTargetModeId(targetModeId);
      } else if (targetVariable.modes.length > 0) {
        setSelectedTargetModeId(targetVariable.modes[0].id);
      }
    }
  }, [targetVariable, targetModeId]);

  // Reset error when selections change
  useEffect(() => {
    setError('');
  }, [selectedSourceVariableId, selectedSourceModeId, selectedTargetVariableId, selectedTargetModeId]);

  if (!isOpen) return null;

  const sourceVar = variables.find(v => v.id === selectedSourceVariableId);
  const targetVar = variables.find(v => v.id === selectedTargetVariableId);

  // Get collection type from the actual collection data
  const getCollectionType = (variable: Variable): CollectionType | null => {
    const group = groups.find(g => g.id === variable.groupId);
    if (!group) return null;
    
    const collection = collections.find(c => c.id === group.collectionId);
    return collection?.type || null;
  };

  // Get collection types and validate alias direction
  const sourceType = sourceVar ? getCollectionType(sourceVar) : null;
  const targetType = targetVar ? getCollectionType(targetVar) : null;
  
  const validationResult = sourceType && targetType 
    ? validateAliasDirection(sourceType, targetType)
    : { valid: true };
  
  const isBackwards = !validationResult.valid;

  // Filter variables for search
  const filteredVariables = variables.filter(v => 
    v.id !== selectedSourceVariableId && 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    // Validation
    if (!selectedSourceVariableId || !selectedSourceModeId || !selectedTargetVariableId || !selectedTargetModeId) {
      setError('Please select both source and target variable with modes');
      return;
    }

    // Check alias direction (blocks backwards aliases)
    if (!validationResult.valid) {
      const errorMsg = formatAliasError(
        sourceType!,
        targetType!,
        sourceVar?.name,
        targetVar?.name
      );
      setError(errorMsg);
      return;
    }

    // Check for circular dependency
    if (onCheckCircularDependency) {
      setIsChecking(true);
      const wouldCycle = await onCheckCircularDependency(selectedSourceVariableId, selectedTargetVariableId);
      setIsChecking(false);
      
      if (wouldCycle) {
        setError('Cannot create alias: This would create a circular dependency');
        return;
      }
    }

    // Check if target mode exists
    if (targetVar && !targetVar.modes.find(m => m.id === selectedTargetModeId)) {
      setError('Selected target mode does not exist in the target variable');
      return;
    }

    onCreateAlias({
      sourceVariableId: selectedSourceVariableId,
      sourceModeId: selectedSourceModeId,
      targetVariableId: selectedTargetVariableId,
      targetModeId: selectedTargetModeId,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: '8px',
          padding: '24px',
          width: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Create Variable Alias
          </h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1.5px solid var(--text-secondary)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Show help"
          >
            ?
          </button>
        </div>

        {/* Help Documentation */}
        {showHelp && (
          <div
            style={{
              padding: '12px',
              background: 'var(--secondary-bg)',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Variable Alias Direction</h4>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
              <strong>Primitives:</strong> Raw values like #5F5F5F, 16px
            </p>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
              <strong>Semantics:</strong> Should alias primitives (e.g., color-primary → blue-500)
            </p>
            <p style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
              <strong>Components:</strong> Should alias semantics (e.g., button-bg → color-primary)
            </p>
            <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '11px' }}>
              Example flow: button-bg → color-primary → blue-500 → #3B82F6
            </p>
          </div>
        )}

        {/* Source Variable Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
            Variable to Alias <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(will point to another)</span>
          </label>
          {sourceVariable ? (
            <div style={{ padding: '8px', backgroundColor: 'var(--secondary-bg)', borderRadius: '4px', fontSize: '13px' }}>
              {sourceVariable.name}
            </div>
          ) : (
            <select
              value={selectedSourceVariableId}
              onChange={(e) => setSelectedSourceVariableId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
              }}
            >
              <option value="">Select source variable...</option>
              {variables.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Source Mode Selection */}
        {sourceVar && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
              Mode
            </label>
            <select
              value={selectedSourceModeId}
              onChange={(e) => setSelectedSourceModeId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
              }}
            >
              {sourceVar.modes.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Direction Indicator */}
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <div style={{ 
            fontSize: '28px', 
            color: 'var(--primary-color)',
            lineHeight: 1,
            marginBottom: '4px'
          }}>
            ↓
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            aliases / points to
          </div>
        </div>

        {/* Target Variable Search */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
            Referenced Variable <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(source of value)</span>
          </label>
          {targetVariable ? (
            <div style={{ padding: '8px', backgroundColor: 'var(--secondary-bg)', borderRadius: '4px', fontSize: '13px' }}>
              {targetVariable.name}
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '8px',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-color)',
                }}
              />
              <div
                style={{
                  maxHeight: '150px',
                  overflow: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                }}
              >
                {filteredVariables.map(v => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedTargetVariableId(v.id);
                      if (v.modes.length > 0) {
                        setSelectedTargetModeId(v.modes[0].id);
                      }
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: v.id === selectedTargetVariableId ? 'var(--secondary-bg)' : 'var(--card-bg)',
                      borderBottom: '1px solid var(--border-color)',
                      fontSize: '13px',
                    }}
                  >
                    {v.name}
                  </div>
                ))}
                {filteredVariables.length === 0 && (
                  <div style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No variables found
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Target Mode Selection */}
        {targetVar && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500 }}>
              Mode
            </label>
            <select
              value={selectedTargetModeId}
              onChange={(e) => setSelectedTargetModeId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-color)',
              }}
            >
              {targetVar.modes.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Backwards Alias Error */}
        {isBackwards && sourceVar && targetVar && sourceType && targetType && (
          <div
            style={{
              padding: '12px',
              background: '#ffebee',
              border: '1px solid var(--error-color)',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '12px',
              lineHeight: '1.6',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--error-color)' }}>
              ❌ Invalid Alias Direction
            </div>
            <div style={{ color: '#d32f2f', marginBottom: '8px', whiteSpace: 'pre-line' }}>
              {validationResult.error}
            </div>
            {validationResult.suggestion && (
              <div style={{ color: '#d32f2f', fontSize: '11px', fontStyle: 'italic' }}>
                💡 {validationResult.suggestion}
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {sourceVar && targetVar && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--secondary-bg)',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>Preview:</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {sourceVar.name} ({sourceVar.modes.find(m => m.id === selectedSourceModeId)?.name}) → {targetVar.name} ({targetVar.modes.find(m => m.id === selectedTargetModeId)?.name})
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#ffebee',
              border: '1px solid var(--error-color)',
              borderRadius: '4px',
              color: 'var(--error-color)',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isChecking || !selectedSourceVariableId || !selectedTargetVariableId}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isChecking || !selectedSourceVariableId || !selectedTargetVariableId ? 'var(--border-color)' : 'var(--primary-color)',
              color: 'white',
              cursor: isChecking || !selectedSourceVariableId || !selectedTargetVariableId ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            {isChecking ? 'Checking...' : 'Create Alias'}
          </button>
        </div>
      </div>
    </div>
  );
}
