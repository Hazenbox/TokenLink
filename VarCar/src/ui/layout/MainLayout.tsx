import * as React from "react";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { NavigationRail } from "./NavigationRail";
import { CanvasBackground } from "./CanvasBackground";
import { ColorApp } from "../ColorApp";
import { App } from "../App";
import { useViewStore } from "@/store/view-store";

export function MainLayout() {
  const { mainView } = useViewStore();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="varcar-theme">
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <NavigationRail />
        
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <CanvasBackground />
          
          {mainView === "colors" ? <ColorApp /> : <App />}
        </div>
      </div>
    </ThemeProvider>
  );
}
