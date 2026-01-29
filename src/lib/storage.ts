/**
 * Safe storage adapter for Figma plugins
 * Handles localStorage unavailability in data URLs by providing fallbacks
 */

interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// In-memory storage fallback
class MemoryStorage implements StorageAdapter {
  private storage: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }
}

// Safe localStorage wrapper with fallback
class SafeLocalStorage implements StorageAdapter {
  private memoryFallback: MemoryStorage = new MemoryStorage();
  private localStorageAvailable: boolean;

  constructor() {
    // Test if localStorage is available
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.localStorageAvailable = true;
    } catch {
      this.localStorageAvailable = false;
    }
  }

  getItem(key: string): string | null {
    if (this.localStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch {
        // If localStorage becomes unavailable, fall back to memory
        this.localStorageAvailable = false;
        return this.memoryFallback.getItem(key);
      }
    }
    return this.memoryFallback.getItem(key);
  }

  setItem(key: string, value: string): void {
    if (this.localStorageAvailable) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch {
        // If localStorage becomes unavailable, fall back to memory
        this.localStorageAvailable = false;
      }
    }
    this.memoryFallback.setItem(key, value);
  }

  removeItem(key: string): void {
    if (this.localStorageAvailable) {
      try {
        localStorage.removeItem(key);
        return;
      } catch {
        this.localStorageAvailable = false;
      }
    }
    this.memoryFallback.removeItem(key);
  }
}

// Export singleton instance
export const safeStorage: StorageAdapter = new SafeLocalStorage();
