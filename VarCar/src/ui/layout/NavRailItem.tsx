import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@colors/utils";

const navRailItemVariants = cva(
  [
    "w-16 h-18 flex flex-col items-center justify-center gap-2",
    "rounded-2xl transition-all duration-instant ease-snappy",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-95",
  ],
  {
    variants: {
      isActive: {
        true: [
          "bg-surface-elevated text-foreground",
          "glow-primary",
        ],
        false: [
          "text-foreground-tertiary",
          "hover:text-foreground-secondary hover:glow-subtle",
          "active:bg-interactive-pressed",
        ],
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

export interface NavRailItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof navRailItemVariants> {
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
        className={cn(navRailItemVariants({ isActive }), className)}
        style={{ willChange: "transform, box-shadow" }}
        {...props}
      >
        <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
        <span className="text-[10px] font-medium leading-none text-center">
          {label}
        </span>
      </button>
    );
  }
);

NavRailItem.displayName = "NavRailItem";
