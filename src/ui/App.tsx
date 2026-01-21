import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadVariablesData, setLoading, setError } from '../store/slices/variablesSlice';
import { setGraphData } from '../store/slices/graphSlice';
import { parseFigmaData } from '../services/figmaParser';
import { buildGraph } from '../services/graphBuilder';
import GraphView from './GraphView';

const App: React.FC = () => {
  console.log('[FigZag UI] App component mounting...');
  const dispatch = useAppDispatch();
  const { collections, variables, loading, error } = useAppSelector(state => state.variables);
  const { nodes, edges } = useAppSelector(state => state.graph);

  console.log('[FigZag UI] State:', { collections: collections.length, variables: variables.length, loading, error });

  const handleVariablesLoaded = useCallback((data: any) => {
    try {
      console.log('[FigZag UI] Handling variables loaded:', data);
      // Parse Figma data into internal models
      const parsed = parseFigmaData(data.collections, data.variables);
      console.log('[FigZag UI] Parsed data:', parsed);
      
      // Update variables store
      dispatch(loadVariablesData(parsed));
      
      // Build graph
      const graph = buildGraph(
        parsed.collections,
        parsed.variables,
        parsed.groups,
        parsed.aliases
      );
      
      // Update graph store
      dispatch(setGraphData(graph));
      
    } catch (err) {
      console.error('Error parsing variables:', err);
      dispatch(setError(`Failed to parse variables: ${err}`));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Listen for messages from Figma plugin
  useEffect(() => {
    console.log('[FigZag UI] Setting up message listener...');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('[FigZag UI] Received message:', event.data);
      const msg = event.data.pluginMessage;
      
      if (!msg) {
        console.log('[FigZag UI] No plugin message in event');
        return;
      }

      console.log('[FigZag UI] Message type:', msg.type);
      switch (msg.type) {
        case 'variables-loaded':
          handleVariablesLoaded(msg.data);
          break;
          
        case 'error':
          dispatch(setError(msg.message));
          dispatch(setLoading(false));
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial data load
    console.log('[FigZag UI] Requesting initial data load...');
    dispatch(setLoading(true));
    parent.postMessage({ pluginMessage: { type: 'load-variables' } }, '*');

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [dispatch, handleVariablesLoaded]);

  const handleRefresh = useCallback(() => {
    dispatch(setLoading(true));
    parent.postMessage({ pluginMessage: { type: 'load-variables' } }, '*');
  }, [dispatch]);

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-title">FigZag - Variables Graph</div>
        <div className="toolbar-stats">
          <span>{collections.length} Collections</span>
          <span>{variables.length} Variables</span>
          <span>{nodes.length} Nodes</span>
          <span>{edges.length} Aliases</span>
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div>Loading variables...</div>
        </div>
      )}

      {error && (
        <div className="error-container">
          <div>Error: {error}</div>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && collections.length === 0 && (
        <div className="empty-state">
          <div>No variables found in this file</div>
          <div style={{ fontSize: '12px' }}>Create some variables to get started</div>
        </div>
      )}

      {!loading && !error && collections.length > 0 && (
        <div className="graph-container">
          <GraphView />
        </div>
      )}
    </div>
  );
};

export default App;
