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
  const syncBrand = useBrandStore((state) => state.syncBrand);
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
    if (!activeBrand) return;

    const validation = BrandGenerator.validate(activeBrand);
    if (!validation.valid) {
      alert('Cannot sync: Brand has validation errors. Please fix them first.');
      return;
    }

    if (!canSync) {
      alert('Rate limit exceeded. Please wait before syncing again.');
      return;
    }

    const result = await syncBrand(activeBrand.id);
    
    if (result.success) {
      console.log('Sync successful:', result);
    } else {
      alert(`Sync failed: ${result.errors.join(', ')}`);
    }
  };

  const handleExport = () => {
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

  if (!activeBrand) {
    return (
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="text-center text-gray-500 text-sm">
          Select a brand to sync
        </div>
      </div>
    );
  }

  const validation = BrandGenerator.validate(activeBrand);
  const canSyncBrand = validation.valid && canSync && syncStatus === 'idle';

  return (
    <div className="border-t border-gray-200 bg-white">
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
                Sync to Figma
              </>
            )}
          </Button>

          {!canSyncBrand && syncStatus === 'idle' && (
            <div className="mt-2 text-xs text-orange-600">
              {!validation.valid && '⚠ Fix validation errors first'}
              {validation.valid && !canSync && '⚠ Rate limit: Wait before syncing again'}
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
        <div className="text-xs text-gray-500 space-y-1">
          {activeBrand.syncedAt ? (
            <div>
              Last synced: {new Date(activeBrand.syncedAt).toLocaleString()}
            </div>
          ) : (
            <div>Never synced</div>
          )}
          {activeBrand.updatedAt > (activeBrand.syncedAt || 0) && activeBrand.syncedAt && (
            <div className="text-orange-600">⚠ Modified since last sync</div>
          )}
        </div>
      </div>
    </div>
  );
}
