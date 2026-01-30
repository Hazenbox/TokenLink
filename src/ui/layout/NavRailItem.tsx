import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@colors/utils";

export interface NavRailItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  ariaLabel: string;
}

export const NavRailItem = React.forwardRef<HTMLButtonElement, NavRailItemProps>(
  ({ icon: Icon, label, isActive = false, ariaLabel, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-current={isActive ? "page" : undefined}
        data-active={isActive}
        className={cn(
          "group w-14 flex flex-col items-center justify-center gap-1 py-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors duration-instant ease-snappy",
          className
        )}
        {...props}
      >
        {/* Icon container with background */}
        <div
          className={cn(
            "w-9 h-6 flex items-center justify-center rounded-full",
            "transition-all duration-instant ease-snappy",
            isActive
              ? "bg-surface-elevated"
              : "group-hover:bg-surface"
          )}
        >
          <Icon 
            className={cn(
              "w-3.5 h-3.5 shrink-0 transition-colors duration-instant ease-snappy",
              isActive
                ? "text-foreground"
                : "text-foreground-tertiary group-hover:text-foreground-secondary"
            )}
            aria-hidden="true"
          />
        </div>
        
        {/* Label */}
        <span
          className={cn(
            "text-[10px] font-medium leading-none text-center",
            "transition-colors duration-instant ease-snappy",
            isActive
              ? "text-foreground"
              : "text-foreground-tertiary group-hover:text-foreground-secondary"
          )}
        >
          {label}
        </span>
      </button>
    );
  }
);

NavRailItem.displayName = "NavRailItem";
