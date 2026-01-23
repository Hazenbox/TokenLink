import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({ message = "Loading...", size = "md", className }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && (
        <p className={cn("text-muted-foreground", textSizes[size])}>{message}</p>
      )}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  return (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
  );
}

interface LoadingOverlayProps {
  message?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ message, children }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-6 shadow-lg border">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {children}
      </div>
    </div>
  );
}
