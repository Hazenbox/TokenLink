import * as React from "react";
import { ThemeRipple } from "../../components/theme/ThemeRipple";
import { ColorSidebar } from "../../components/colors/ColorSidebar";
import { ScalePreview } from "../../components/colors/ScalePreview";
import { PaletteEditor } from "../../components/colors/PaletteEditor";
import { HowItWorks } from "../../components/HowItWorks";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { useViewStore } from "../../store/view-store";
import { usePaletteStore } from "@/store/palette-store";
import { cn } from "@colors/utils";

export function ColorView() {
  const { colorSubView } = useViewStore();
  const { isFullscreen } = usePaletteStore();
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Initialize the app
    const initializeApp = async () => {
      try {
        // Simulate initialization (could be loading saved state, etc.)
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsInitializing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize app");
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <LoadingState message="Initializing color system..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <ErrorState
          title="Initialization Error"
          message={error}
          onRetry={() => {
            setError(null);
            setIsInitializing(true);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
        <ThemeRipple />
        
        {!isFullscreen && (
          <ErrorBoundary fallback={<div className="w-56 border-r p-4 text-sm text-destructive">Sidebar error</div>}>
            <ColorSidebar />
          </ErrorBoundary>
        )}
        
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden",
          isFullscreen && "w-full"
        )}>
          <ErrorBoundary>
            {colorSubView === "palette" && (
              <div className="flex-1 grid grid-cols-2 overflow-hidden">
                <ErrorBoundary fallback={<div className="p-4 text-sm text-destructive">Editor error</div>}>
                  <div className="border-r overflow-hidden">
                    <PaletteEditor />
                  </div>
                </ErrorBoundary>
                <ErrorBoundary fallback={<div className="p-4 text-sm text-destructive">Preview error</div>}>
                  <div className="overflow-hidden">
                    <ScalePreview />
                  </div>
                </ErrorBoundary>
              </div>
            )}
            
            {colorSubView === "scale" && (
              <div className="flex-1 overflow-hidden">
                <ScalePreview />
              </div>
            )}
            
            {colorSubView === "how-it-works" && (
              <div className="flex-1 overflow-hidden">
                <HowItWorks />
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}
