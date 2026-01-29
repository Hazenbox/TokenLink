/**
 * Reusable context menu component with positioning and keyboard navigation
 */

import React, { useEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ x, y });

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const enabledItems = items.filter(item => !item.disabled && !item.divider);
      
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= enabledItems.length ? 0 : nextIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => {
            const prevIndex = prev - 1;
            return prevIndex < 0 ? enabledItems.length - 1 : prevIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          const selectedItem = enabledItems[selectedIndex];
          if (selectedItem && !selectedItem.disabled) {
            selectedItem.onClick();
            onClose();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled && !item.divider) {
      item.onClick();
      onClose();
    }
  };

  const handleItemMouseEnter = (index: number) => {
    const enabledItems = items.filter(item => !item.disabled && !item.divider);
    const itemIndex = enabledItems.findIndex((_, i) => i === index);
    if (itemIndex >= 0) {
      setSelectedIndex(itemIndex);
    }
  };

  const enabledItems = items.filter(item => !item.disabled && !item.divider);
  let enabledIndex = 0;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        minWidth: '180px',
        padding: '6px 0',
        zIndex: 10000,
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={`divider-${index}`}
              style={{
                height: '1px',
                background: 'var(--border-color)',
                margin: '6px 0',
              }}
            />
          );
        }

        const isSelected = !item.disabled && enabledIndex === selectedIndex;
        const currentEnabledIndex = enabledIndex;
        if (!item.disabled) {
          enabledIndex++;
        }

        return (
          <div
            key={index}
            style={{
              padding: '6px 12px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              color: item.disabled ? 'var(--text-disabled)' : 'var(--text-color)',
              backgroundColor: isSelected ? 'var(--hover-bg)' : 'transparent',
              opacity: item.disabled ? 0.5 : 1,
              transition: 'background-color 0.15s ease',
            }}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => !item.disabled && handleItemMouseEnter(currentEnabledIndex)}
          >
            <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
