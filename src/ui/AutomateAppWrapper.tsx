/**
 * AutomateApp Initialization Wrapper
 * Handles data loading BEFORE mounting AutomateApp to prevent React #185 infinite render loop
 * 
 * Root Cause: AutomateApp's hooks (useBrandStore selector, useMemo, etc.) were running during
 * initialization and causing re-render loops when the store updated. By loading data FIRST
 * and only mounting AutomateApp AFTER, we eliminate all initialization-related re-render issues.
 */

import { useEffect, useState } from 'react';
import { AutomateApp } from './AutomateApp';
import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';

// Loading state style constants
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

export function AutomateAppWrapper() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        console.log('[Wrapper] Starting initialization...');
        
        // Load palettes first (brands reference them)
        await usePaletteStore.getState().loadPalettes();
        if (!mounted) return;
        console.log('[Wrapper] Palettes loaded');
        
        // Then load brands
        await useBrandStore.getState().loadBrands();
        if (!mounted) return;
        console.log('[Wrapper] Brands loaded');
        
        // Refresh Figma data
        useBrandStore.getState().refreshFigmaData();
        console.log('[Wrapper] Figma data refreshed');
        
        // Set global flag for message handlers
        (window as any).__VARCAR_INITIALIZED__ = true;
        
        // NOW it's safe to mount AutomateApp
        if (mounted) {
          setIsReady(true);
          console.log('[Wrapper] Initialization complete - mounting AutomateApp ✓');
        }
      } catch (err) {
        console.error('[Wrapper] Initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize');
          // Still set ready to show error state
          (window as any).__VARCAR_INITIALIZED__ = true;
          setIsReady(true);
        }
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, []);
  
  // Show loading state while initializing
  if (!isReady) {
    return (
      <div style={LOADING_CONTAINER_STYLE}>
        <div style={LOADING_TITLE_STYLE}>Loading Automate...</div>
        <div style={LOADING_SUBTITLE_STYLE}>Initializing brands and palettes</div>
      </div>
    );
  }
  
  // Show error state if initialization failed
  if (error) {
    return (
      <div style={LOADING_CONTAINER_STYLE}>
        <div style={{ ...LOADING_TITLE_STYLE, color: 'var(--error-color)' }}>
          Initialization Error
        </div>
        <div style={LOADING_SUBTITLE_STYLE}>{error}</div>
        <div style={{ fontSize: '11px', marginTop: '8px' }}>
          Please reload the plugin
        </div>
      </div>
    );
  }
  
  // ONLY render AutomateApp after initialization is complete
  // By this point, all data is loaded and AutomateApp can safely subscribe to stores
  return <AutomateApp />;
}
