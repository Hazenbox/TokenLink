/**
 * Centralized message handler hook for Figma plugin messages
 * Optimized to reduce handler recreation and improve performance
 */

import { useCallback, useRef } from 'react';

export interface MessageHandlers {
  setGraphData: (data: any) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: any) => void;
  setError: (error: string | null) => void;
  setNotification: (notification: { type: 'success' | 'error'; message: string } | null) => void;
  setIsEvaluating: (evaluating: boolean) => void;
  setRuleResult: (result: any) => void;
  setIsExporting: (exporting: boolean) => void;
  setIsImporting: (importing: boolean) => void;
  downloadJSON: (json: string) => void;
}

/**
 * Creates a centralized message handler that routes messages to appropriate handlers
 * Uses a message type map for O(1) lookup instead of if-else chain
 */
export function useMessageHandler(handlers: MessageHandlers) {
  // Use refs to avoid recreating handler when handlers change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Message type to handler mapping for O(1) lookup
  const messageHandlers = useRef<Map<string, (data: any) => void>>(new Map([
    ['loading-progress', (data) => handlersRef.current.setLoadingProgress(data)],
    ['variable-graph-loaded', (data) => {
      handlersRef.current.setGraphData(data);
      handlersRef.current.setLoading(false);
    }],
    ['variable-graph-error', (data) => {
      handlersRef.current.setError(data.message);
      handlersRef.current.setLoading(false);
    }],
    ['alias-created', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Alias created successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['alias-creation-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['variables-updated', (data) => {
      // Real-time sync: variables changed in Figma
      console.log('Received real-time variable update from Figma');
      handlersRef.current.setGraphData(data);
      handlersRef.current.setNotification({ type: 'success', message: 'Variables synced' });
      setTimeout(() => handlersRef.current.setNotification(null), 2000);
    }],
    ['sync-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['rules-evaluated', (data) => {
      handlersRef.current.setIsEvaluating(false);
      handlersRef.current.setRuleResult(data);
      handlersRef.current.setNotification({ type: 'success', message: 'Rule evaluation completed' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['rules-evaluation-error', (data) => {
      handlersRef.current.setIsEvaluating(false);
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['rules-applied', (data) => {
      handlersRef.current.setIsEvaluating(false);
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setRuleResult(data.formatted);
      if (data.success) {
        handlersRef.current.setNotification({ 
          type: 'success', 
          message: `Rules applied! Created ${data.successCount} alias(es)` 
        });
      } else {
        handlersRef.current.setNotification({ 
          type: 'error', 
          message: `Applied with errors: ${data.errorCount} failed` 
        });
      }
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['rules-application-error', (data) => {
      handlersRef.current.setIsEvaluating(false);
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['graph-exported', (data) => {
      handlersRef.current.setIsExporting(false);
      handlersRef.current.downloadJSON(data.json);
      handlersRef.current.setNotification({ type: 'success', message: 'Graph exported successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['graph-export-error', (data) => {
      handlersRef.current.setIsExporting(false);
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['import-progress', (data) => {
      // Import progress update
      const { step, total, message } = data;
      console.log(`[Import Progress] ${step}/${total}: ${message}`);
      // Could show progress bar or update notification here if desired
    }],
    ['graph-imported', (data) => {
      handlersRef.current.setIsImporting(false);
      handlersRef.current.setGraphData(data.graph);
      const formatLabel = data.format === 'figma-native' ? 'Figma native' : 'Token Link';
      const message = data.result.success
        ? `Import successful! (${formatLabel} format) Created ${data.result.stats.collectionsCreated} collection(s), ${data.result.stats.variablesCreated} variable(s), ${data.result.stats.aliasesCreated} alias(es)`
        : 'Import completed with errors';
      handlersRef.current.setNotification({ 
        type: data.result.success ? 'success' : 'error', 
        message: message
      });
      // Log warnings and errors
      if (data.result.warnings.length > 0) {
        console.warn('Import warnings:', data.result.warnings);
      }
      if (data.result.errors.length > 0) {
        console.error('Import errors:', data.result.errors);
      }
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['graph-import-error', (data) => {
      handlersRef.current.setIsImporting(false);
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['collection-created', (data) => {
      console.log('[Token Link] Collection created, updating graph:', {
        collections: data.graph.collections.length,
        groups: data.graph.groups.length,
        variables: data.graph.variables.length,
      });
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Collection created successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['collection-creation-error', (data) => {
      console.error('[Token Link] Collection creation error:', data.message);
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['mode-created', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Mode created successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['mode-creation-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['variable-created', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Variable created successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['variable-creation-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['collection-deleted', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Collection deleted successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['collection-deletion-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['ml-collections-cleaned', (data) => {
      if (data.graph) {
        handlersRef.current.setGraphData(data.graph);
      }
      handlersRef.current.setNotification({ 
        type: 'success', 
        message: data.message || `Deleted ${data.deletedCount} ml_ prefixed collections`
      });
      setTimeout(() => handlersRef.current.setNotification(null), 4000);
    }],
    ['ml-collections-cleanup-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['variable-deleted', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Variable deleted successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['variable-deletion-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['mode-deleted', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Mode deleted successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['mode-deletion-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['alias-deleted', (data) => {
      handlersRef.current.setGraphData(data.graph);
      const { aliasInfo } = data;
      const message = `Alias Removed

[Collection: ${aliasInfo.sourceCollectionName}]
  ${aliasInfo.sourceGroupName}/${aliasInfo.sourceVariableName} · ${aliasInfo.sourceModeName}
    ↓
[Collection: ${aliasInfo.targetCollectionName}]
  ${aliasInfo.targetGroupName}/${aliasInfo.targetVariableName} · ${aliasInfo.targetModeName}`;
      handlersRef.current.setNotification({ type: 'success', message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['alias-deletion-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['collection-renamed', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Collection renamed successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['collection-rename-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['variable-renamed', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Variable renamed successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['variable-rename-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
    ['mode-renamed', (data) => {
      handlersRef.current.setGraphData(data.graph);
      handlersRef.current.setNotification({ type: 'success', message: 'Mode renamed successfully!' });
      setTimeout(() => handlersRef.current.setNotification(null), 3000);
    }],
    ['mode-rename-error', (data) => {
      handlersRef.current.setNotification({ type: 'error', message: data.message });
      setTimeout(() => handlersRef.current.setNotification(null), 5000);
    }],
  ]));

  // Create stable handler function that uses refs to avoid recreation
  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = event.data.pluginMessage;
    if (!msg || !msg.type) return;

    const handler = messageHandlers.current.get(msg.type);
    if (handler) {
      handler(msg.data);
    }
  }, []); // Empty deps - handler is stable

  return handleMessage;
}
