/**
 * Hook for handling Figma plugin messages
 * Centralized message handler for sync responses and progress updates
 */

import { useEffect, useState, useCallback } from 'react';
import { useBrandStore } from '@/store/brand-store';

export interface ToastNotification {
  type: 'success' | 'error';
  message: string;
  duration?: number;
}

interface SyncSuccessData {
  success: true;
  brandId: string;
  timestamp: number;
  variablesSynced: number;
  collectionsCreated?: number;
  modesAdded: string[];
  errors: string[];
  warnings: string[];
  graph?: any;
}

interface SyncErrorData {
  success: false;
  errors: string[];
  warnings: string[];
}

interface ProgressData {
  step: number;
  total: number;
  message: string;
  currentVariables?: number;
  totalVariables?: number;
}

export function useFigmaMessages() {
  const [notification, setNotification] = useState<ToastNotification | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  
  const updateSyncStatus = useBrandStore((state) => state.updateSyncStatusFromPlugin);

  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;

    console.log('[useFigmaMessages] Received message:', msg.type);

    switch (msg.type) {
      // Multi-layer sync success
      case 'multi-layer-sync-success': {
        const data = msg.data as SyncSuccessData;
        console.log('[useFigmaMessages] Multi-layer sync success:', data);
        
        // Update brand store
        updateSyncStatus('success', data);
        
        // Build success message
        const layers = [
          'Primitives',
          'Semi Semantics',
          'Colour Mode',
          'Background Level',
          'Fill Emphasis',
          'Interaction State',
          'Appearance',
          'Theme'
        ];
        
        const message = data.errors.length > 0
          ? `⚠ Sync Complete with Errors!\n${data.variablesSynced.toLocaleString()} variables synced\n${data.errors.length} error${data.errors.length > 1 ? 's' : ''} occurred\n\nOpen console (bottom) to view details`
          : `✓ Sync Complete!\n${data.collectionsCreated || 0} collections created\n${data.variablesSynced.toLocaleString()} variables synced\nLayers: ${layers.join(' → ')}`;
        
        setNotification({
          type: data.errors.length > 0 ? 'error' : 'success',
          message,
          duration: data.errors.length > 0 ? 10000 : 6000
        });
        
        setProgress(null);
        break;
      }

      // Multi-layer sync error
      case 'multi-layer-sync-error': {
        const data = msg.data as SyncErrorData;
        console.error('[useFigmaMessages] Multi-layer sync error:', data);
        
        // Update brand store
        updateSyncStatus('error', data);
        
        // Build error message
        const errorMsg = data.errors.length > 0 
          ? data.errors[0] 
          : 'Failed to sync to Figma';
        
        const message = `✗ Sync Failed\n${errorMsg}\n\nPlease try again or check console for details.`;
        
        setNotification({
          type: 'error',
          message,
          duration: 8000
        });
        
        setProgress(null);
        break;
      }

      // Legacy brand sync success
      case 'brand-sync-success': {
        const data = msg.data as SyncSuccessData;
        console.log('[useFigmaMessages] Brand sync success:', data);
        
        // Update brand store
        updateSyncStatus('success', data);
        
        const message = `✓ Sync Complete!\n${data.variablesSynced.toLocaleString()} variables synced\nMode: ${data.modesAdded.join(', ')}`;
        
        setNotification({
          type: 'success',
          message,
          duration: 5000
        });
        
        setProgress(null);
        break;
      }

      // Legacy brand sync error
      case 'brand-sync-error': {
        const data = msg.data as SyncErrorData;
        console.error('[useFigmaMessages] Brand sync error:', data);
        
        // Update brand store
        updateSyncStatus('error', data);
        
        const errorMsg = data.errors.length > 0 
          ? data.errors[0] 
          : 'Failed to sync to Figma';
        
        const message = `✗ Sync Failed\n${errorMsg}`;
        
        setNotification({
          type: 'error',
          message,
          duration: 8000
        });
        
        setProgress(null);
        break;
      }

      // Sync progress updates
      case 'sync-progress': {
        const data = msg.data as ProgressData;
        setProgress(data);
        break;
      }

      // UI-initiated progress updates (for generation phase)
      case 'sync-progress-ui': {
        const data = msg.data as ProgressData & { isGenerating?: boolean };
        setProgress(data);
        break;
      }

      // Other message types can be added here
      default:
        // Ignore other message types
        break;
    }
  }, [updateSyncStatus]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    progress,
    clearNotification
  };
}
