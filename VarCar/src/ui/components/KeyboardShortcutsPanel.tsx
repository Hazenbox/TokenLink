/**
 * Keyboard shortcuts help panel
 */

import React from 'react';
import { X } from 'lucide-react';
import { KeyboardShortcut, useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsPanel({ isOpen, onClose, shortcuts }: KeyboardShortcutsPanelProps) {
  const { formatShortcut } = useKeyboardShortcuts({ shortcuts: [], enabled: false });

  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryNames: Record<string, string> = {
    selection: 'Selection',
    editing: 'Editing',
    navigation: 'Navigation',
    aliases: 'Aliases',
    view: 'View',
  };

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

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 10001,
          width: '480px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-color)' }}>
            Keyboard Shortcuts
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

        {/* Shortcuts list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {Object.entries(groupedShortcuts).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {categoryNames[category] || category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--secondary-bg)',
                      borderRadius: '6px',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--text-color)' }}>
                      {shortcut.description}
                    </span>
                    <kbd
                      style={{
                        padding: '4px 8px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'var(--font-geist-mono)',
                        color: 'var(--text-color)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatShortcut(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
