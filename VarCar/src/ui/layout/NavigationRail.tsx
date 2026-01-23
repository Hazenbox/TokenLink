import * as React from "react";
import { Palette, Network } from "lucide-react";
import { useViewStore, type MainView } from "../store/view-store";
import { cn } from "@colors/utils";

export function NavigationRail() {
  const { mainView, setMainView } = useViewStore();

  const navItems: Array<{ id: MainView; icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = [
    { id: 'colors', icon: Palette, label: 'Colors' },
    { id: 'graph', icon: Network, label: 'Graph' },
  ];

  return (
    <nav
      className="flex flex-col items-center w-12 bg-card border-r border-border py-2 gap-1"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = mainView === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => setMainView(item.id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-md transition-fast",
              "hover:bg-accent focus-ring focus:outline-none",
              isActive 
                ? "bg-accent text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
            title={item.label}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </nav>
  );
}
