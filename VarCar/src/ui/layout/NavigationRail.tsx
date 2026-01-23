import * as React from "react";
import { Palette, Network } from "lucide-react";
import { useViewStore } from "@/store/view-store";
import { NavRailItem } from "./NavRailItem";

export function NavigationRail() {
  const { mainView, setMainView } = useViewStore();

  const navItems = [
    {
      id: "colors" as const,
      icon: Palette,
      label: "Colors",
      ariaLabel: "Colors view",
    },
    {
      id: "graph" as const,
      icon: Network,
      label: "Graph",
      ariaLabel: "Graph view",
    },
  ];

  return (
    <nav
      className="w-20 bg-background border-r border-border-subtle flex flex-col items-center py-6 gap-3"
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const isActive = mainView === item.id;
        
        return (
          <NavRailItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={isActive}
            ariaLabel={item.ariaLabel}
            onClick={() => setMainView(item.id)}
          />
        );
      })}
    </nav>
  );
}
