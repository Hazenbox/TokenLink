import * as React from "react";
import { ColorApp } from "./ColorApp";
import { App } from "./App";
import { AutomateApp } from "./AutomateApp";
import { safeStorage } from "@/lib/storage";

export type ActiveApp = "color" | "figzig" | "automate";

// Global app switcher context
interface AppSwitcherContextValue {
  activeApp: ActiveApp;
  switchToApp: (app: ActiveApp) => void;
}

const AppSwitcherContext = React.createContext<AppSwitcherContextValue | undefined>(undefined);

export function useAppSwitcher() {
  const context = React.useContext(AppSwitcherContext);
  if (!context) {
    throw new Error("useAppSwitcher must be used within AppSwitcher");
  }
  return context;
}

/**
 * AppSwitcherProvider - Context provider for app switching
 */
export function AppSwitcherProvider({ children }: { children: React.ReactNode }) {
  const [activeApp, setActiveApp] = React.useState<ActiveApp>(() => {
    const stored = safeStorage.getItem("varcar-active-app");
    return (stored as ActiveApp) || "color";
  });

  const switchToApp = React.useCallback((app: ActiveApp) => {
    safeStorage.setItem("varcar-active-app", app);
    setActiveApp(app);
  }, []);

  const value = React.useMemo(
    () => ({
      activeApp,
      switchToApp,
    }),
    [activeApp, switchToApp]
  );

  return (
    <AppSwitcherContext.Provider value={value}>
      {children}
    </AppSwitcherContext.Provider>
  );
}

/**
 * AppSwitcher - Content renderer based on active app
 */
export function AppSwitcher() {
  const { activeApp } = useAppSwitcher();

  if (activeApp === "color") {
    return <ColorApp />;
  } else if (activeApp === "automate") {
    return <AutomateApp />;
  } else {
    return <App />;
  }
}
