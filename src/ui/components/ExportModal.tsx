/**
 * Export Modal
 * Modal for configuring and executing export with options
 */

import React, { useState, useEffect } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { Download, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExportOptions } from '@/models/export-types';
import { downloadExport, exportEverything } from '@/services/export-service';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    includePalettes: true,
    includeRules: false,
    includeMappings: false,
    author: '',
    description: '',
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const brands = useBrandStore((state) => state.brands);
  const palettes = usePaletteStore((state) => state.getAllPalettes());

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setOptions({
        includePalettes: true,
        includeRules: false,
        includeMappings: false,
        author: '',
        description: '',
      });
      setExportSuccess(false);
    }
  }, [isOpen]);

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      downloadExport(options);
      setExportSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    const exportData = exportEverything(options);
    console.log('Export Preview:', exportData);
    alert(`Export will include:\n- ${exportData.stats.brandsCount} brands\n- ${exportData.stats.palettesCount} palettes\n- ${exportData.stats.totalVariables} variables\n- ${exportData.stats.totalCollections} collections`);
  };

  if (!isOpen) return null;

  const stats = {
    brandsCount: brands.length,
    palettesCount: options.includePalettes ? palettes.length : 0,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-foreground-secondary" />
              <h2 className="text-lg font-semibold text-foreground">
                Export Configuration
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Success Message */}
            {exportSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-600">Export successful!</p>
              </div>
            )}

            {/* What to Include */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">
                What to include
              </Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Brands ({stats.brandsCount})
                  </span>
                  <span className="text-xs text-foreground-tertiary ml-auto">
                    Required
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includePalettes}
                    onChange={(e) =>
                      setOptions({ ...options, includePalettes: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Palettes ({palettes.length})
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeRules}
                    onChange={(e) =>
                      setOptions({ ...options, includeRules: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Automation Rules (0)
                  </span>
                  <span className="text-xs text-foreground-tertiary ml-auto">
                    Coming soon
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeMappings}
                    onChange={(e) =>
                      setOptions({ ...options, includeMappings: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Layer Mappings
                  </span>
                </label>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="author" className="text-sm font-medium text-foreground">
                  Author (optional)
                </Label>
                <Input
                  id="author"
                  type="text"
                  placeholder="Your name"
                  value={options.author}
                  onChange={(e) =>
                    setOptions({ ...options, author: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Description (optional)
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Brief description of this export"
                  value={options.description}
                  onChange={(e) =>
                    setOptions({ ...options, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-600">
                <p className="font-medium mb-1">Export will include:</p>
                <ul className="space-y-0.5 ml-3 list-disc">
                  <li>{stats.brandsCount} brand(s) with all collections and variables</li>
                  {options.includePalettes && (
                    <li>{stats.palettesCount} color palette(s)</li>
                  )}
                  {options.includeMappings && (
                    <li>Layer mapping configurations</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isExporting}
            >
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExport}
              disabled={isExporting || exportSuccess}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Exporting...
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Exported!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
