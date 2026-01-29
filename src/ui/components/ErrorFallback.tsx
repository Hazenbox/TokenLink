import React from 'react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

/**
 * Fallback UI component shown when an error is caught by ErrorBoundary
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'var(--text-color)',
        backgroundColor: 'var(--card-bg)',
        height: '100%',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: '20px',
          opacity: 0.5,
        }}
      >
        ⚠️
      </div>
      
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '12px',
        }}
      >
        Oops! Something went wrong
      </h2>
      
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          maxWidth: '400px',
        }}
      >
        We encountered an unexpected error. Don't worry, your data is safe.
      </p>
      
      {error && (
        <details
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'var(--secondary-bg)',
            borderRadius: '6px',
            maxWidth: '500px',
            textAlign: 'left',
            fontSize: '12px',
            fontFamily: 'var(--font-geist-mono)',
          }}
        >
          <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
            Error details
          </summary>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {error.message}
          </pre>
        </details>
      )}
      
      {resetError && (
        <button
          onClick={resetError}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};
