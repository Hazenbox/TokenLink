/**
 * Variables Error Boundary
 * Catches errors in Figma Variables UI components
 */

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VariablesErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Variables UI] Error caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Variables UI Error
            </h3>
            <p className="text-xs text-foreground-secondary mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="space-y-2">
              <Button onClick={this.handleReset} size="sm">
                Retry
              </Button>
              <p className="text-[10px] text-foreground-tertiary">
                Check console for detailed error information
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
