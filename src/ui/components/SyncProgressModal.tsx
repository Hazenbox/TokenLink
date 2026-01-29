/**
 * Sync Progress Modal
 * Non-blocking progress indicator showing sync status in bottom-right corner
 */

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProgressData {
  step: number;
  total: number;
  message: string;
  currentVariables?: number;
  totalVariables?: number;
  errors?: number;
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

  // Calculate progress percentage
  const percentage = Math.round((progress.step / progress.total) * 100);
  
  // Get phase-specific icon and color
  const getPhaseIcon = () => {
    if (progress.step === progress.total) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (progress.step === 1) {
      return <AlertTriangle className="w-4 h-4 text-foreground-tertiary" />;
    }
    return <Loader2 className="w-4 h-4 text-foreground-tertiary animate-spin" />;
  };

  // Format variable count
  const getVariableCountDisplay = () => {
    if (progress.currentVariables !== undefined && progress.totalVariables !== undefined) {
      return `${progress.currentVariables.toLocaleString()} / ${progress.totalVariables.toLocaleString()} variables`;
    }
    return null;
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 w-80
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
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          {getPhaseIcon()}
          <h3 className="text-sm font-semibold text-foreground">
            Syncing to Figma...
          </h3>
        </div>

        {/* Progress info */}
        <div className="space-y-2">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-foreground-secondary">
            <span>Step {progress.step} of {progress.total}</span>
            <span className="font-medium text-foreground">{percentage}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground-secondary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Variable count (if available) */}
          {getVariableCountDisplay() && (
            <div className="text-xs font-medium text-foreground">
              {getVariableCountDisplay()}
            </div>
          )}

          {/* Status message */}
          <div className="text-xs text-foreground-secondary leading-relaxed">
            {progress.message}
          </div>

          {/* Error count (if any errors) */}
          {progress.errors && progress.errors > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-500 bg-amber-950/20 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              <span>{progress.errors} error{progress.errors > 1 ? 's' : ''} occurred</span>
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="text-[10px] text-foreground-tertiary italic pt-1 border-t border-border/30">
          This window won't block your work
        </div>
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
