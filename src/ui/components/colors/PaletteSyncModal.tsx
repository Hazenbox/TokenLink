import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import {
  categorizePalette,
  groupPalettesByCategory,
  calculateVariableCount,
  checkLimits,
  COLLECTION_NAMES,
  CATEGORY_DESCRIPTIONS,
  FIGMA_VARIABLE_LIMIT,
  getCategoryLabel,
  getCategoryColor,
  type PaletteCategory,
} from "@/utils/palette-categorization";
import { cn } from "@colors/utils";

interface PaletteSyncModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  palettes: Array<{ id: string; name: string }>;
  onSync: (selectedPalettes: Array<{ id: string; category: PaletteCategory }>) => void;
  isSyncing?: boolean;
}

export function PaletteSyncModal({
  open,
  onOpenChange,
  palettes,
  onSync,
  isSyncing = false,
}: PaletteSyncModalProps) {
  const [selectedPalettes, setSelectedPalettes] = React.useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = React.useState<Set<PaletteCategory>>(
    new Set(['core', 'functional', 'extended'])
  );

  // Group palettes by category
  const groupedPalettes = React.useMemo(
    () => groupPalettesByCategory(palettes),
    [palettes]
  );

  // Calculate variable counts per collection
  const collectionCounts = React.useMemo(() => {
    const counts: Record<PaletteCategory, number> = { core: 0, functional: 0, extended: 0 };

    selectedPalettes.forEach(paletteId => {
      const palette = palettes.find(p => p.id === paletteId);
      if (palette) {
        const category = categorizePalette(palette.name);
        counts[category] += calculateVariableCount(1);
      }
    });

    return counts;
  }, [selectedPalettes, palettes]);

  // Check limits
  const { hasOverLimit, overLimit, warnings } = React.useMemo(
    () => checkLimits(collectionCounts),
    [collectionCounts]
  );

  // Auto-select all palettes on open
  React.useEffect(() => {
    if (open && selectedPalettes.size === 0) {
      setSelectedPalettes(new Set(palettes.map(p => p.id)));
    }
  }, [open, palettes, selectedPalettes.size]);

  const togglePalette = (paletteId: string) => {
    setSelectedPalettes(prev => {
      const next = new Set(prev);
      if (next.has(paletteId)) {
        next.delete(paletteId);
      } else {
        next.add(paletteId);
      }
      return next;
    });
  };

  const toggleCategory = (category: PaletteCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const selectAllInCategory = (category: PaletteCategory) => {
    const categoryPalettes = groupedPalettes[category];
    setSelectedPalettes(prev => {
      const next = new Set(prev);
      categoryPalettes.forEach(p => next.add(p.id));
      return next;
    });
  };

  const deselectAllInCategory = (category: PaletteCategory) => {
    const categoryPalettes = groupedPalettes[category];
    setSelectedPalettes(prev => {
      const next = new Set(prev);
      categoryPalettes.forEach(p => next.delete(p.id));
      return next;
    });
  };

  const handleSync = () => {
    const selections = Array.from(selectedPalettes).map(id => {
      const palette = palettes.find(p => p.id === id);
      const category = palette ? categorizePalette(palette.name) : 'extended';
      return { id, category };
    });
    onSync(selections);
  };

  const getCategoryPaletteCount = (category: PaletteCategory) => {
    return groupedPalettes[category].filter(p => selectedPalettes.has(p.id)).length;
  };

  const isAllSelectedInCategory = (category: PaletteCategory) => {
    return groupedPalettes[category].every(p => selectedPalettes.has(p.id));
  };

  const isSomeSelectedInCategory = (category: PaletteCategory) => {
    return groupedPalettes[category].some(p => selectedPalettes.has(p.id));
  };

  const getHealthStatus = (count: number): 'healthy' | 'warning' | 'error' => {
    if (count > FIGMA_VARIABLE_LIMIT) return 'error';
    if (count > 4900) return 'warning';
    return 'healthy';
  };

  const getHealthIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sync Palettes to Figma</DialogTitle>
          <DialogDescription>
            Select which palettes to sync. Palettes are automatically organized into three collections based on their purpose.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {(['core', 'functional', 'extended'] as PaletteCategory[]).map(category => {
              const categoryPalettes = groupedPalettes[category];
              const selectedCount = getCategoryPaletteCount(category);
              const variableCount = collectionCounts[category];
              const healthStatus = getHealthStatus(variableCount);
              const isExpanded = expandedCategories.has(category);
              const colors = getCategoryColor(category);
              const allSelected = isAllSelectedInCategory(category);
              const someSelected = isSomeSelectedInCategory(category);

              if (categoryPalettes.length === 0) return null;

              return (
                <div key={category} className={cn("rounded-lg border p-4", colors.bg)}>
                  {/* Category Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="p-0.5 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <h3 className={cn("font-semibold text-sm", colors.text)}>
                          {getCategoryLabel(category)}
                        </h3>
                        <Badge variant="secondary" className={cn("text-xs", colors.badge)}>
                          {selectedCount} of {categoryPalettes.length} palettes
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {someSelected && !allSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => selectAllInCategory(category)}
                            className="h-7 text-xs"
                          >
                            Select All
                          </Button>
                        )}
                        {someSelected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deselectAllInCategory(category)}
                            className="h-7 text-xs"
                          >
                            Deselect All
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Collection Info */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </span>
                      <div className="flex items-center gap-2">
                        {getHealthIcon(healthStatus)}
                        <span className={cn("font-mono", {
                          "text-green-600 dark:text-green-400": healthStatus === 'healthy',
                          "text-yellow-600 dark:text-yellow-400": healthStatus === 'warning',
                          "text-red-600 dark:text-red-400": healthStatus === 'error',
                        })}>
                          {variableCount.toLocaleString()} / {FIGMA_VARIABLE_LIMIT.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">variables</span>
                      </div>
                    </div>

                    {/* Warning/Error Messages */}
                    {healthStatus === 'error' && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2 text-xs text-red-700 dark:text-red-300">
                        ⚠️ Exceeds Figma's 5,000 variable limit. Deselect some palettes in this category.
                      </div>
                    )}
                    {healthStatus === 'warning' && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2 text-xs text-yellow-700 dark:text-yellow-300">
                        ⚠️ Approaching Figma's 5,000 variable limit. Consider limiting selections.
                      </div>
                    )}
                  </div>

                  {/* Palette List */}
                  {isExpanded && (
                    <div className="mt-3 space-y-1 pl-6">
                      {categoryPalettes.map(palette => (
                        <label
                          key={palette.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedPalettes.has(palette.id)}
                            onCheckedChange={() => togglePalette(palette.id)}
                            disabled={isSyncing}
                          />
                          <span className="text-sm">{palette.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto font-mono">
                            192 vars
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row justify-between items-center border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedPalettes.size} {selectedPalettes.size === 1 ? 'palette' : 'palettes'} selected •{' '}
            {Object.values(collectionCounts).reduce((a, b) => a + b, 0).toLocaleString()} total variables
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSyncing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSync}
              disabled={selectedPalettes.size === 0 || hasOverLimit || isSyncing}
            >
              {isSyncing ? 'Syncing...' : `Sync ${selectedPalettes.size} ${selectedPalettes.size === 1 ? 'Palette' : 'Palettes'}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
