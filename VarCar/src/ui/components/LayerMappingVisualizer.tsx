/**
 * Layer Mapping Visualizer
 * Compact node-based UI for configuring layer architecture
 */

import React, { useState, useEffect } from 'react';
import { useLayerMappingStore } from '@/store/layer-mapping-store';
import { LayerDefinition } from '@/models/layer-mapping';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  RotateCcw,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/colors/utils';

export function LayerMappingVisualizer() {
  const { 
    config, 
    updateLayer, 
    toggleLayerEnabled, 
    resetToDefault,
    exportConfig,
    getValidation
  } = useLayerMappingStore();
  
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const validation = getValidation();
  
  // Load config on mount
  useEffect(() => {
    useLayerMappingStore.getState().loadConfig();
  }, []);
  
  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `layer-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const sortedLayers = [...config.layers].sort((a, b) => a.order - b.order);
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-3 h-3 text-foreground-tertiary" />
          <span className="text-[10px] text-foreground-tertiary">
            {config.layers.filter(l => l.enabled).length} / {config.layers.length} layers enabled
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleExport}
            className="p-1 hover:bg-surface-elevated rounded"
            title="Export configuration"
          >
            <Download className="w-3 h-3 text-foreground-tertiary" />
          </button>
          <button
            onClick={resetToDefault}
            className="p-1 hover:bg-surface-elevated rounded"
            title="Reset to default"
          >
            <RotateCcw className="w-3 h-3 text-foreground-tertiary" />
          </button>
        </div>
      </div>
      
      {/* Validation Warnings */}
      {!validation.valid && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {validation.errors.map((error, idx) => (
                <div key={idx} className="text-red-400">{error}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {validation.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className="text-yellow-400">{warning}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Layer Nodes */}
      <div className="space-y-1">
        {sortedLayers.map((layer, index) => (
          <LayerNode
            key={layer.id}
            layer={layer}
            index={index}
            isFirst={index === 0}
            isExpanded={expandedLayer === layer.id}
            onToggleExpand={() => setExpandedLayer(
              expandedLayer === layer.id ? null : layer.id
            )}
            onToggleEnabled={() => toggleLayerEnabled(layer.id)}
            onUpdate={(updates) => updateLayer(layer.id, updates)}
            allLayers={sortedLayers}
          />
        ))}
      </div>
      
      {/* Advanced Options */}
      <div className="pt-2 border-t border-border/30">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[10px] text-foreground-tertiary hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Advanced Options
        </button>
        
        {showAdvanced && (
          <div className="mt-2 space-y-2 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.globalRules.validateContrast}
                onChange={(e) => {
                  const newConfig = {
                    ...config,
                    globalRules: {
                      ...config.globalRules,
                      validateContrast: e.target.checked
                    }
                  };
                  useLayerMappingStore.setState({ config: newConfig });
                }}
                className="w-3 h-3"
              />
              <span className="text-foreground-secondary">Validate contrast ratios</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.globalRules.autoSyncPrimitives}
                onChange={(e) => {
                  const newConfig = {
                    ...config,
                    globalRules: {
                      ...config.globalRules,
                      autoSyncPrimitives: e.target.checked
                    }
                  };
                  useLayerMappingStore.setState({ config: newConfig });
                }}
                className="w-3 h-3"
              />
              <span className="text-foreground-secondary">Auto-sync primitives from RangDe</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.globalRules.skipMissingLayers}
                onChange={(e) => {
                  const newConfig = {
                    ...config,
                    globalRules: {
                      ...config.globalRules,
                      skipMissingLayers: e.target.checked
                    }
                  };
                  useLayerMappingStore.setState({ config: newConfig });
                }}
                className="w-3 h-3"
              />
              <span className="text-foreground-secondary">Skip missing layers during generation</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

interface LayerNodeProps {
  layer: LayerDefinition;
  index: number;
  isFirst: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onUpdate: (updates: Partial<LayerDefinition>) => void;
  allLayers: LayerDefinition[];
}

function LayerNode({
  layer,
  index,
  isFirst,
  isExpanded,
  onToggleExpand,
  onToggleEnabled,
  onUpdate,
  allLayers
}: LayerNodeProps) {
  return (
    <div className="relative">
      {/* Connection Line */}
      {!isFirst && (
        <div className="absolute left-3 -top-1 h-1 w-px bg-border" />
      )}
      
      {/* Layer Node */}
      <div className={cn(
        "flex items-center gap-2 p-2 rounded border transition-all",
        layer.enabled 
          ? "border-border bg-surface hover:bg-surface-elevated" 
          : "border-border/30 bg-surface/30 opacity-60"
      )}>
        {/* Enable/Disable Toggle */}
        <button
          onClick={onToggleEnabled}
          disabled={layer.isAutoGenerated}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
            layer.enabled 
              ? "border-blue-500 bg-blue-500" 
              : "border-border bg-transparent",
            layer.isAutoGenerated && "opacity-50 cursor-not-allowed"
          )}
          title={layer.isAutoGenerated ? "Auto-generated layer" : "Toggle layer"}
        >
          {layer.enabled && <Check className="w-3 h-3 text-white" />}
        </button>
        
        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground truncate">
              {layer.displayName}
            </span>
            {layer.isAutoGenerated && (
              <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                AUTO
              </span>
            )}
            {layer.modes && layer.modes.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                {layer.modes.length} modes
              </span>
            )}
          </div>
          <div className="text-[10px] text-foreground-secondary truncate">
            {layer.description}
          </div>
        </div>
        
        {/* Expand Button */}
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-background rounded flex-shrink-0"
        >
          {isExpanded ? 
            <ChevronUp className="w-3 h-3 text-foreground-tertiary" /> : 
            <ChevronDown className="w-3 h-3 text-foreground-tertiary" />
          }
        </button>
      </div>
      
      {/* Expanded Configuration */}
      {isExpanded && (
        <div className="mt-1 ml-7 p-2 border border-border/50 rounded bg-surface-elevated space-y-2">
          {/* Collection Name */}
          <div>
            <label className="text-[10px] text-foreground-secondary block mb-1">
              Collection Name
            </label>
            <Input
              value={layer.collectionName}
              onChange={(e) => onUpdate({ collectionName: e.target.value })}
              className="h-6 text-xs"
              disabled={layer.isAutoGenerated}
            />
          </div>
          
          {/* Naming Pattern */}
          <div>
            <label className="text-[10px] text-foreground-secondary block mb-1">
              Naming Pattern
            </label>
            <Input
              value={layer.namingPattern}
              onChange={(e) => onUpdate({ namingPattern: e.target.value })}
              className="h-6 text-xs font-mono"
              placeholder="{group}/{step}/{scale}"
              disabled={layer.isAutoGenerated}
            />
          </div>
          
          {/* Aliases To Dropdown */}
          {layer.order > 0 && (
            <div>
              <label className="text-[10px] text-foreground-secondary block mb-1">
                Aliases To Layer
              </label>
              <select
                value={layer.aliasesToLayer || ''}
                onChange={(e) => onUpdate({ aliasesToLayer: e.target.value || undefined })}
                className="w-full h-6 text-xs bg-background border border-border rounded px-2"
                disabled={layer.isAutoGenerated}
              >
                <option value="">None (Direct values)</option>
                {allLayers
                  .filter(l => l.order < layer.order && l.enabled)
                  .map(l => (
                    <option key={l.id} value={l.id}>
                      {l.displayName} ({l.collectionName})
                    </option>
                  ))
                }
              </select>
            </div>
          )}
          
          {/* Modes (if multi-mode) */}
          {layer.modes && layer.modes.length > 0 && (
            <div>
              <label className="text-[10px] text-foreground-secondary block mb-1">
                Modes ({layer.modes.length})
              </label>
              <div className="flex flex-wrap gap-1">
                {layer.modes.map((mode, idx) => (
                  <span 
                    key={idx}
                    className="text-[10px] px-2 py-0.5 bg-background border border-border rounded"
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Estimated Variable Count */}
          {layer.estimatedVariableCount && (
            <div className="text-[10px] text-foreground-tertiary">
              Est. {layer.estimatedVariableCount.toLocaleString()} variables
            </div>
          )}
        </div>
      )}
    </div>
  );
}
