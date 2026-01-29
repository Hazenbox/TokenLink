import React from 'react';

export interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function Toast({ type, message, onClose }: ToastProps) {
  // Split message into title (first line) and body (rest)
  const lines = message.split('\n');
  const title = lines[0];
  const body = lines.slice(1).join('\n').trim();
  
  // Determine if body should use monospace (contains structured data like collections)
  const hasStructuredData = body.includes('[Collection:') || body.includes('  ');
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        padding: '12px 16px',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 2000,
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'subtleAppear 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Header with title and close button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 600,
          color: type === 'success' ? 'var(--success-color)' : 'var(--error-color)',
          flex: 1
        }}>
          {title}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: '1',
            padding: '0',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            e.currentTarget.style.color = 'var(--text-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
      
      {/* Message body (if exists) */}
      {body && (
        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontFamily: hasStructuredData ? 'var(--font-geist-mono)' : 'var(--font-geist-sans)',
          whiteSpace: 'pre-line',
          lineHeight: '1.5',
        }}>
          {body}
        </div>
      )}
    </div>
  );
}
