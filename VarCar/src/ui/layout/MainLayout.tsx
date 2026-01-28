import * as React from "react";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import { NavigationRail } from "./NavigationRail";
import { CanvasBackground } from "./CanvasBackground";
import { ResizeHandle } from "../components/ResizeHandle";
import { AppSwitcher, AppSwitcherProvider } from "../AppSwitcher";
import { ConsoleLogViewer } from "../components/ConsoleLogViewer";
import { useConsoleLogs } from "../hooks/useConsoleLogs";

export function MainLayout() {
  const { logs, isVisible, clearLogs, closeConsole } = useConsoleLogs();

  // Handler for window resize
  const handleResize = (width: number, height: number) => {
    window.parent.postMessage(
      { pluginMessage: { type: 'resize', width, height } },
      '*'
    );
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="figmap-theme">
      <AppSwitcherProvider>
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
          <NavigationRail />
          
          <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
            <CanvasBackground />
            
            <AppSwitcher />
          </div>
          
          {/* Resize Handle - available across all views */}
          <ResizeHandle onResize={handleResize} />
          
          {/* Console Log Viewer - appears at bottom when visible */}
          <ConsoleLogViewer
            logs={logs}
            isVisible={isVisible}
            onClose={closeConsole}
            onClear={clearLogs}
          />
        </div>
      </AppSwitcherProvider>
    </ThemeProvider>
  );
}
