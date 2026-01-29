import * as React from "react";
import { Palette, Network, Sparkles, HelpCircle } from "lucide-react";
import { useAppSwitcher } from "@/ui/AppSwitcher";
import { NavRailItem } from "./NavRailItem";
import { HowItWorksPanel } from "../components/HowItWorksPanel";

export function NavigationRail() {
  const { activeApp, switchToApp } = useAppSwitcher();
  const [showGuide, setShowGuide] = React.useState(false);

  const navItems = [
    {
      id: "color" as const,
      icon: Palette,
      label: "Colors",
      ariaLabel: "Colors view",
    },
    {
      id: "figzig" as const,
      icon: Network,
      label: "Graph",
      ariaLabel: "Graph view",
    },
    {
      id: "automate" as const,
      icon: Sparkles,
      label: "Automate",
      ariaLabel: "Automate view",
    },
  ];

  return (
    <>
      <nav
        className="w-20 bg-background border-r border-border-subtle flex flex-col items-center py-6 gap-3"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = activeApp === item.id;
          
          return (
            <NavRailItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              ariaLabel={item.ariaLabel}
              onClick={() => switchToApp(item.id)}
            />
          );
        })}
        
        {/* Spacer to push guide to bottom */}
        <div className="flex-1" />
        
        {/* How it Works/Guide at bottom */}
        <NavRailItem
          icon={HelpCircle}
          label="Guide"
          isActive={showGuide}
          ariaLabel="How it works guide"
          onClick={() => setShowGuide(!showGuide)}
        />
      </nav>
      
      {/* How It Works Panel */}
      <HowItWorksPanel isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}
