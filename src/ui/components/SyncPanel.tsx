/**
 * Sync Panel
 * Manual sync controls and status
 */

import React, { useState } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  RotateCcw,
  Undo,
  Redo,
  Download,
  FolderInput
} from 'lucide-react';

export function SyncPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const brands = useBrandStore((state) => state.brands);
  const syncBrand = useBrandStore((state) => state.syncBrand);
  const syncAllBrands = useBrandStore((state) => state.syncAllBrands);
  const syncStatus = useBrandStore((state) => state.syncStatus);
  const canSync = useBrandStore((state) => state.canSync());
  const canUndo = useBrandStore((state) => state.canUndo());
  const canRedo = useBrandStore((state) => state.canRedo());
  const undo = useBrandStore((state) => state.undo);
  const redo = useBrandStore((state) => state.redo);
  const exportBrands = useBrandStore((state) => state.exportBrands);
  const importBrands = useBrandStore((state) => state.importBrands);

  const [showPreview, setShowPreview] = useState(false);

  const handleSync = async () => {
    // Check if syncing all brands
    if (activeBrandId === '__all__') {
      await syncAllBrands();
      return;
    }

    if (!activeBrand) return;

    // Validation happens in the store before syncing
    // User will see error/success toast via useFigmaMessages hook
    await syncBrand(activeBrand.id);
  };

  const handleExport = () => {
    // Export all brands when "All" is selected
    if (activeBrandId === '__all__') {
      const json = exportBrands(brands.map(b => b.id));
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'all_brands.json';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!activeBrand) return;
    
    const json = exportBrands([activeBrand.id]);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBrand.name.replace(/\s+/g, '_')}_brand.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          importBrands(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Handle "All" brands selection
  const isAllBrands = activeBrandId === '__all__';
  
  if (!activeBrand && !isAllBrands) {
    return (
      <div className="border-t border-border bg-card p-4">
        <div className="text-center text-foreground-secondary text-sm">
          Select a brand to sync
        </div>
      </div>
    );
  }

  // Validation
  let validation = { valid: true, errors: [], warnings: [] };
  if (isAllBrands) {
    // For "All", check if we have any brands
    validation.valid = brands.length > 0;
    if (!validation.valid) {
      validation.errors.push('No brands to sync');
    }
  } else if (activeBrand) {
    validation = BrandGenerator.validate(activeBrand);
  }
  
  const canSyncBrand = validation.valid && canSync && syncStatus === 'idle';

  return (
    <div className="border-t border-border bg-card">
      <div className="p-4 space-y-4">
        {/* Sync Button */}
        <div>
          <Button
            onClick={handleSync}
            disabled={!canSyncBrand}
            className="w-full"
            size="lg"
          >
            {syncStatus === 'syncing' || syncStatus === 'validating' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {syncStatus === 'validating' ? 'Validating...' : 'Syncing...'}
              </>
            ) : syncStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Synced Successfully
              </>
            ) : syncStatus === 'error' ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Sync Failed
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {isAllBrands ? 'Sync All Brands to Figma' : 'Sync to Figma'}
              </>
            )}
          </Button>

          {!canSyncBrand && syncStatus === 'idle' && (
            <div className="mt-2 text-xs text-orange-600">
              {!validation.valid && '⚠ Fix validation errors first'}
              {validation.valid && !canSync && '⚠ Rate limit: Wait before syncing again'}
            </div>
          )}
          
          {isAllBrands && canSyncBrand && (
            <div className="mt-2 text-xs text-blue-600">
              ℹ️ This will sync {brands.length} brands as a unified design system
            </div>
          )}
        </div>

        {/* History Controls */}
        <div className="flex gap-2">
          <Button
            onClick={undo}
            disabled={!canUndo}
            variant="outline"
            size="sm"
            className="flex-1"
            title="Undo"
          >
            <Undo className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={redo}
            disabled={!canRedo}
            variant="outline"
            size="sm"
            className="flex-1"
            title="Redo"
          >
            <Redo className="w-4 h-4 mr-1" />
            Redo
          </Button>
        </div>

        {/* Export/Import Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="flex-1"
            title="Export brand"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button
            onClick={handleImport}
            variant="outline"
            size="sm"
            className="flex-1"
            title="Import brands"
          >
            <FolderInput className="w-4 h-4 mr-1" />
            Import
          </Button>
        </div>

        {/* Sync Info */}
        <div className="text-xs text-foreground-tertiary space-y-1">
          {isAllBrands ? (
            <>
              <div className="font-medium text-foreground">Unified Multi-Brand Sync</div>
              <div>
                {brands.length} brands will be synced with merged palettes and unified collections
              </div>
            </>
          ) : activeBrand ? (
            <>
              {activeBrand.syncedAt ? (
                <div>
                  Last synced: {new Date(activeBrand.syncedAt).toLocaleString()}
                </div>
              ) : (
                <div>Never synced</div>
              )}
              {activeBrand.updatedAt > (activeBrand.syncedAt || 0) && activeBrand.syncedAt && (
                <div className="text-orange-500">⚠ Modified since last sync</div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
