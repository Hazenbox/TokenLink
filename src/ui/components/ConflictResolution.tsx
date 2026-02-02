/**
 * Conflict Resolution Component
 * UI for selecting merge strategy and handling conflicts
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Conflict } from '@/models/export-types';

export interface ConflictResolutionProps {
  conflicts: Conflict[];
  strategy: 'skip' | 'overwrite' | 'rename' | 'merge';
  onStrategyChange: (strategy: 'skip' | 'overwrite' | 'rename' | 'merge') => void;
}

type ConflictStrategy = 'skip' | 'overwrite' | 'rename' | 'merge';

const STRATEGIES = [
  {
    value: 'skip' as const,
    label: 'Skip',
    description: 'Don\'t import conflicting items',
    icon: '⏭️',
  },
  {
    value: 'overwrite' as const,
    label: 'Overwrite',
    description: 'Replace existing items with imported',
    icon: '♻️',
  },
  {
    value: 'rename' as const,
    label: 'Rename',
    description: 'Import with new name (e.g., "Name (1)")',
    icon: '✏️',
  },
  {
    value: 'merge' as const,
    label: 'Merge',
    description: 'Combine existing and imported data',
    icon: '🔗',
  },
];

// Memoized StrategyOption component to prevent inline arrow functions in map
interface StrategyOptionProps {
  strategy: ConflictStrategy;
  currentStrategy: ConflictStrategy;
  icon: string;
  label: string;
  description: string;
  onStrategyChange: (strategy: ConflictStrategy) => void;
}

const StrategyOption = React.memo(function StrategyOption({
  strategy,
  currentStrategy,
  icon,
  label,
  description,
  onStrategyChange
}: StrategyOptionProps) {
  return (
    <label
      className={`
        flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors
        ${
          currentStrategy === strategy
            ? 'bg-blue-500/10 border border-blue-500/30'
            : 'bg-background border border-border hover:border-border/60'
        }
      `}
    >
      <input
        type="radio"
        name="strategy"
        value={strategy}
        checked={currentStrategy === strategy}
        onChange={(e) => onStrategyChange(e.target.value as ConflictStrategy)}
        className="mt-0.5"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium text-foreground">
            {label}
          </span>
        </div>
        <p className="text-xs text-foreground-secondary mt-0.5">
          {description}
        </p>
      </div>
    </label>
  );
});

export function ConflictResolution({
  conflicts,
  strategy,
  onStrategyChange,
}: ConflictResolutionProps) {
  return (
    <div className="space-y-3">
      {/* Strategy Selection */}
      <div className="p-3 bg-card border border-border rounded-md">
        <p className="text-sm font-medium text-foreground mb-3">
          How should conflicts be resolved?
        </p>
        <div className="space-y-2">
          {STRATEGIES.map((s) => (
            <StrategyOption
              key={s.value}
              strategy={s.value}
              currentStrategy={strategy}
              icon={s.icon}
              label={s.label}
              description={s.description}
              onStrategyChange={onStrategyChange}
            />
          ))}
        </div>
      </div>

      {/* Conflict List */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground-secondary">
          Affected items:
        </p>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-yellow-600 font-medium">
                  {conflict.entityType}: {conflict.entityName}
                </p>
                <p className="text-yellow-600/80 text-[11px] mt-0.5">
                  {conflict.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Impact */}
      <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded text-xs">
        <p className="text-blue-600">
          <span className="font-medium">With "{STRATEGIES.find((s) => s.value === strategy)?.label}" strategy:</span>
          {strategy === 'skip' && ' Conflicting items will be skipped.'}
          {strategy === 'overwrite' && ' Existing items will be replaced.'}
          {strategy === 'rename' && ' Conflicting items will be imported with new names.'}
          {strategy === 'merge' && ' Data will be combined where possible.'}
        </p>
      </div>
    </div>
  );
}
