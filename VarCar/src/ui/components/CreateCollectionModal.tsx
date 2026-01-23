/**
 * Modal for creating a new collection
 */

import React, { useState, useEffect, useRef } from 'react';

export interface CreateCollectionModalProps {
  isOpen: boolean;
  existingCollections: string[];
  onClose: () => void;
  onCreate: (name: string, type: string) => void;
}

const COLLECTION_TYPES = [
  { value: 'primitive', label: 'Primitive' },
  { value: 'semantic', label: 'Semantic' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'theme', label: 'Theme' },
  { value: 'brand', label: 'Brand' },
];

const PLACEHOLDER_EXAMPLES: Record<string, string> = {
  primitive: 'e.g., Color Primitives, Base Tokens',
  semantic: 'e.g., Semantic Tokens, App Colors',
  interaction: 'e.g., Interactive States, Hover Effects',
  theme: 'e.g., Light Theme, Dark Theme',
  brand: 'e.g., Brand Colors, Logo Tokens',
};

export function CreateCollectionModal({
  isOpen,
  existingCollections,
  onClose,
  onCreate,
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('primitive');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType('primitive');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (existingCollections.includes(name.trim())) {
      setError('A collection with this name already exists');
      return;
    }

    onCreate(name.trim(), type);
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
          <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
            Create Collection
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Collection Name */}
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
                Name *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={PLACEHOLDER_EXAMPLES[type] || 'e.g., Color Primitives'}
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

            {/* Collection Type */}
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
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                {COLLECTION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  lineHeight: '1.4',
                }}
              >
                Determines the column color in the graph view. The type is inferred from your collection name (e.g., "Color Primitives" → Primitive, "Semantic Tokens" → Semantic).
              </div>
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
                Create Collection
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
