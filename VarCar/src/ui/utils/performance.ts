/**
 * Performance monitoring utilities for VarCar
 */

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
  componentCount: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start measuring a performance metric
   */
  start(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  /**
   * End measuring a performance metric
   */
  end(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      console.warn(`Performance: No start time found for "${label}"`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(label, duration);
    this.startTimes.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Get a specific metric
   */
  getMetric(label: string): number | undefined {
    return this.metrics.get(label);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return undefined;
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const metrics = this.getAllMetrics();
    const memory = this.getMemoryUsage();

    console.group('[Performance Summary]');
    Object.entries(metrics).forEach(([label, duration]) => {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    });
    if (memory) {
      console.log(`Memory Usage: ${memory.toFixed(2)}MB`);
    }
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render time
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderCount.current++;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName} rendered ${renderCount.current} times`);
    }
  });

  const measureRender = React.useCallback((label: string) => {
    performanceMonitor.start(`${componentName}:${label}`);
    return () => performanceMonitor.end(`${componentName}:${label}`);
  }, [componentName]);

  return { measureRender, renderCount: renderCount.current };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure bundle size impact
 */
export function logBundleSize(): void {
  if (process.env.NODE_ENV === 'production') {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let totalSize = 0;

    resources.forEach((resource) => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        totalSize += resource.transferSize || 0;
      }
    });

    console.log(`[Bundle Size] Total: ${(totalSize / 1024).toFixed(2)}KB`);
  }
}

/**
 * React import for hooks
 */
import * as React from 'react';
