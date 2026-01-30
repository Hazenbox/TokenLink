/**
 * Import Preview Modal
 * Shows preview of import with conflicts and resolution options
 */

import React, { useState } from 'react';
import { Upload, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportPreview, ImportOptions, Conflict } from '@/models/export-types';
import { ConflictResolution } from './ConflictResolution';

export interface ImportPreviewModalProps {
  isOpen: boolean;
  preview: ImportPreview | null;
  onClose: () => void;
  onImport: (options: ImportOptions) => void;
}

export function ImportPreviewModal({
  isOpen,
  preview,
  onClose,
  onImport,
}: ImportPreviewModalProps) {
  const [options, setOptions] = useState<ImportOptions>({
    mergeStrategy: 'rename',
    importPalettes: true,
    importRules: false,
    importMappings: false,
  });

  if (!isOpen || !preview) return null;

  const { validation, conflicts, estimatedChanges, exportData } = preview;
  const hasErrors = validation.errors.length > 0;
  const hasConflicts = conflicts.length > 0;
  const canImport = validation.valid && !hasErrors;

  const errorConflicts = conflicts.filter((c) => c.severity === 'error');
  const warningConflicts = conflicts.filter((c) => c.severity === 'warning');

  const handleImport = () => {
    if (!canImport) return;
    onImport(options);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="bg-background border border-border rounded-lg shadow-lg flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-foreground-secondary" />
              <h2 className="text-lg font-semibold text-foreground">
                Import Preview
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Validation Errors */}
            {hasErrors && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600 mb-2">
                      Validation Errors
                    </p>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Warnings */}
            {validation.warnings.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-600 mb-2">
                      Warnings
                    </p>
                    <ul className="text-sm text-yellow-600 space-y-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Import Summary */}
            {canImport && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600 mb-2">
                      Import Summary
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-blue-600">
                      <div>
                        <span className="font-medium">{estimatedChanges.brandsToCreate}</span>{' '}
                        brand(s) to create
                      </div>
                      <div>
                        <span className="font-medium">{estimatedChanges.brandsToUpdate}</span>{' '}
                        brand(s) to update
                      </div>
                      <div>
                        <span className="font-medium">{estimatedChanges.palettesToCreate}</span>{' '}
                        palette(s) to create
                      </div>
                      <div>
                        <span className="font-medium">{estimatedChanges.palettesToUpdate}</span>{' '}
                        palette(s) to update
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">{estimatedChanges.totalVariables}</span>{' '}
                        total variables
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conflicts */}
            {hasConflicts && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  Conflicts ({conflicts.length})
                </h3>

                {/* Error Conflicts */}
                {errorConflicts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-red-600">
                      Blocking Issues ({errorConflicts.length})
                    </p>
                    {errorConflicts.map((conflict, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-md"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-red-600">{conflict.message}</p>
                            <p className="text-xs text-red-500 mt-1">
                              {conflict.entityType}: {conflict.entityName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warning Conflicts */}
                {warningConflicts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-yellow-600">
                      Warnings ({warningConflicts.length})
                    </p>
                    <ConflictResolution
                      conflicts={warningConflicts}
                      strategy={options.mergeStrategy}
                      onStrategyChange={(strategy) =>
                        setOptions({ ...options, mergeStrategy: strategy })
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* Import Options */}
            {canImport && (
              <div className="space-y-3 pt-2 border-t border-border">
                <h3 className="text-sm font-medium text-foreground">
                  Import Options
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.importPalettes}
                      onChange={(e) =>
                        setOptions({ ...options, importPalettes: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">
                      Import palettes ({exportData.palettes.length})
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.importMappings}
                      onChange={(e) =>
                        setOptions({ ...options, importMappings: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-foreground">
                      Import layer mappings
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!canImport}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
