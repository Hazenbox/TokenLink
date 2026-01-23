import * as React from "react";
import { Palette, Network } from "lucide-react";
import { useViewStore } from "@/store/view-store";
import { cn } from "@colors/utils";

export function NavigationRail() {
  const { mainView, setMainView } = useViewStore();

  const navItems = [
    {
      id: "colors" as const,
      icon: Palette,
      label: "Colors",
    },
    {
      id: "graph" as const,
      icon: Network,
      label: "Graph",
    },
  ];

  return (
    <div className="w-[200px] bg-background border-r border-border-subtle flex flex-col py-2">
      {/* MENU Section */}
      <div className="px-3 mb-3">
        <div className="text-xs uppercase tracking-wider text-foreground-tertiary mb-2 px-2">
          MENU
        </div>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = mainView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setMainView(item.id)}
                data-active={isActive}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors duration-instant ease-snappy",
                  "hover:bg-surface",
                  "data-[active=true]:bg-surface-elevated data-[active=true]:text-foreground",
                  !isActive && "text-foreground-tertiary"
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
