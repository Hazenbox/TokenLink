/**
 * Environment-aware logging utility
 * Strips logs in production builds for better performance
 */

// Detect development mode - use same pattern as performance.ts
// Vite will replace process.env.NODE_ENV during build
const isDevelopment = 
  // @ts-expect-error - process.env is replaced by Vite at build time
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

/**
 * Logs a message only in development mode
 */
export function devLog(...args: any[]): void {
  if (isDevelopment) {
    console.log(...args);
  }
}

/**
 * Logs a warning only in development mode
 */
export function devWarn(...args: any[]): void {
  if (isDevelopment) {
    console.warn(...args);
  }
}

/**
 * Logs an error (always logged, even in production)
 */
export function devError(...args: any[]): void {
  if (isDevelopment) {
    console.error(...args);
  }
  // In production, you might want to send to error tracking service
  // For now, we still log errors in production as they're critical
  if (!isDevelopment) {
    console.error(...args);
  }
}

/**
 * Logs debug information only in development mode
 */
export function devDebug(...args: any[]): void {
  if (isDevelopment) {
    console.debug(...args);
  }
}
