/**
 * Automate App - Brand Automation System
 * Main component with sidebar and Figma-style layout
 */

import React, { useEffect, useMemo } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { BrandSidebar } from './components/brands/BrandSidebar';
import { BrandConfigPanel } from './components/BrandConfigPanel';
import { BrandVariableTable } from './components/BrandVariableTable';
import { CollectionsGroupsPanel } from './components/variables/CollectionsGroupsPanel';
import { VariablesErrorBoundary } from './components/variables/VariablesErrorBoundary';
import { Toast } from './components/Toast';
import { SyncProgressModal } from './components/SyncProgressModal';
import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { useFigmaMessages } from './hooks/useFigmaMessages';
import { BrandGenerator } from '@/lib/brand-generator';

export function AutomateApp() {
  // Handle Figma plugin messages for sync responses
  const { notification, progress, clearNotification } = useFigmaMessages();
  
  // Sync logic
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const syncBrandWithLayers = useBrandStore((state) => state.syncBrandWithLayers);
  const syncStatus = useBrandStore((state) => state.syncStatus);
  const canSync = useBrandStore((state) => state.canSync());
  
  const validation = useMemo(() => {
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand]);
  
  const canSyncBrand = activeBrand && validation.valid && canSync && syncStatus === 'idle';
  
  const handleSync = async () => {
    if (!activeBrand) return;
    await syncBrandWithLayers(activeBrand.id);
  };
  
  const getSyncButtonContent = () => {
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
            <span>Sync</span>
          </>
        );
    }
  };
  
  // Initialize palettes and brands on mount (order matters!)
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[Init] Starting data load...');
        console.log('[Init] Environment: First load detection in progress');
        
        // Load palettes first (brands reference them)
        await usePaletteStore.getState().loadPalettes();
        console.log('[Init] Palettes loaded and initialized');
        
        // Then load brands
        await useBrandStore.getState().loadBrands();
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
        // Still try to refresh UI with whatever data we have
        useBrandStore.getState().refreshFigmaData();
      }
    };
    
    loadData();
  }, []);
  
  return (
    <div className="h-full w-full flex flex-col bg-background relative overflow-hidden min-w-0">
      {/* Main Header with Sync Button */}
      <div className="h-9 px-3 py-1.5 border-b border-border/30 flex-shrink-0 flex items-center justify-between bg-background">
        <h1 className="text-xs font-semibold text-foreground-secondary">
          Brand Variables
        </h1>
        <button
          onClick={handleSync}
          disabled={!canSyncBrand}
          className={`
            h-6 px-2 rounded text-xs font-medium flex items-center gap-1.5 transition-colors
            ${canSyncBrand 
              ? 'bg-surface-elevated hover:bg-interactive-hover text-foreground' 
              : 'bg-surface border border-border text-foreground-tertiary cursor-not-allowed opacity-50'}
            ${syncStatus === 'success' ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
            ${syncStatus === 'error' ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}
          `}
        >
          {getSyncButtonContent()}
        </button>
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
      
      {/* Toast Notification */}
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={clearNotification}
        />
      )}
    </div>
  );
}
