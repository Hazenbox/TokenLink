import * as React from "react";
import { Plus, Search, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@colors/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  const defaultIcon = <FileQuestion className="h-12 w-12 text-muted-foreground/50" />;

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-12 text-center", className)}>
      <div className="rounded-full bg-muted/50 p-6">
        {icon || defaultIcon}
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action && (
        <Button onClick={action.onClick} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
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
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8 text-center", className)}>
      <div className="rounded-full bg-muted/50 p-6">
        <Search className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">No results found</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No results for &quot;{searchQuery}&quot;. Try adjusting your search.
        </p>
      </div>
      <Button onClick={onClear} variant="outline" size="sm">
        Clear Search
      </Button>
    </div>
  );
}
