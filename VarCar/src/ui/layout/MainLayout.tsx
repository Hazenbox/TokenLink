import * as React from "react";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { NavigationRail } from "./NavigationRail";
import { useViewStore } from "../store/view-store";
import { ColorView } from "../views/ColorView";
import { GraphView } from "../views/GraphView";

export function MainLayout() {
  const { mainView } = useViewStore();

  return (
    <ThemeProvider defaultTheme="system" storageKey="varcar-color-theme">
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <NavigationRail />
        <main className="flex-1 overflow-hidden">
          {mainView === 'colors' ? <ColorView /> : <GraphView />}
        </main>
      </div>
    </ThemeProvider>
  );
}
