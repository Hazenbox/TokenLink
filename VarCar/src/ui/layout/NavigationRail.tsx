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
        {/* Logo at top */}
        <div className="mb-4 flex items-center justify-center">
          <svg width="35" height="21" viewBox="0 0 35 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-6 text-foreground" aria-label="Token Link">
            <path d="M14.394 20.75C13.3582 20.75 12.4742 20.384 11.742 19.652C11.01 18.9198 10.644 18.0358 10.644 17V8.652C10.0607 8.43533 9.58154 8.08883 9.20654 7.6125C8.83154 7.13617 8.64404 6.59975 8.64404 6.00325C8.64404 5.23842 8.91129 4.58833 9.44579 4.053C9.98029 3.51767 10.6293 3.25 11.3928 3.25C12.1565 3.25 12.8059 3.51767 13.341 4.053C13.8764 4.58833 14.144 5.23842 14.144 6.00325C14.144 6.59975 13.9565 7.13617 13.5815 7.6125C13.2065 8.08883 12.7274 8.43533 12.144 8.652V17C12.144 17.6188 12.3645 18.1485 12.8055 18.589C13.2465 19.0297 13.7766 19.25 14.3958 19.25C15.0151 19.25 15.5447 19.0297 15.9845 18.589C16.4242 18.1485 16.644 17.6188 16.644 17V7C16.644 5.96417 17.01 5.08017 17.742 4.348C18.4742 3.616 19.3582 3.25 20.394 3.25C21.4299 3.25 22.3139 3.616 23.046 4.348C23.778 5.08017 24.144 5.96417 24.144 7V15.348C24.7274 15.5647 25.2065 15.9112 25.5815 16.3875C25.9565 16.8638 26.144 17.4003 26.144 17.9968C26.144 18.7616 25.8768 19.4117 25.3423 19.947C24.8078 20.4823 24.1588 20.75 23.3953 20.75C22.6316 20.75 21.9822 20.4823 21.447 19.947C20.9117 19.4117 20.644 18.7616 20.644 17.9968C20.644 17.4003 20.8315 16.8597 21.2065 16.375C21.5815 15.8903 22.0607 15.548 22.644 15.348V7C22.644 6.38117 22.4235 5.8515 21.9825 5.411C21.5415 4.97033 21.0115 4.75 20.3923 4.75C19.773 4.75 19.2434 4.97033 18.8035 5.411C18.3639 5.8515 18.144 6.38117 18.144 7V17C18.144 18.0358 17.778 18.9198 17.046 19.652C16.3139 20.384 15.4299 20.75 14.394 20.75Z" fill="currentColor"/>
          </svg>
        </div>
        
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
