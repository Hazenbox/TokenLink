/**
 * Console Log Viewer Component
 * Displays console logs from the plugin with filtering and search
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Trash2, Copy, Search, Terminal, AlertCircle, Info, AlertTriangle, Check } from 'lucide-react';
import { LogEntry } from '../hooks/useConsoleLogs';

interface ConsoleLogViewerProps {
  logs: LogEntry[];
  isVisible: boolean;
  onClose: () => void;
  onClear: () => void;
}

export function ConsoleLogViewer({ logs, isVisible, onClose, onClear }: ConsoleLogViewerProps) {
  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Check if user has scrolled up
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Filter logs by level and search query
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesFilter = filter === 'all' || log.level === filter;
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [logs, filter, searchQuery]);

  const copyToClipboard = async () => {
    try {
      const text = filteredLogs
        .map(log => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          return `[${time}] [${log.level.toUpperCase()}] ${log.message}`;
        })
        .join('\n');
      
      await navigator.clipboard.writeText(text);
      setCopyStatus('success');
      
      // Reset after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy logs:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />;
      default:
        return <Info className="w-3 h-3 text-foreground-tertiary flex-shrink-0" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-950/20';
      case 'warn':
        return 'text-amber-400 bg-amber-950/20';
      default:
        return 'text-foreground bg-surface-elevated/50';
    }
  };

  const getFilterButtonStyle = (buttonFilter: string) => {
    const isActive = filter === buttonFilter;
    return `px-2 py-0.5 text-[10px] rounded transition-colors ${
      isActive
        ? 'bg-surface-elevated text-foreground'
        : 'bg-surface-elevated text-foreground-secondary hover:bg-surface-elevated/80'
    }`;
  };

  const errorCount = logs.filter(l => l.level === 'error').length;
  const warnCount = logs.filter(l => l.level === 'warn').length;

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl" style={{ zIndex: 2000, height: '40vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface-elevated">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-foreground-secondary" />
          <h3 className="text-xs font-semibold text-foreground">Console</h3>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-surface text-foreground-secondary">
              {filteredLogs.length} logs
            </span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-950/30 text-red-400">
                {errorCount} errors
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-950/30 text-amber-400">
                {warnCount} warnings
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-0.5 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-border-strong w-32"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-1">
            <button onClick={() => setFilter('all')} className={getFilterButtonStyle('all')}>
              All
            </button>
            <button onClick={() => setFilter('log')} className={getFilterButtonStyle('log')}>
              Log
            </button>
            <button onClick={() => setFilter('warn')} className={getFilterButtonStyle('warn')}>
              Warn
            </button>
            <button onClick={() => setFilter('error')} className={getFilterButtonStyle('error')}>
              Error
            </button>
          </div>

          {/* Action buttons */}
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
            title={
              copyStatus === 'success' 
                ? 'Copied!' 
                : copyStatus === 'error'
                ? 'Failed to copy'
                : 'Copy to clipboard'
            }
          >
            {copyStatus === 'success' ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : copyStatus === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-foreground-secondary" />
            )}
          </button>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5 text-foreground-secondary" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
            title="Close console"
          >
            <X className="w-3.5 h-3.5 text-foreground-secondary" />
          </button>
        </div>
      </div>

      {/* Logs container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs"
        style={{ height: 'calc(40vh - 40px)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-foreground-tertiary">
            <div className="text-center">
              <Terminal className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
              <p>{searchQuery ? 'No logs match your search' : 'No logs yet'}</p>
            </div>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className={`flex items-start gap-1.5 p-1.5 rounded ${getLogColor(log.level)}`}
            >
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground-tertiary text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-foreground-tertiary text-[10px] uppercase">
                    {log.level}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap break-words mt-1 text-xs leading-relaxed">
                  {log.message}
                </pre>
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-2 right-2 px-2 py-1 bg-surface-elevated text-foreground text-[10px] rounded shadow-lg hover:bg-interactive-hover transition-colors"
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}
