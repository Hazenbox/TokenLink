import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@colors/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 p-4 text-center", className)}>
      <div className="space-y-0.5">
        <h3 className="text-xs text-muted-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground/60 max-w-md">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface SearchEmptyStateProps {
  searchQuery: string;
  onClear: () => void;
  className?: string;
}

export function SearchEmptyState({ searchQuery, onClear, className }: SearchEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 p-3 text-center", className)}>
      <div className="space-y-0.5">
        <h3 className="text-xs text-muted-foreground">No results found</h3>
        <p className="text-xs text-muted-foreground/60 max-w-md">
          No results for &quot;{searchQuery}&quot;. Try adjusting your search.
        </p>
      </div>
      <Button onClick={onClear} variant="outline" size="sm">
        Clear Search
      </Button>
    </div>
  );
}
