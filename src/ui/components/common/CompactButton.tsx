import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@colors/utils";

interface CompactButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: "ghost" | "secondary";
  className?: string;
}

export const CompactButton = React.forwardRef<HTMLButtonElement, CompactButtonProps>(
  ({ icon: Icon, label, variant = "secondary", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size="sm"
        className={cn(
          "h-7 justify-start gap-1.5 cursor-pointer text-xs px-2",
          variant === "secondary" && "bg-surface",
          className
        )}
        {...props}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </Button>
    );
  }
);

CompactButton.displayName = "CompactButton";
