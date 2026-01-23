import * as React from "react";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  className,
  variant = "destructive"
}: ErrorStateProps) {
  const Icon = variant === "warning" ? AlertCircle : XCircle;
  
  const iconColors = {
    default: "text-muted-foreground",
    destructive: "text-destructive",
    warning: "text-yellow-500"
  };

  const bgColors = {
    default: "bg-muted/50",
    destructive: "bg-destructive/10",
    warning: "bg-yellow-500/10"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8 text-center", className)}>
      <div className={cn("rounded-full p-3", bgColors[variant])}>
        <Icon className={cn("h-8 w-8", iconColors[variant])} />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  variant?: "default" | "destructive" | "warning";
}

export function ErrorBanner({ message, onDismiss, variant = "destructive" }: ErrorBannerProps) {
  const bgColors = {
    default: "bg-muted",
    destructive: "bg-destructive/10 border-destructive/20",
    warning: "bg-yellow-500/10 border-yellow-500/20"
  };

  const textColors = {
    default: "text-foreground",
    destructive: "text-destructive",
    warning: "text-yellow-700 dark:text-yellow-400"
  };

  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg border p-3", bgColors[variant])}>
      <div className="flex items-center gap-3">
        <AlertCircle className={cn("h-4 w-4 shrink-0", textColors[variant])} />
        <p className={cn("text-sm", textColors[variant])}>{message}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onDismiss}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
