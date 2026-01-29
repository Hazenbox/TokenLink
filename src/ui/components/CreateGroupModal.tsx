/**
 * Modal for creating a new group (via variable naming convention)
 */

import React, { useState, useEffect, useRef } from 'react';

export interface CreateGroupModalProps {
  isOpen: boolean;
  collectionName: string;
  collectionId: string;
  existingGroups: string[];
  onClose: () => void;
  onCreate: (groupName: string, collectionId: string) => void;
}

export function CreateGroupModal({
  isOpen,
  collectionName,
  collectionId,
  existingGroups,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    // Check for invalid characters (allow alphanumeric, spaces, hyphens, underscores, and forward slashes for nesting)
    if (!/^[a-zA-Z0-9\s\-_/]+$/.test(groupName)) {
      setError('Group name contains invalid characters');
      return;
    }

    if (existingGroups.includes(groupName.trim())) {
      setError('A group with this name already exists in this collection');
      return;
    }

    onCreate(groupName.trim(), collectionId);
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
            minWidth: '400px',
            maxWidth: '500px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>
            Create Group
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Adding to collection: <strong>{collectionName}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Group Name */}
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                }}
              >
                Group Name *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Colors, Spacing/Margins"
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
              <p style={{ 
                margin: '6px 0 0 0', 
                fontSize: '11px', 
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}>
                Use "/" for nested groups (e.g., "Colors/Brand")
              </p>
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

            {/* Info Box */}
            <div
              style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: 'var(--secondary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              <strong>Note:</strong> Groups are created when you add variables with group names. 
              This will prepare the group name for when you create variables.
            </div>

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
                Create Group
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
