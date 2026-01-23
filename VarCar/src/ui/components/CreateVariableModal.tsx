/**
 * Modal for creating a new variable
 */

import React, { useState, useEffect, useRef } from 'react';

export interface CreateVariableModalProps {
  isOpen: boolean;
  collectionName: string;
  collectionId: string;
  existingGroups: string[];
  existingVariables: string[];
  modes: Array<{ id: string; name: string }>;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    collectionId: string;
    groupName?: string;
    variableType: string;
    initialValues?: Record<string, any>;
  }) => void;
}

const VARIABLE_TYPES = [
  { value: 'COLOR', label: 'Color' },
  { value: 'FLOAT', label: 'Number' },
  { value: 'STRING', label: 'String' },
  { value: 'BOOLEAN', label: 'Boolean' },
];

export function CreateVariableModal({
  isOpen,
  collectionName,
  collectionId,
  existingGroups,
  existingVariables,
  modes,
  onClose,
  onCreate,
}: CreateVariableModalProps) {
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [variableType, setVariableType] = useState('COLOR');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setGroupName('');
      setVariableType('COLOR');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Variable name is required');
      return;
    }

    // Check for invalid characters in name
    if (name.includes('/')) {
      setError('Variable name cannot contain "/"');
      return;
    }

    // Check for invalid characters in group name
    if (groupName && !/^[a-zA-Z0-9\s\-_/]+$/.test(groupName)) {
      setError('Group name contains invalid characters');
      return;
    }

    // Construct full name
    const fullName = groupName ? `${groupName}/${name.trim()}` : name.trim();

    // Check for duplicate
    if (existingVariables.includes(fullName)) {
      setError('A variable with this name already exists in this collection');
      return;
    }

    onCreate({
      name: name.trim(),
      collectionId,
      groupName: groupName.trim() || undefined,
      variableType,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: '12px',
            padding: '24px',
            minWidth: '450px',
            maxWidth: '500px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
            Create Variable
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Adding to collection: <strong>{collectionName}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Variable Name */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                }}
              >
                Variable Name *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., primary-blue, spacing-small"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--text-color)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Group Name */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                }}
              >
                Group (optional)
              </label>
              {existingGroups.length > 0 ? (
                <select
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--secondary-bg)',
                    color: 'var(--text-color)',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">No group</option>
                  {existingGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                  <option value="__custom__">+ New group...</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Colors, Spacing"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--secondary-bg)',
                    color: 'var(--text-color)',
                    boxSizing: 'border-box',
                  }}
                />
              )}
              {groupName === '__custom__' && (
                <input
                  type="text"
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter new group name"
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--secondary-bg)',
                    color: 'var(--text-color)',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>

            {/* Variable Type */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                }}
              >
                Type
              </label>
              <select
                value={variableType}
                onChange={(e) => setVariableType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--text-color)',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                {VARIABLE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  marginBottom: '16px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#c33',
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-color)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#18a0fb',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Create Variable
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
