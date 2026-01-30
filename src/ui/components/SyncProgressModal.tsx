/**
 * Sync Progress Modal
 * Compact progress indicator showing sync status in bottom-right corner
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ProgressData {
  message: string;
  currentVariables?: number;
  totalVariables: number;
  errors?: number;
  isGenerating?: boolean;
}

interface SyncProgressModalProps {
  progress: ProgressData;
}

export function SyncProgressModal({ progress }: SyncProgressModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Calculate progress percentage based on variables, not steps
  const current = progress.currentVariables || 0;
  const total = progress.totalVariables || 1;
  const percentage = Math.round((current / total) * 100);

  return (
    <div
      className={`
        fixed bottom-4 right-4 w-72
        bg-card border border-border rounded-lg shadow-2xl
        backdrop-blur-lg
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        zIndex: 1900,
        animation: 'subtleAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="p-3 space-y-2">
        {/* Header - no icon */}
        <h3 className="text-sm font-semibold text-foreground">
          {progress.isGenerating ? 'Generating Variables...' : 'Syncing to Figma...'}
        </h3>

        {/* Variables count - main indicator */}
        <div className="text-xs font-medium text-foreground">
          {current.toLocaleString()} / {total.toLocaleString()} variables
        </div>

        {/* Progress bar - functional, tied to variables */}
        <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Status message */}
        <div className="text-xs text-foreground-secondary">
          {progress.message}
        </div>

        {/* Errors - only when they occur */}
        {progress.errors && progress.errors > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-950/20 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3" />
            <span>{progress.errors} error{progress.errors > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes subtleAppear {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
