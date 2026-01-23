/**
 * Modal for creating a new mode in a collection
 */

import React, { useState, useEffect, useRef } from 'react';

export interface CreateModeModalProps {
  isOpen: boolean;
  collectionName: string;
  collectionId: string;
  existingModes: string[];
  onClose: () => void;
  onCreate: (modeName: string, collectionId: string) => void;
}

export function CreateModeModal({
  isOpen,
  collectionName,
  collectionId,
  existingModes,
  onClose,
  onCreate,
}: CreateModeModalProps) {
  const [modeName, setModeName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setModeName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!modeName.trim()) {
      setError('Mode name is required');
      return;
    }

    if (existingModes.includes(modeName.trim())) {
      setError('A mode with this name already exists in this collection');
      return;
    }

    onCreate(modeName.trim(), collectionId);
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
            Add Mode
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Adding to collection: <strong>{collectionName}</strong>
          </p>

          <form onSubmit={handleSubmit}>
            {/* Mode Name */}
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
                Mode Name *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
                placeholder="e.g., Dark, Hover, Active"
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
                Add Mode
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
