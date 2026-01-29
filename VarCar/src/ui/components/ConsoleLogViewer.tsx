/**
 * Console Log Viewer Component
 * Displays console logs from the plugin with filtering and search
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, Trash2, Copy, Search, Terminal, AlertCircle, Info, AlertTriangle } from 'lucide-react';
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

  const copyToClipboard = () => {
    const text = filteredLogs
      .map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `[${time}] [${log.level.toUpperCase()}] ${log.message}`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(text);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-foreground-tertiary flex-shrink-0" />;
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
    return `px-3 py-1 text-xs rounded transition-colors ${
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-elevated">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-foreground-secondary" />
          <h3 className="text-sm font-semibold text-foreground">Console</h3>
          <div className="flex items-center gap-1 text-xs">
            <span className="px-2 py-0.5 rounded bg-surface text-foreground-secondary">
              {filteredLogs.length} logs
            </span>
            {errorCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-950/30 text-red-400">
                {errorCount} errors
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-950/30 text-amber-400">
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
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-border-strong w-48"
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
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4 text-foreground-secondary" />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4 text-foreground-secondary" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-elevated rounded transition-colors"
            title="Close console"
          >
            <X className="w-4 h-4 text-foreground-secondary" />
          </button>
        </div>
      </div>

      {/* Logs container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto p-2 space-y-1 font-mono text-xs"
        style={{ height: 'calc(40vh - 48px)' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-foreground-tertiary">
            <div className="text-center">
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? 'No logs match your search' : 'No logs yet'}</p>
            </div>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className={`flex items-start gap-2 p-2 rounded ${getLogColor(log.level)}`}
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
          className="absolute bottom-4 right-4 px-3 py-1.5 bg-surface-elevated text-foreground text-xs rounded shadow-lg hover:bg-interactive-hover transition-colors"
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}
