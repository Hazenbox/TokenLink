/**
 * Hook for managing console logs from the plugin
 * Captures logs sent from code.ts and provides filtering/search functionality
 */

import { useEffect, useState, useCallback } from 'react';

export interface LogEntry {
  id: string;
  level: 'log' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export function useConsoleLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    const msg = event.data.pluginMessage;
    if (!msg || msg.type !== 'console-log') return;

    const logData = msg.data as { level: 'log' | 'warn' | 'error'; message: string; timestamp: number };
    
    const newLog: LogEntry = {
      id: `${logData.timestamp}-${Math.random()}`,
      level: logData.level,
      message: logData.message,
      timestamp: logData.timestamp
    };

    setLogs(prev => [...prev, newLog]);

    // Auto-open console on errors
    if (logData.level === 'error') {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const openConsole = useCallback(() => {
    setIsVisible(true);
  }, []);

  const closeConsole = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    logs,
    isVisible,
    clearLogs,
    toggleVisibility,
    openConsole,
    closeConsole
  };
}
