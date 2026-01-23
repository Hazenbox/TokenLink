import * as React from "react";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { ThemeRipple } from "./components/theme/ThemeRipple";
import { ColorSidebar } from "./components/colors/ColorSidebar";
import { ScalePreview } from "./components/colors/ScalePreview";
import { PaletteEditor } from "./components/colors/PaletteEditor";
import { SurfaceStacking } from "./components/colors/SurfaceStacking";
import { HowItWorks } from "./components/HowItWorks";
import { usePaletteStore } from "./lib/stores/paletteStore";
import { cn } from "./lib/utils";

export function ColorApp() {
  const { viewMode, isFullscreen } = usePaletteStore();

  return (
    <ThemeProvider defaultTheme="system" storageKey="varcar-color-theme">
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <ThemeRipple />
        
        {!isFullscreen && <ColorSidebar />}
        
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isFullscreen && "w-full"
        )}>
          {viewMode === "palette" && (
            <div className="flex-1 grid grid-cols-2 overflow-hidden">
              <div className="border-r overflow-hidden">
                <PaletteEditor />
              </div>
              <div className="overflow-hidden">
                <ScalePreview />
              </div>
            </div>
          )}
          
          {viewMode === "surface-stacking" && (
            <div className="flex-1 overflow-hidden">
              <SurfaceStacking />
            </div>
          )}
          
          {viewMode === "how-it-works" && (
            <div className="flex-1 overflow-hidden">
              <HowItWorks />
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
