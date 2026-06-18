import * as React from "react";
import { ColorApp } from "./ColorApp";
import { App } from "./App";
import { AutomateAppWrapper } from "./AutomateAppWrapper";
import { GuidePage } from "./views/GuidePage";
import { safeStorage } from "@/lib/storage";
import { AutomateErrorBoundary } from "./components/AutomateErrorBoundary";

export type ActiveApp = "color" | "figzig" | "automate" | "guide";

/** Temporarily hide Graph tab — set false in NavigationRail too */
export const SHOW_GRAPH_TAB = false;

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
    const app = (stored as ActiveApp) || "color";
    if (!SHOW_GRAPH_TAB && app === "figzig") {
      return "color";
    }
    return app;
  });

  const switchToApp = React.useCallback((app: ActiveApp) => {
    if (!SHOW_GRAPH_TAB && app === "figzig") {
      return;
    }
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
    return (
      <AutomateErrorBoundary>
        <AutomateAppWrapper />
      </AutomateErrorBoundary>
    );
  } else if (activeApp === "guide") {
    return <GuidePage />;
  } else {
    return <App />;
  }
}
