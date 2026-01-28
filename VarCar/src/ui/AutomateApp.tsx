/**
 * Automate App - Brand Automation System
 * Main component with sidebar and Figma-style layout
 */

import React, { useEffect } from 'react';
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

export function AutomateApp() {
  // Handle Figma plugin messages for sync responses
  const { notification, progress, clearNotification } = useFigmaMessages();
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
    <div className="h-full w-full flex bg-background relative overflow-hidden min-w-0">
      
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
          <div className="flex-1 overflow-hidden min-w-0">
            <BrandVariableTable />
          </div>
        </VariablesErrorBoundary>
      </div>
      
      {/* Right: Configuration Panel - Collapsible */}
      <VariablesErrorBoundary>
        <BrandConfigPanel />
      </VariablesErrorBoundary>
      
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
