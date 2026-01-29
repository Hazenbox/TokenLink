import React, { useState, useEffect, useMemo } from 'react';
import { ListTree, Network, FileCog, Download, Upload, Keyboard, Palette, Sparkles } from 'lucide-react';
import VariableTree from './components/VariableTree';
import { VariableGraphView } from './components/VariableGraphView';
import { AliasModal } from './components/AliasModal';
import { RuleList } from './components/RuleList';
import { RuleEditor } from './components/RuleEditor';
import { RuleRunner } from './components/RuleRunner';
import { ContextMenu, ContextMenuItem } from './components/ContextMenu';
import { CreateCollectionModal } from './components/CreateCollectionModal';
import { CreateModeModal } from './components/CreateModeModal';
import { CreateVariableModal } from './components/CreateVariableModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { RenameModal } from './components/RenameModal';
import { Toast } from './components/Toast';
import { BulkAliasPicker } from './components/BulkAliasPicker';
import { KeyboardShortcutsPanel } from './components/KeyboardShortcutsPanel';
import { ResizeHandle } from './components/ResizeHandle';
import { createGraph, addCollection, addGroup, addVariable } from '../models/graph';
import { Collection as InternalCollection, Group as InternalGroup, Variable as InternalVariable } from '../models/types';
import { Rule, createDefaultRule } from '../models/rules';
import { downloadJSON } from '../utils/export';
import { useMultiSelect } from './hooks/useMultiSelect';
import { useKeyboardShortcuts, KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { useAppSwitcher } from './AppSwitcher';

// Build timestamp for cache busting
const BUILD_TIMESTAMP = new Date().toISOString();
console.log('[Token Link] Build timestamp:', BUILD_TIMESTAMP);
console.log('[Token Link] App module loaded - Edge wiring fix active');

interface Collection {
  id: string;
  name: string;
  type: string;
}

interface Group {
  id: string;
  name: string;
  collectionId: string;
}

interface Mode {
  id: string;
  name: string;
  value: any;
}

interface Variable {
  id: string;
  name: string;
  groupId: string;
  variableType?: string;
  modes: Mode[];
}

interface GraphData {
  collections: Collection[];
  groups: Group[];
  variables: Variable[];
  aliases: any[];
}

interface LoadingProgress {
  step: number;
  total: number;
  message: string;
}

// Wrapper component for RuleRunner that manages result state
interface RuleRunnerWrapperProps {
  rules: Rule[];
  onDryRun: (rulesJSON: string) => void;
  onApply: (rulesJSON: string) => void;
  result: any;
  isRunning: boolean;
}

const RuleRunnerWrapper: React.FC<RuleRunnerWrapperProps> = ({ 
  rules, 
  onDryRun, 
  onApply, 
  result,
  isRunning 
}) => {
  const [displayResult, setDisplayResult] = React.useState<any>(null);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (result) {
      setDisplayResult(result);
      setRunning(false);
    }
  }, [result]);

  React.useEffect(() => {
    setRunning(isRunning);
  }, [isRunning]);

  const handleDryRun = (rulesJSON: string) => {
    setRunning(true);
    setDisplayResult(null);
    onDryRun(rulesJSON);
  };

  const handleApply = (rulesJSON: string) => {
    setRunning(true);
    setDisplayResult(null);
    onApply(rulesJSON);
  };

  // Create a modified RuleRunner with result display
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <RuleRunner
        rules={rules}
        onDryRun={handleDryRun}
        onApply={handleApply}
      />
      
      {running && !displayResult && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>Evaluating rules...</div>
        </div>
      )}
      
      {displayResult && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--secondary-bg)',
          padding: '16px',
          borderRadius: '6px',
        }}>
          <ResultDisplay result={displayResult} />
        </div>
      )}
    </div>
  );
};

