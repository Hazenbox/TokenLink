/**
 * Automate App - Brand Automation System
 * Main component with sidebar and Figma-style layout
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, Download, FolderInput, Terminal } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { BrandSidebar } from './components/brands/BrandSidebar';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';
import { CollectionsGroupsPanel } from './components/variables/CollectionsGroupsPanel';
import { VariablesErrorBoundary } from './components/variables/VariablesErrorBoundary';
import { Toast } from './components/Toast';
import { SyncProgressModal } from './components/SyncProgressModal';
import { ExportModal } from './components/ExportModal';
import { ImportPreviewModal } from './components/ImportPreviewModal';
import { ImportResults } from './components/ImportResults';
import { ConsoleLogViewer } from './components/ConsoleLogViewer';
import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { useFigmaMessages } from './hooks/useFigmaMessages';
import { useConsoleLogs } from './hooks/useConsoleLogs';
import { BrandGenerator } from '@/lib/brand-generator';
import { parseImportFile, createImportPreview } from '@/services/import-service';
import { executeImport } from '@/services/import-execution';
import { ImportPreview, ImportOptions, ImportResult } from '@/models/export-types';

// Loading state style constants (prevents object recreation on every render)
const LOADING_CONTAINER_STYLE = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  gap: '16px',
  color: 'var(--text-secondary)'
};

const LOADING_TITLE_STYLE = { fontSize: '14px', fontWeight: 500 };
const LOADING_SUBTITLE_STYLE = { fontSize: '12px' };

export function AutomateApp() {
  // Handle Figma plugin messages for sync responses
  const { notification, progress, clearNotification } = useFigmaMessages();
  
  // Console logs
  const { logs, isVisible, clearLogs, toggleVisibility, closeConsole } = useConsoleLogs();
  
  // Optimized: Subscribe to primitive data only - no function calls to prevent infinite re-renders
  const { 
    activeBrandId,
    brandsById,
    brands, 
    syncBrandWithLayers, 
    syncAllBrands, 
    syncStatus,
    syncAttempts,
    isLoading
  } = useBrandStore((state) => ({
    activeBrandId: state.activeBrandId,
    brandsById: state.brandsById,
    brands: state.brands,
    syncBrandWithLayers: state.syncBrandWithLayers,
    syncAllBrands: state.syncAllBrands,
    syncStatus: state.syncStatus,
    syncAttempts: state.syncAttempts,
    isLoading: state.isLoading,
  }), shallow);
  
  // Compute derived values with useMemo to prevent infinite loops
  const activeBrand = useMemo(() => {
    if (activeBrandId === '__all__') return null;
    if (!brandsById) return brands.find((b) => b.id === activeBrandId) || null;
    return brandsById.get(activeBrandId || '') || null;
  }, [activeBrandId, brandsById, brands]);
  
  const canSync = useMemo(() => {
    const oneMinuteAgo = Date.now() - 60000;
    const recentAttempts = syncAttempts.filter(
      (a) => a.timestamp > oneMinuteAgo
    );
    return recentAttempts.length < 5;
  }, [syncAttempts]);
  
  // Show loading state during initialization
  if (isLoading && brands.length === 0) {
    return (
      <div style={LOADING_CONTAINER_STYLE}>
        <div style={LOADING_TITLE_STYLE}>Loading brands...</div>
        <div style={LOADING_SUBTITLE_STYLE}>Initializing Automate tab</div>
      </div>
    );
  }
  
  // Import/Export modals state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Memoize computed values to prevent recalculation on every render
  const isAllBrands = useMemo(() => activeBrandId === '__all__', [activeBrandId]);
  
  const validation = useMemo(() => {
    // Handle "All" brands case
    if (activeBrandId === '__all__') {
      return { 
        valid: brands.length > 0, 
        errors: brands.length === 0 ? ['No brands to sync'] : [], 
        warnings: [] 
      };
    }
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand, activeBrandId, brands]);
  
  const canSyncBrand = useMemo(() => 
    (isAllBrands || activeBrand) && validation.valid && canSync && syncStatus === 'idle',
    [isAllBrands, activeBrand, validation.valid, canSync, syncStatus]
  );
  
  // Memoize callbacks to prevent recreation on every render
  const handleSync = useCallback(async () => {
    if (activeBrandId === '__all__') {
      await syncAllBrands();
      return;
    }
    if (!activeBrand) return;
    await syncBrandWithLayers(activeBrand.id);
  }, [activeBrandId, activeBrand, syncAllBrands, syncBrandWithLayers]);
  
  const syncButtonContent = useMemo(() => {
    switch (syncStatus) {
      case 'validating':
      case 'previewing':
      case 'syncing':
        return (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Syncing...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-3 h-3" />
            <span>Synced</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <Upload className="w-3 h-3" />
            <span>{isAllBrands ? 'Sync all brands to figma' : 'Sync to Figma'}</span>
          </>
        );
    }
  }, [syncStatus, isAllBrands]);
  
  // Memoize sync button className to prevent recreation on every render
  const syncButtonClassName = useMemo(() => {
    const baseClasses = 'h-6 px-2 text-xs font-normal flex items-center gap-1.5 transition-colors';
    const stateClasses = canSyncBrand 
      ? 'text-foreground hover:text-foreground-secondary' 
      : 'text-foreground-tertiary cursor-not-allowed opacity-50';
    const statusClasses = syncStatus === 'success' ? 'text-green-500' 
      : syncStatus === 'error' ? 'text-red-500' 
      : '';
    
    return `${baseClasses} ${stateClasses} ${statusClasses}`.trim();
  }, [canSyncBrand, syncStatus]);
  
  // Memoize export handler
  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);
  
  // Memoize modal close handlers to prevent recreation on every render
  const handleCloseExportModal = useCallback(() => {
    setShowExportModal(false);
  }, []);
  
  const handleCloseImportPreview = useCallback(() => {
    setShowImportPreview(false);
  }, []);
  
  const handleCloseImportResults = useCallback(() => {
    setShowImportResults(false);
  }, []);
  
  // Memoize import handler
  const handleImportClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Parse the file
          const parseResult = await parseImportFile(file);
          
          if (!parseResult.success || !parseResult.data) {
            alert(`Failed to parse import file:\n${parseResult.errors.join('\n')}`);
            return;
          }
          
          // Create preview
          const preview = createImportPreview(parseResult.data);
          setImportPreview(preview);
          setShowImportPreview(true);
        } catch (error) {
          console.error('Import error:', error);
          alert('Failed to import file. Please check the file format.');
        }
      }
    };
    input.click();
  }, []);
  
  // Memoize import execution handler
  const handleImport = useCallback(async (options: ImportOptions) => {
    if (!importPreview) return;
    
    try {
      const result = await executeImport(importPreview.exportData, options);
      setImportResult(result);
      setShowImportPreview(false);
      setShowImportResults(true);
      
      // Refresh UI after import
      useBrandStore.getState().refreshFigmaData();
    } catch (error) {
      console.error('Import execution error:', error);
      alert('Import failed. Please try again.');
    }
  }, [importPreview]);
  
  // Initialize palettes and brands on mount (order matters!)
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        console.log('[Init] Starting data load...');
        console.log('[Init] Environment: First load detection in progress');
        
        // Load palettes first (brands reference them)
        await usePaletteStore.getState().loadPalettes();
        if (!mounted) return;
        console.log('[Init] Palettes loaded and initialized');
        
        // Then load brands
        await useBrandStore.getState().loadBrands();
        if (!mounted) return;
        console.log('[Init] Brands loaded');
        
        // Check if this was a first-time initialization
        const paletteCount = usePaletteStore.getState().palettes.length;
        const brandCount = useBrandStore.getState().brands.length;
        console.log(`[Init] State: ${paletteCount} palettes, ${brandCount} brands`);
        
        // Finally refresh UI (now safe - data is loaded)
        useBrandStore.getState().refreshFigmaData();
        console.log('[Init] UI refreshed');
        
        console.log('[Init] Initialization complete ✓');
      } catch (error) {
        console.error('[Init] Error during initialization:', error);
        // Don't call refreshFigmaData on error - let loading state persist
        // Error boundary will catch any rendering errors
        if (mounted) {
          console.error('[Init] Failed to initialize. Please reload the plugin.');
        }
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  return (
    <div className="h-full w-full flex flex-col bg-background relative overflow-hidden min-w-0">
      {/* Main Header with Import, Export, and Sync Buttons */}
      <div className="h-9 px-3 py-1.5 border-b border-border/30 flex-shrink-0 flex items-center justify-between bg-background">
        <h1 className="text-xs font-semibold text-foreground-secondary">
          Automate brands
        </h1>
        <div className="flex items-center gap-2">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="h-6 px-2 text-xs font-normal flex items-center gap-1.5 transition-colors text-foreground hover:text-foreground-secondary"
            title="Export brands and palettes"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
          
          {/* Console Button */}
          <button
            onClick={toggleVisibility}
            className="h-6 px-2 text-xs font-normal flex items-center gap-1.5 transition-colors text-foreground hover:text-foreground-secondary"
            title="Toggle console"
          >
            <Terminal className="w-3 h-3" />
            <span>Console</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-surface-elevated text-foreground-secondary">
                {logs.length}
              </span>
            )}
            {logs.filter(l => l.level === 'error').length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>
          
          {/* Import Button */}
          <button
            onClick={handleImportClick}
            className="h-6 px-2 text-xs font-normal flex items-center gap-1.5 transition-colors text-foreground hover:text-foreground-secondary"
            title="Import brands and palettes"
          >
            <FolderInput className="w-3 h-3" />
            <span>Import</span>
          </button>
          
          {/* Separator */}
          <div className="w-px h-4 bg-border/50" />
          
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={!canSyncBrand}
            className={syncButtonClassName}
          >
            {syncButtonContent}
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Left: Brand Sidebar */}
        <BrandSidebar />
        
        {/* Middle: Figma-style Variables UI */}
        <div className="flex-1 bg-background overflow-hidden flex max-w-full min-w-0">
          {/* Collections & Groups Combined Panel */}
          <VariablesErrorBoundary>
            <CollectionsGroupsPanel />
          </VariablesErrorBoundary>
          
          {/* Variable Table - Takes remaining space */}
          <VariablesErrorBoundary>
            <div className="flex-1 overflow-hidden min-w-0 bg-background">
              <BrandVariableTable />
            </div>
          </VariablesErrorBoundary>
        </div>
        
        {/* Right: Configuration Panel - Collapsible */}
        <VariablesErrorBoundary>
          <BrandConfigPanel />
        </VariablesErrorBoundary>
      </div>
      
      {/* Sync Progress Modal */}
      {progress && <SyncProgressModal progress={progress} />}
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={handleCloseExportModal}
      />
      
      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        preview={importPreview}
        onClose={handleCloseImportPreview}
        onImport={handleImport}
      />
      
      {/* Import Results Modal */}
      <ImportResults
        isOpen={showImportResults}
        result={importResult}
        onClose={handleCloseImportResults}
      />
      
      {/* Toast Notification */}
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}
      
      {/* Console Log Viewer - Fixed bottom overlay */}
      <ConsoleLogViewer
        logs={logs}
        isVisible={isVisible}
        onClose={closeConsole}
        onClear={clearLogs}
      />
    </div>
  );
}
