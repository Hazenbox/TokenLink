import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  sessionExpiry: number | null;
  
  // Actions
  login: (password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

// Safe storage adapter that handles SSR
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(name, value);
    } catch {
      // Ignore errors
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(name);
    } catch {
      // Ignore errors
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      sessionExpiry: null,

      login: async (password: string, rememberMe: boolean) => {
        try {
          // Call API route to verify password
          const response = await fetch("/api/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password }),
          });

          if (!response.ok) {
            return false;
          }

          const data = await response.json();
          
          if (data.success) {
            // Calculate expiry: 30 days for remember me, 24 hours otherwise
            const expiryTime = rememberMe 
              ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
              : Date.now() + (24 * 60 * 60 * 1000); // 24 hours

            set({
              isAuthenticated: true,
              sessionExpiry: expiryTime,
            });

            return true;
          }

          return false;
        } catch (error) {
          console.error("Authentication error:", error);
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          sessionExpiry: null,
        });
      },

      checkAuth: () => {
        const state = get();
        
        // Check if authenticated and session hasn't expired
        if (state.isAuthenticated && state.sessionExpiry) {
          if (Date.now() < state.sessionExpiry) {
            return true;
          } else {
            // Session expired, logout
            state.logout();
            return false;
          }
        }
        
        return false;
      },
    }),
    {
      name: "rangule-auth",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
      }),
    }
  )
);
