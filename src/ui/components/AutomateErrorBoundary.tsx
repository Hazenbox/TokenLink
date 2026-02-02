/**
 * Error Boundary for Automate Tab
 * Catches and displays errors gracefully with recovery option
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useBrandStore } from '@/store/brand-store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AutomateErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Automate Error Boundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reload brands to recover
    useBrandStore.getState().loadBrands();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          textAlign: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--error-color)' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
            {this.state.error?.message || 'An unexpected error occurred in the Automate tab.'}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            Reload Automate Tab
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