// Result display component
const ResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  const [expandedSteps, setExpandedSteps] = React.useState<Set<string>>(new Set());

  if (!result || !result.summary) return null;

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAll = () => {
    if (result.steps) {
      setExpandedSteps(new Set(result.steps.map((s: any) => s.ruleId)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          {result.summary.mode === 'dry-run' ? 'Dry Run Results' : 'Apply Results'}
        </h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={expandAll} style={buttonStyle}>Expand All</button>
          <button onClick={collapseAll} style={buttonStyle}>Collapse All</button>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--card-bg)',
        padding: '12px',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '13px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
          <span style={{
            fontWeight: 600,
            color: result.summary.success ? 'var(--success-color)' : 'var(--error-color)',
          }}>
            {result.summary.success ? 'Success' : 'Failed'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Variables Matched:</span>
          <span style={{ fontWeight: 500 }}>{result.summary.totalMatched}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Aliases Created:</span>
          <span style={{ fontWeight: 500 }}>{result.summary.totalAliases}</span>
        </div>
      </div>

      {result.errors && result.errors.length > 0 && (
        <div style={{
          backgroundColor: '#ffebee',
          padding: '12px',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--error-color)',
        }}>
          <strong>Errors:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {result.errors.map((error: string, i: number) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {result.steps && result.steps.length > 0 && (
        <div>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>
            Step-by-Step Evaluation
          </h5>
          {result.steps.map((step: any, index: number) => (
            <StepDisplay
              key={step.ruleId}
              step={step}
              index={index}
              isExpanded={expandedSteps.has(step.ruleId)}
              onToggle={() => toggleStep(step.ruleId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const StepDisplay: React.FC<{ step: any; index: number; isExpanded: boolean; onToggle: () => void }> = ({ 
  step, 
  index, 
  isExpanded, 
  onToggle 
}) => {
  const getStatusColor = () => {
    switch (step.status) {
      case 'matched': return 'var(--success-color)';
      case 'skipped': return 'var(--warning-color)';
      case 'error': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      marginBottom: '8px',
      backgroundColor: 'var(--card-bg)',
      overflow: 'hidden',
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'inline-block',
            width: '24px',
            height: '24px',
            lineHeight: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--secondary-bg)',
            borderRadius: '50%',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{step.ruleName}</span>
          <span style={{ fontSize: '12px', color: getStatusColor(), fontWeight: 500 }}>
            {step.status}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step.matchCount > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {step.matchCount} match{step.matchCount !== 1 ? 'es' : ''}, {step.aliasCount} alias{step.aliasCount !== 1 ? 'es' : ''}
            </span>
          )}
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--secondary-bg)',
          borderTop: '1px solid var(--border-color)',
          fontSize: '12px',
        }}>
          {step.details && step.details.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Matches:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {step.details.map((detail: string, i: number) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
          {step.error && (
            <div style={{ color: 'var(--error-color)', marginBottom: '8px' }}>
              <strong>Error:</strong> {step.error}
            </div>
          )}
          {step.warnings && step.warnings.length > 0 && (
            <div style={{ color: 'var(--warning-color)' }}>
              <strong>Warnings:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {step.warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  height: '24px',
  padding: '4px 8px',
  backgroundColor: 'var(--card-bg)',
  border: '1px solid var(--border-color)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const App: React.FC = () => {
  const { switchToApp } = useAppSwitcher();
  
  // State to store the variable graph data
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  // Loading state to show while fetching data
  const [loading, setLoading] = useState<boolean>(true);
  // Error state for error handling
  const [error, setError] = useState<string | null>(null);
  // Loading progress state to show dynamic progress
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);
  // View mode state (tree or graph)
  const [viewMode, setViewMode] = useState<'tree' | 'graph'>('graph');
  // Rules engine side sheet state
  const [isRulesSideSheetOpen, setIsRulesSideSheetOpen] = useState<boolean>(false);
  // Tooltip state
  const [tooltipState, setTooltipState] = useState<{ show: boolean; text: string; position: { x: number; y: number } }>({
    show: false,
    text: '',
    position: { x: 0, y: 0 }
  });
  const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null);
  // Alias modal state
  const [isAliasModalOpen, setIsAliasModalOpen] = useState<boolean>(false);
  const [selectedNodeForAlias, setSelectedNodeForAlias] = useState<string | null>(null);
  const [selectedModeForAlias, setSelectedModeForAlias] = useState<string | undefined>(undefined);
  const [selectedTargetNodeForAlias, setSelectedTargetNodeForAlias] = useState<string | null>(null);
  const [selectedTargetModeForAlias, setSelectedTargetModeForAlias] = useState<string | undefined>(undefined);
  // Success/error notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // Sync status for real-time variable sync indicator
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  // Rule engine state
  const [rules, setRules] = useState<Rule[]>([]);
  const [isRuleEditorOpen, setIsRuleEditorOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [ruleResult, setRuleResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  // Import state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  // Context menu state
  const [contextMenuState, setContextMenuState] = useState<{
    show: boolean;
    x: number;
    y: number;
    items: ContextMenuItem[];
    target?: { type: string; id: string; data?: any };
  }>({ show: false, x: 0, y: 0, items: [] });
  // Creation modal state
  const [createCollectionModalOpen, setCreateCollectionModalOpen] = useState<boolean>(false);
  const [createModeModalOpen, setCreateModeModalOpen] = useState<boolean>(false);
  const [createVariableModalOpen, setCreateVariableModalOpen] = useState<boolean>(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState<boolean>(false);
  const [modalContext, setModalContext] = useState<any>(null);
  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState<boolean>(false);
  const [renameContext, setRenameContext] = useState<{
    type: 'collection' | 'variable' | 'mode';
    id: string;
    currentName: string;
    collectionId?: string;
    modeId?: string;
  } | null>(null);
  // File input ref for Import button
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Multi-select state
  const multiSelect = useMultiSelect();
  // Bulk alias picker state
  const [isBulkAliasPickerOpen, setIsBulkAliasPickerOpen] = useState<boolean>(false);
  // Keyboard shortcuts panel state
  const [isShortcutsPanelOpen, setIsShortcutsPanelOpen] = useState<boolean>(false);

  // Define keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => [
    // Selection
    {
      key: 'a',
      meta: true,
      description: 'Select all',
      category: 'selection',
      action: () => {
        if (graphData) {
          const allNodeIds = graphData.variables.map(v => v.id);
          multiSelect.selectAll(allNodeIds);
        }
      },
    },
    {
      key: 'Escape',
      description: 'Clear selection',
      category: 'selection',
      action: () => multiSelect.clearSelection(),
    },
    // Editing
    {
      key: 'd',
      meta: true,
      description: 'Duplicate selected',
      category: 'editing',
      action: () => {
        // TODO: Implement duplicate
        console.log('Duplicate not yet implemented');
      },
    },
    {
      key: 'Delete',
      description: 'Delete selected',
      category: 'editing',
      action: () => {
        // TODO: Implement delete selected
        console.log('Delete not yet implemented');
      },
    },
    {
      key: 'Backspace',
      description: 'Delete selected',
      category: 'editing',
      action: () => {
        // TODO: Implement delete selected
        console.log('Delete not yet implemented');
      },
    },
    // Aliases
    {
      key: 'a',
      description: 'Toggle alias creation mode',
      category: 'aliases',
      action: () => {
        // TODO: Implement alias creation mode
        console.log('Alias creation mode not yet implemented');
      },
    },
    // View
    {
      key: '?',
      description: 'Toggle keyboard shortcuts',
      category: 'view',
      action: () => setIsShortcutsPanelOpen(prev => !prev),
    },
  ], [graphData, multiSelect]);

  // Use keyboard shortcuts hook
  useKeyboardShortcuts({ shortcuts: keyboardShortcuts, enabled: true });

  // Tooltip handlers
  const showTooltip = (text: string, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const timeout = setTimeout(() => {
      setTooltipState({
        show: true,
        text,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top - 8
        }
      });
    }, 500);
    setTooltipTimeout(timeout);
  };

  const hideTooltip = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      setTooltipTimeout(null);
    }
    setTooltipState({ show: false, text: '', position: { x: 0, y: 0 } });
  };

  // Helper to detect collection type from variable
  const getCollectionType = (variable: Variable): string => {
    const varName = variable.name.toLowerCase();
    // Check for common naming patterns
    if (varName.includes('primitive')) return 'PRIMITIVE';
    if (varName.includes('semantic')) return 'SEMANTIC';
    if (varName.includes('component')) return 'COMPONENT';
    return '';
  };

  // Function to refresh graph data
  const refreshGraph = () => {
    setLoading(true);
    window.parent.postMessage(
      { pluginMessage: { type: 'get-variable-graph' } },
      '*'
    );
  };

  useEffect(() => {
    // Request variable graph when the component mounts
    refreshGraph();

    // Listen for messages from the plugin code
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      
      if (msg.type === 'loading-progress') {
        // Update progress state
        setLoadingProgress(msg.data);
      }
      
      if (msg.type === 'variable-graph-loaded') {
        // Update state with the graph data
        setGraphData(msg.data);
        setLoading(false);
      }
      
      if (msg.type === 'variable-graph-error') {
        // Handle error
        setError(msg.data.message);
        setLoading(false);
      }
      
      if (msg.type === 'alias-created') {
        // Alias created successfully
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Alias created successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'alias-creation-error') {
        // Error creating alias
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'variables-updated') {
        // Real-time sync: variables changed in Figma
        console.log('Received real-time variable update from Figma');
        setSyncStatus('syncing');
        setGraphData(msg.data);
        // Show subtle notification
        setNotification({ type: 'success', message: 'Variables synced' });
        setTimeout(() => {
          setNotification(null);
          setSyncStatus('synced');
        }, 2000);
      }
      
      if (msg.type === 'sync-error') {
        // Error syncing variables
        setSyncStatus('error');
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => {
          setNotification(null);
          setSyncStatus('synced');
        }, 3000);
      }
      
      if (msg.type === 'rules-evaluated') {
        // Dry-run results
        setIsEvaluating(false);
        setRuleResult(msg.data);
        setNotification({ type: 'success', message: 'Rule evaluation completed' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'rules-evaluation-error') {
        // Error evaluating rules
        setIsEvaluating(false);
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'rules-applied') {
        // Rules applied
        setIsEvaluating(false);
        setGraphData(msg.data.graph);
        setRuleResult(msg.data.formatted);
        
        if (msg.data.success) {
          setNotification({ 
            type: 'success', 
            message: `Rules applied! Created ${msg.data.successCount} alias(es)` 
          });
        } else {
          setNotification({ 
            type: 'error', 
            message: `Applied with errors: ${msg.data.errorCount} failed` 
          });
        }
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'rules-application-error') {
        // Error applying rules
        setIsEvaluating(false);
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'graph-exported') {
        // Graph exported successfully
        setIsExporting(false);
        const { json } = msg.data;
        
        // Download the JSON file
        downloadJSON(json);
        
        setNotification({ type: 'success', message: 'Graph exported successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'graph-export-error') {
        // Error exporting graph
        setIsExporting(false);
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'import-progress') {
        // Import progress update
        const { step, total, message } = msg.data;
        console.log(`[Import Progress] ${step}/${total}: ${message}`);
        // Could show progress bar or update notification here if desired
      }
      
      if (msg.type === 'graph-imported') {
        // Graph imported successfully
        setIsImporting(false);
        const { result, graph, format } = msg.data;
        
        // Update graph data
        setGraphData(graph);
        
        // Show detailed notification with format info
        const formatLabel = format === 'figma-native' ? 'Figma native' : 'Token Link';
        const message = result.success
          ? `Import successful! (${formatLabel} format) Created ${result.stats.collectionsCreated} collection(s), ${result.stats.variablesCreated} variable(s), ${result.stats.aliasesCreated} alias(es)`
          : 'Import completed with errors';
        
        setNotification({ 
          type: result.success ? 'success' : 'error', 
          message: message
        });
        
        // Log warnings and errors
        if (result.warnings.length > 0) {
          console.warn('Import warnings:', result.warnings);
        }
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
        
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'graph-import-error') {
        // Error importing graph
        setIsImporting(false);
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Collection creation handlers
      if (msg.type === 'collection-created') {
        console.log('[Token Link] Collection created, updating graph:', {
          collections: msg.data.graph.collections.length,
          groups: msg.data.graph.groups.length,
          variables: msg.data.graph.variables.length,
        });
        setGraphData(msg.data.graph);
        setSyncStatus('synced');
        setNotification({ type: 'success', message: 'Collection created successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'collection-creation-error') {
        console.error('[Token Link] Collection creation error:', msg.data.message);
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Mode creation handlers
      if (msg.type === 'mode-created') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Mode created successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'mode-creation-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Variable creation handlers
      if (msg.type === 'variable-created') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Variable created successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'variable-creation-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Deletion handlers
      if (msg.type === 'collection-deleted') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Collection deleted successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'collection-deletion-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'variable-deleted') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Variable deleted successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'variable-deletion-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'mode-deleted') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Mode deleted successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'mode-deletion-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Alias deletion handlers
      if (msg.type === 'alias-deleted') {
        setGraphData(msg.data.graph);
        
        // Create detailed multi-line toast message
        const { aliasInfo } = msg.data;
        const message = `Alias Removed

[Collection: ${aliasInfo.sourceCollectionName}]
  ${aliasInfo.sourceGroupName}/${aliasInfo.sourceVariableName} · ${aliasInfo.sourceModeName}
    ↓
[Collection: ${aliasInfo.targetCollectionName}]
  ${aliasInfo.targetGroupName}/${aliasInfo.targetVariableName} · ${aliasInfo.targetModeName}`;
        
        setNotification({ type: 'success', message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'alias-deletion-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      // Rename handlers
      if (msg.type === 'collection-renamed') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Collection renamed successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'collection-rename-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'variable-renamed') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Variable renamed successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'variable-rename-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
      
      if (msg.type === 'mode-renamed') {
        setGraphData(msg.data.graph);
        setNotification({ type: 'success', message: 'Mode renamed successfully!' });
        setTimeout(() => setNotification(null), 3000);
      }
      
      if (msg.type === 'mode-rename-error') {
        setNotification({ type: 'error', message: msg.data.message });
        setTimeout(() => setNotification(null), 5000);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Note: Undo/Redo is handled natively by Figma (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
  // Since we call figma.commitUndo() after alias deletion, Figma's native undo/redo
  // will work automatically. The graph will be refreshed when document changes occur.

  // Calculate summary stats
  const totalCollections = graphData?.collections.length || 0;
  const totalGroups = graphData?.groups.length || 0;
  const totalVariables = graphData?.variables.length || 0;

  // Convert serialized graph data to VariableGraph for graph view
  const internalGraph = useMemo(() => {
    if (!graphData) return null;
    
    const graph = createGraph();
    
    // Add collections
    graphData.collections.forEach((col) => {
      addCollection(graph, {
        id: col.id,
        name: col.name,
        type: col.type as InternalCollection['type'],
      });
    });
    
    // Add groups
    graphData.groups.forEach((grp) => {
      addGroup(graph, {
        id: grp.id,
        name: grp.name,
        collectionId: grp.collectionId,
      });
    });
    
    // Add variables
    graphData.variables.forEach((v) => {
      addVariable(graph, {
        id: v.id,
        name: v.name,
        groupId: v.groupId,
        variableType: v.variableType as InternalVariable['variableType'],
        modes: v.modes,
      });
    });
    
    return graph;
  }, [graphData]);

  // Handler for creating alias
  const handleCreateAlias = (data: {
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
  }) => {
    window.parent.postMessage(
      { pluginMessage: { type: 'create-alias', data } },
      '*'
    );
  };

  // Handler for bulk alias creation
  const handleBulkCreateAliases = (mappings: Array<{
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
  }>) => {
    // Create aliases one by one
    mappings.forEach(mapping => {
      handleCreateAlias(mapping);
    });
    setNotification({ 
      type: 'success', 
      message: `Creating ${mappings.length} alias${mappings.length !== 1 ? 'es' : ''}...` 
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handler for window resize
  const handleResize = (width: number, height: number) => {
    window.parent.postMessage(
      { pluginMessage: { type: 'resize', width, height } },
      '*'
    );
  };

  // Handler for deleting alias
  const handleDeleteAlias = (data: {
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
    sourceVariableName: string;
    sourceModeName: string;
    sourceGroupName: string;
    sourceCollectionName: string;
    targetVariableName: string;
    targetModeName: string;
    targetGroupName: string;
    targetCollectionName: string;
  }) => {
    console.log('[Token Link] Deleting alias:', data);
    window.parent.postMessage(
      { pluginMessage: { type: 'delete-alias', data } },
      '*'
    );
  };

  // Handler for checking circular dependency
  const handleCheckCircularDependency = (sourceId: string, targetId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const msg = event.data.pluginMessage;
        if (msg.type === 'circular-dependency-result') {
          window.removeEventListener('message', handler);
          resolve(msg.data.wouldCycle);
        }
      };
      window.addEventListener('message', handler);
      
      window.parent.postMessage(
        { pluginMessage: { type: 'check-circular-dependency', data: { sourceVariableId: sourceId, targetVariableId: targetId } } },
        '*'
      );
    });
  };

  // Handler for node click in graph view
  const handleNodeClick = (nodeId: string, modeId?: string) => {
    if (!graphData) return;
    const clickedVariable = graphData.variables.find(v => v.id === nodeId);
    
    if (clickedVariable) {
      const collectionType = getCollectionType(clickedVariable);
      
      if (collectionType === 'PRIMITIVE') {
        // Primitive clicked → pre-select as TARGET (referenced variable)
        setSelectedTargetNodeForAlias(nodeId);
        setSelectedTargetModeForAlias(modeId);
        setSelectedNodeForAlias(null);
        setSelectedModeForAlias(undefined);
      } else {
        // Semantic/Component/Unknown → pre-select as SOURCE (variable to alias)
        setSelectedNodeForAlias(nodeId);
        setSelectedModeForAlias(modeId);
        setSelectedTargetNodeForAlias(null);
        setSelectedTargetModeForAlias(undefined);
      }
    }
    
    setIsAliasModalOpen(true);
  };

  // Rule management handlers
  const handleAddRule = () => {
    setEditingRule(undefined);
    setIsRuleEditorOpen(true);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setIsRuleEditorOpen(true);
  };

  const handleSaveRule = (rule: Rule) => {
    if (editingRule) {
      // Update existing rule
      setRules(rules.map(r => r.id === rule.id ? rule : r));
    } else {
      // Add new rule
      setRules([...rules, rule]);
    }
    setIsRuleEditorOpen(false);
    setEditingRule(undefined);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      setRules(rules.filter(r => r.id !== ruleId));
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const handleDryRun = (rulesJSON: string) => {
    setIsEvaluating(true);
    window.parent.postMessage(
      { pluginMessage: { type: 'evaluate-rules', data: { rulesJSON } } },
      '*'
    );
  };

  const handleApply = (rulesJSON: string) => {
    setIsEvaluating(true);
    window.parent.postMessage(
      { pluginMessage: { type: 'apply-rules', data: { rulesJSON } } },
      '*'
    );
  };

  const handleExportGraph = () => {
    setIsExporting(true);
    window.parent.postMessage(
      { pluginMessage: { type: 'export-graph' } },
      '*'
    );
  };

  const handleImportClick = () => {
    if (isImporting) return;
    fileInputRef.current?.click();
  };

  const handleImportGraph = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
    
    // Read the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const jsonString = e.target?.result as string;
      if (jsonString) {
        setIsImporting(true);
        window.parent.postMessage(
          { pluginMessage: { type: 'import-graph', data: { jsonString } } },
          '*'
        );
      }
    };
    reader.onerror = () => {
      setNotification({ type: 'error', message: 'Failed to read file' });
      setTimeout(() => setNotification(null), 5000);
    };
    reader.readAsText(file);
  };

  // Creation handlers
  const handleCreateCollection = (name: string, type: string) => {
    window.parent.postMessage(
      { pluginMessage: { type: 'create-collection', data: { name, type } } },
      '*'
    );
  };

  const handleCreateMode = (modeName: string, collectionId: string) => {
    window.parent.postMessage(
      { pluginMessage: { type: 'create-mode', data: { modeName, collectionId } } },
      '*'
    );
  };

  const handleCreateVariable = (data: {
    name: string;
    collectionId: string;
    groupName?: string;
    variableType: string;
    initialValues?: Record<string, any>;
  }) => {
    window.parent.postMessage(
      { pluginMessage: { type: 'create-variable', data } },
      '*'
    );
  };

  const handleCreateGroup = (groupName: string, collectionId: string) => {
    // Groups are created via variable names, so we'll just store the context for later
    setModalContext({ groupName, collectionId });
    setCreateGroupModalOpen(false);
    // Open variable modal with the group pre-filled
    setModalContext({ collectionId, groupName });
    setCreateVariableModalOpen(true);
  };

  // Deletion handlers
  const handleDeleteCollection = (collectionId: string) => {
    if (confirm('Are you sure you want to delete this collection? This will delete all variables in it.')) {
      window.parent.postMessage(
        { pluginMessage: { type: 'delete-collection', data: { collectionId } } },
        '*'
      );
    }
  };

  const handleDeleteVariable = (variableId: string) => {
    if (confirm('Are you sure you want to delete this variable?')) {
      window.parent.postMessage(
        { pluginMessage: { type: 'delete-variable', data: { variableId } } },
        '*'
      );
    }
  };

  const handleDeleteMode = (collectionId: string, modeId: string) => {
    if (confirm('Are you sure you want to delete this mode? This will affect all variables in the collection.')) {
      window.parent.postMessage(
        { pluginMessage: { type: 'delete-mode', data: { collectionId, modeId } } },
        '*'
      );
    }
  };

  // Rename handlers
  const handleRenameCollection = (collectionId: string, currentName: string) => {
    setRenameContext({
      type: 'collection',
      id: collectionId,
      currentName,
    });
    setRenameModalOpen(true);
  };

  const handleRenameVariable = (variableId: string, currentName: string) => {
    setRenameContext({
      type: 'variable',
      id: variableId,
      currentName,
    });
    setRenameModalOpen(true);
  };

  const handleRenameMode = (collectionId: string, modeId: string, currentName: string) => {
    setRenameContext({
      type: 'mode',
      id: modeId,
      currentName,
      collectionId,
      modeId,
    });
    setRenameModalOpen(true);
  };

  const handleRenameSubmit = (newName: string) => {
    if (!renameContext) return;

    if (renameContext.type === 'collection') {
      window.parent.postMessage(
        { pluginMessage: { type: 'rename-collection', data: { collectionId: renameContext.id, newName } } },
        '*'
      );
    } else if (renameContext.type === 'variable') {
      window.parent.postMessage(
        { pluginMessage: { type: 'rename-variable', data: { variableId: renameContext.id, newName } } },
        '*'
      );
    } else if (renameContext.type === 'mode' && renameContext.collectionId && renameContext.modeId) {
      window.parent.postMessage(
        { pluginMessage: { type: 'rename-mode', data: { collectionId: renameContext.collectionId, modeId: renameContext.modeId, newName } } },
        '*'
      );
    }
  };

  // Context menu handlers
  const handleCollectionContextMenu = (event: React.MouseEvent, collectionId: string) => {
    const collection = graphData?.collections.find(c => c.id === collectionId);
    if (!collection) return;

    const collectionModes = graphData?.variables
      .filter(v => {
        const group = graphData.groups.find(g => g.id === v.groupId);
        return group?.collectionId === collectionId;
      })
      .flatMap(v => v.modes.map(m => m.name))
      .filter((name, index, self) => self.indexOf(name) === index) || [];

    setContextMenuState({
      show: true,
      x: event.clientX,
      y: event.clientY,
      target: { type: 'collection', id: collectionId, data: { collection, modes: collectionModes } },
      items: [
        { label: 'Add Mode', onClick: () => {
          setModalContext({ collectionId, collectionName: collection.name, existingModes: collectionModes });
          setCreateModeModalOpen(true);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Add Variable', onClick: () => {
          const existingGroups = graphData?.groups
            .filter(g => g.collectionId === collectionId)
            .map(g => g.name) || [];
          setModalContext({ collectionId, collectionName: collection.name, existingGroups });
          setCreateVariableModalOpen(true);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Add Group', onClick: () => {
          const existingGroups = graphData?.groups
            .filter(g => g.collectionId === collectionId)
            .map(g => g.name) || [];
          setModalContext({ collectionId, collectionName: collection.name, existingGroups });
          setCreateGroupModalOpen(true);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Rename Collection', onClick: () => {
          handleRenameCollection(collectionId, collection.name);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Delete Collection', onClick: () => {
          handleDeleteCollection(collectionId);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
      ],
    });
  };

  const handleVariableContextMenu = (event: React.MouseEvent, variableId: string) => {
    const variable = graphData?.variables.find(v => v.id === variableId);
    if (!variable) return;

    const selectionCount = multiSelect.getSelectionCount();
    const items: ContextMenuItem[] = [];

    if (selectionCount > 0) {
      // Show bulk operations
      items.push(
        { label: `Create aliases to... (${selectionCount} selected)`, onClick: () => {
          setIsBulkAliasPickerOpen(true);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { divider: true },
        { label: 'Clear selection', onClick: () => {
          multiSelect.clearSelection();
          setContextMenuState(prev => ({ ...prev, show: false }));
        }}
      );
    } else {
      // Show regular options
      items.push(
        { label: 'Create Alias', onClick: () => {
          handleNodeClick(variableId);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Rename Variable', onClick: () => {
          handleRenameVariable(variableId, variable.name);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Delete Variable', onClick: () => {
          handleDeleteVariable(variableId);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }}
      );
    }

    setContextMenuState({
      show: true,
      x: event.clientX,
      y: event.clientY,
      target: { type: 'variable', id: variableId, data: { variable } },
      items: items,
    });
  };

  const handleModeContextMenu = (event: React.MouseEvent, modeId: string, variableId: string) => {
    const variable = graphData?.variables.find(v => v.id === variableId);
    const mode = variable?.modes.find(m => m.id === modeId);
    if (!variable || !mode) return;

    const group = graphData?.groups.find(g => g.id === variable.groupId);
    const collectionId = group?.collectionId;

    setContextMenuState({
      show: true,
      x: event.clientX,
      y: event.clientY,
      target: { type: 'mode', id: modeId, data: { mode, variable, collectionId } },
      items: [
        { label: 'Create Alias', onClick: () => {
          handleNodeClick(variableId, modeId);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Rename Mode', onClick: () => {
          if (collectionId) {
            handleRenameMode(collectionId, modeId, mode.name);
          }
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Delete Mode', onClick: () => {
          if (collectionId) {
            handleDeleteMode(collectionId, modeId);
          }
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
      ],
    });
  };

  const handleGroupContextMenu = (event: React.MouseEvent, groupId: string) => {
    const group = graphData?.groups.find(g => g.id === groupId);
    if (!group) return;

    setContextMenuState({
      show: true,
      x: event.clientX,
      y: event.clientY,
      target: { type: 'group', id: groupId, data: { group } },
      items: [
        { label: 'Add Variable', onClick: () => {
          const collection = graphData?.collections.find(c => c.id === group.collectionId);
          const existingGroups = graphData?.groups
            .filter(g => g.collectionId === group.collectionId)
            .map(g => g.name) || [];
          setModalContext({ 
            collectionId: group.collectionId, 
            collectionName: collection?.name || '',
            groupName: group.name,
            existingGroups 
          });
          setCreateVariableModalOpen(true);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
        { label: 'Delete Group', onClick: () => {
          // Delete all variables in the group
          const variablesToDelete = graphData?.variables.filter(v => v.groupId === groupId) || [];
          if (confirm(`Are you sure you want to delete this group and its ${variablesToDelete.length} variable(s)?`)) {
            variablesToDelete.forEach(v => {
              window.parent.postMessage(
                { pluginMessage: { type: 'delete-variable', data: { variableId: v.id } } },
                '*'
              );
            });
          }
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
      ],
    });
  };

  const handleCanvasContextMenu = (event: React.MouseEvent) => {
    setContextMenuState({
      show: true,
      x: event.clientX,
      y: event.clientY,
      target: { type: 'canvas', id: '' },
      items: [
        { label: 'Create Collection', onClick: () => {
          setCreateCollectionModalOpen(true);
          setContextMenuState(prev => ({ ...prev, show: false }));
        }},
      ],
    });
  };

  return (
    <div
      style={{
        fontFamily: 'var(--font-geist-sans)',
        fontSize: '14px',
        color: 'var(--text-color)',
        height: '100%',
        width: '100%',
        backgroundColor: 'var(--bg-color)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(13, 13, 13, 0.95) 0%, rgba(13, 13, 13, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '16px 20px',
          flexShrink: 0,
        }}
      >
        {/* Show header content when not loading and no error */}
        {!loading && !error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* App Navigation Buttons */}
              <button
                onClick={() => switchToApp('color')}
                onMouseEnter={(e) => showTooltip('Color System', e)}
                onMouseLeave={hideTooltip}
                style={{
                  height: '24px',
                  padding: '4px 12px',
                  background: 'var(--card-bg)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <Palette size={14} />
                Colors
              </button>
              <button
                onClick={() => switchToApp('automate')}
                onMouseEnter={(e) => showTooltip('Brand Automation', e)}
                onMouseLeave={hideTooltip}
                style={{
                  height: '24px',
                  padding: '4px 12px',
                  background: 'var(--card-bg)',
                  color: 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <Sparkles size={14} />
                Automate
              </button>
              
              {/* View Toggle and Actions - Only show when graphData exists */}
              {graphData && (
                <>
                  {/* Segmented Control */}
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setViewMode('tree')}
                      onMouseEnter={(e) => showTooltip('Tree View', e)}
                      onMouseLeave={hideTooltip}
                      style={{
                        height: '24px',
                        padding: '4px 12px',
                        background: viewMode === 'tree' ? 'var(--primary-color)' : 'transparent',
                        color: viewMode === 'tree' ? 'white' : 'var(--text-color)',
                        border: 'none',
                        borderRight: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ListTree size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('graph')}
                      onMouseEnter={(e) => showTooltip('Graph View', e)}
                      onMouseLeave={hideTooltip}
                      style={{
                        height: '24px',
                        padding: '4px 12px',
                        background: viewMode === 'graph' ? 'var(--primary-color)' : 'transparent',
                        color: viewMode === 'graph' ? 'white' : 'var(--text-color)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Network size={16} />
                    </button>
                  </div>
                  
                  {/* Rules Engine Button */}
                  <button
                    onClick={() => setIsRulesSideSheetOpen(true)}
                    onMouseEnter={(e) => showTooltip('Rules Engine', e)}
                    onMouseLeave={hideTooltip}
                    style={{
                      height: '24px',
                      padding: '4px 12px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                    >
                    <FileCog size={14} />
                    Rules
                  </button>
                  
                  {/* Export JSON Button */}
                  <button
                    onClick={handleExportGraph}
                    onMouseEnter={(e) => showTooltip('Export JSON', e)}
                    onMouseLeave={hideTooltip}
                    disabled={isExporting}
                    style={{
                      height: '24px',
                      padding: '4px 12px',
                      background: isExporting ? 'var(--border-color)' : 'var(--card-bg)',
                      color: isExporting ? 'var(--text-secondary)' : 'var(--text-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                    >
                    <Download size={14} />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </button>
                  
                  {/* Keyboard Shortcuts Button */}
                  <button
                    onClick={() => setIsShortcutsPanelOpen(true)}
                    onMouseEnter={(e) => showTooltip('Keyboard Shortcuts (?)', e)}
                    onMouseLeave={hideTooltip}
                    style={{
                      height: '24px',
                      padding: '4px 12px',
                      background: 'var(--card-bg)',
                      color: 'var(--text-color)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <Keyboard size={14} />
                  </button>
                </>
              )}
              
              {/* Import JSON Button - Always visible */}
              <button
                onClick={handleImportClick}
                onMouseEnter={(e) => showTooltip('Import JSON', e)}
                onMouseLeave={hideTooltip}
                disabled={isImporting}
                style={{
                  height: '24px',
                  padding: '4px 12px',
                  background: isImporting ? 'var(--border-color)' : 'var(--card-bg)',
                  color: isImporting ? 'var(--text-secondary)' : 'var(--text-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <Upload size={14} />
                {isImporting ? 'Importing...' : 'Import'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportGraph}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </div>

            {/* Sync Status Indicator - Only show when graphData exists */}
            {graphData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: syncStatus === 'synced' ? 'var(--success-color)' : 
                                syncStatus === 'syncing' ? 'var(--warning-color)' : 'var(--error-color)',
                    transition: 'background 0.3s ease',
                  }}
                  title={syncStatus === 'synced' ? 'Synced with Figma' :
                         syncStatus === 'syncing' ? 'Syncing...' : 'Sync error'}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {syncStatus === 'synced' ? 'Synced' :
                   syncStatus === 'syncing' ? 'Syncing...' : 'Sync error'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: 'var(--card-bg)',
        }}
      >
        {/* Loading State */}
        {loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'var(--text-secondary)',
            }}
          >
            {/* Progress indicator */}
            {loadingProgress && (
              <>
                <div style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-color)' }}>
                  {loadingProgress.message}
                </div>
                
                {/* Progress bar */}
                <div
                  style={{
                    width: '240px',
                    height: '4px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '2px',
                    margin: '0 auto 8px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(loadingProgress.step / loadingProgress.total) * 100}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary-color)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                
                {/* Step indicator */}
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Step {loadingProgress.step} of {loadingProgress.total}
                </div>
              </>
            )}
            
            {/* Fallback for initial state */}
            {!loadingProgress && (
              <>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>Loading variables...</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Initializing...</div>
              </>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            style={{
              margin: '20px',
              padding: '16px',
              backgroundColor: '#ffebee',
              border: '1px solid var(--error-color)',
              borderRadius: '6px',
              color: 'var(--error-color)',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Error</div>
            {error}
          </div>
        )}

        {/* Tree or Graph View */}
        {!loading && !error && graphData && internalGraph && (
          <>
            {viewMode === 'tree' ? (
              <VariableTree 
                data={graphData}
                onCollectionContextMenu={handleCollectionContextMenu}
                onGroupContextMenu={handleGroupContextMenu}
                onVariableContextMenu={handleVariableContextMenu}
              />
            ) : (
              <VariableGraphView 
                graph={internalGraph}
                onNodeClick={handleNodeClick}
                onEdgeClick={(edgeId) => console.log('Edge clicked:', edgeId)}
                onCreateAlias={handleCreateAlias}
                onDeleteAlias={handleDeleteAlias}
                onCollectionContextMenu={handleCollectionContextMenu}
                onVariableContextMenu={handleVariableContextMenu}
                onModeContextMenu={handleModeContextMenu}
                onCanvasContextMenu={handleCanvasContextMenu}
                multiSelect={multiSelect}
              />
            )}
          </>
        )}

        {/* Notification Toast */}
        {notification && (
          <Toast
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Alias Modal */}
        {graphData && (
          <AliasModal
            isOpen={isAliasModalOpen}
            onClose={() => {
              setIsAliasModalOpen(false);
              setSelectedNodeForAlias(null);
              setSelectedModeForAlias(undefined);
              setSelectedTargetNodeForAlias(null);
              setSelectedTargetModeForAlias(undefined);
            }}
            sourceVariable={selectedNodeForAlias ? graphData.variables.find(v => v.id === selectedNodeForAlias) : undefined}
            sourceModeId={selectedModeForAlias}
            targetVariable={selectedTargetNodeForAlias ? graphData.variables.find(v => v.id === selectedTargetNodeForAlias) : undefined}
            targetModeId={selectedTargetModeForAlias}
            variables={graphData.variables}
            groups={graphData.groups}
            collections={graphData.collections}
            onCreateAlias={handleCreateAlias}
            onCheckCircularDependency={handleCheckCircularDependency}
          />
        )}

        {/* Rule Editor Modal */}
        <RuleEditor
          isOpen={isRuleEditorOpen}
          onClose={() => {
            setIsRuleEditorOpen(false);
            setEditingRule(undefined);
          }}
          onSave={handleSaveRule}
          initialRule={editingRule}
          graphData={graphData as any}
        />

        {/* Tooltip */}
        {tooltipState.show && (
          <div
            style={{
              position: 'fixed',
              left: `${tooltipState.position.x}px`,
              top: `${tooltipState.position.y}px`,
              transform: 'translate(-50%, -100%)',
              padding: '6px 10px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              fontSize: '12px',
              borderRadius: '4px',
              pointerEvents: 'none',
              zIndex: 10000,
              whiteSpace: 'nowrap',
            }}
          >
            {tooltipState.text}
            <div
              style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid rgba(0, 0, 0, 0.8)',
              }}
            />
          </div>
        )}

        {/* Rules Engine Side Sheet */}
        {isRulesSideSheetOpen && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                zIndex: 9000,
              }}
              onClick={() => setIsRulesSideSheetOpen(false)}
            />
            
            {/* Side Sheet */}
            <div
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                minWidth: '40%',
                maxWidth: '50%',
                backgroundColor: 'var(--card-bg)',
                boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)',
                zIndex: 9001,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideInFromRight 0.3s ease-out',
              }}
            >
              {/* Side Sheet Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--header-bg)',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Rules Engine</h2>
                <button
                  onClick={() => setIsRulesSideSheetOpen(false)}
                  style={{
                    height: '24px',
                    width: '24px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: 'var(--text-color)',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              {/* Side Sheet Content */}
              <div style={{ 
                flex: 1,
                padding: '20px', 
                display: 'flex', 
                gap: '20px',
                overflow: 'hidden',
              }}>
                {/* Left Panel: Rule List */}
                <div style={{ 
                  flex: '0 0 350px',
                  borderRight: '1px solid var(--border-color)',
                  paddingRight: '20px',
                  overflowY: 'auto',
                }}>
                  <RuleList
                    rules={rules}
                    onAddRule={handleAddRule}
                    onEditRule={handleEditRule}
                    onDeleteRule={handleDeleteRule}
                    onToggleRule={handleToggleRule}
                  />
                </div>
                
                {/* Right Panel: Rule Runner */}
                <div style={{ 
                  flex: 1,
                  overflowY: 'auto',
                }}>
                  <RuleRunnerWrapper
                    rules={rules}
                    onDryRun={handleDryRun}
                    onApply={handleApply}
                    result={ruleResult}
                    isRunning={isEvaluating}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Context Menu */}
      {contextMenuState.show && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          items={contextMenuState.items}
          onClose={() => setContextMenuState(prev => ({ ...prev, show: false }))}
        />
      )}
      
      {/* Creation Modals */}
      <CreateCollectionModal
        isOpen={createCollectionModalOpen}
        existingCollections={graphData?.collections.map(c => c.name) || []}
        onClose={() => setCreateCollectionModalOpen(false)}
        onCreate={handleCreateCollection}
      />
      
      <CreateModeModal
        isOpen={createModeModalOpen}
        collectionName={modalContext?.collectionName || ''}
        collectionId={modalContext?.collectionId || ''}
        existingModes={modalContext?.existingModes || []}
        onClose={() => setCreateModeModalOpen(false)}
        onCreate={handleCreateMode}
      />
      
      <CreateVariableModal
        isOpen={createVariableModalOpen}
        collectionName={modalContext?.collectionName || ''}
        collectionId={modalContext?.collectionId || ''}
        existingGroups={modalContext?.existingGroups || []}
        existingVariables={graphData?.variables
          .filter(v => {
            const group = graphData.groups.find(g => g.id === v.groupId);
            return group?.collectionId === modalContext?.collectionId;
          })
          .map(v => v.name) || []}
        modes={modalContext?.collectionId ? 
          graphData?.variables
            .filter(v => {
              const group = graphData.groups.find(g => g.id === v.groupId);
              return group?.collectionId === modalContext.collectionId;
            })
            .flatMap(v => v.modes)
            .filter((mode, index, self) => 
              self.findIndex(m => m.id === mode.id) === index
            ) || [] 
          : []}
        onClose={() => setCreateVariableModalOpen(false)}
        onCreate={handleCreateVariable}
      />
      
      <CreateGroupModal
        isOpen={createGroupModalOpen}
        collectionName={modalContext?.collectionName || ''}
        collectionId={modalContext?.collectionId || ''}
        existingGroups={modalContext?.existingGroups || []}
        onClose={() => setCreateGroupModalOpen(false)}
        onCreate={handleCreateGroup}
      />
      
      {/* Rename Modal */}
      {renameContext && (
        <RenameModal
          isOpen={renameModalOpen}
          type={renameContext.type}
          currentName={renameContext.currentName}
          onClose={() => setRenameModalOpen(false)}
          onRename={handleRenameSubmit}
        />
      )}
      
      {/* Bulk Alias Picker */}
      {graphData && (
        <BulkAliasPicker
          isOpen={isBulkAliasPickerOpen}
          onClose={() => setIsBulkAliasPickerOpen(false)}
          selectedItems={multiSelect.getSelectedItems()}
          variables={graphData.variables}
          groups={graphData.groups}
          collections={graphData.collections}
          onCreateAliases={handleBulkCreateAliases}
        />
      )}
      
      {/* Keyboard Shortcuts Panel */}
      <KeyboardShortcutsPanel
        isOpen={isShortcutsPanelOpen}
        onClose={() => setIsShortcutsPanelOpen(false)}
        shortcuts={keyboardShortcuts}
      />
      
      {/* Resize Handle */}
      <ResizeHandle
        onResize={handleResize}
        minWidth={800}
        minHeight={600}
        maxWidth={2400}
        maxHeight={1600}
      />
      
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export { App };
export default App;
