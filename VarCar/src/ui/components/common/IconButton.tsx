import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@colors/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: "ghost" | "secondary";
  size?: "sm" | "md";
  className?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = "ghost", size = "sm", className, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-6 w-6 p-0",
      md: "h-7 w-7 p-0",
    };
    
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          "rounded-full cursor-pointer",
          variant === "secondary" && "bg-surface",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <Icon className="h-3.5 w-3.5 opacity-50" />
        <span className="sr-only">{props["aria-label"] || "Button"}</span>
      </Button>
    );
  }
);

IconButton.displayName = "IconButton";
