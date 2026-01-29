import * as React from "react";
import { Plus, MoreHorizontal, ChevronRight, HelpCircle, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactButton } from "../common/CompactButton";
import { IconButton } from "../common/IconButton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompactTooltip } from "@/components/ui/compact-tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePaletteStore } from "@/store/palette-store";
import { STEPS, Step, PaletteSteps, getReadableTextColor, isValidHex } from "@colors/color-utils";
import { cn } from "@colors/utils";

// Download utility functions
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAsJSON(name: string, steps: PaletteSteps) {
  const data = {
    name,
    steps: Object.fromEntries(
      STEPS.filter(step => steps[step]).map(step => [step, steps[step]])
    )
  };
  downloadFile(JSON.stringify(data, null, 2), `${name.toLowerCase().replace(/\s+/g, '-')}.json`, "application/json");
}

function exportAsCSS(name: string, steps: PaletteSteps) {
  const cssName = name.toLowerCase().replace(/\s+/g, '-');
  const variables = STEPS
    .filter(step => steps[step])
    .map(step => `  --${cssName}-${step}: ${steps[step]};`)
    .join('\n');
  const css = `:root {\n${variables}\n}`;
  downloadFile(css, `${cssName}.css`, "text/css");
}

function exportAsText(name: string, steps: PaletteSteps) {
  const lines = STEPS
    .filter(step => steps[step])
    .map(step => `${step}: ${steps[step]}`)
    .join('\n');
  const text = `${name}\n${'='.repeat(name.length)}\n\n${lines}`;
  downloadFile(text, `${name.toLowerCase().replace(/\s+/g, '-')}.txt`, "text/plain");
}

function generatePaletteSVG(name: string, steps: PaletteSteps): string {
  const filledSteps = STEPS.filter(step => steps[step]);
  const cols = 6;
  const swatchSize = 80;
  const gap = 16;
  const labelHeight = 20;
  const hexLabelHeight = 16;
  const rows = Math.ceil(filledSteps.length / cols);

  const width = cols * swatchSize + (cols - 1) * gap;
  const height = rows * (labelHeight + swatchSize + hexLabelHeight + gap) - gap + 20;

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
  svgContent += `  <style>\n`;
  svgContent += `    .step-label { font-family: 'Geist Sans', system-ui, sans-serif; font-size: 12px; font-weight: 600; }\n`;
  svgContent += `    .hex-label { font-family: 'Geist Mono', ui-monospace, monospace; font-size: 10px; }\n`;
  svgContent += `  </style>\n`;
  svgContent += `  <text x="0" y="14" class="step-label" fill="#666">${name}</text>\n`;

  filledSteps.forEach((step, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * (swatchSize + gap);
    const y = 20 + row * (labelHeight + swatchSize + hexLabelHeight + gap);
    const hex = steps[step] || '#000000';

    const textColor = '#666';

    svgContent += `  <text x="${x + swatchSize / 2}" y="${y + 14}" text-anchor="middle" class="step-label" fill="${textColor}">${step}</text>\n`;
    svgContent += `  <rect x="${x}" y="${y + labelHeight}" width="${swatchSize}" height="${swatchSize}" fill="${hex}" rx="4"/>\n`;
    svgContent += `  <text x="${x + swatchSize / 2}" y="${y + labelHeight + swatchSize + 12}" text-anchor="middle" class="hex-label" fill="${textColor}">${hex.toUpperCase()}</text>\n`;
  });

  svgContent += `</svg>`;
  return svgContent;
}

async function copyPaletteAsSVG(name: string, steps: PaletteSteps): Promise<boolean> {
  const svg = generatePaletteSVG(name, steps);
  try {
    await navigator.clipboard.writeText(svg);
    return true;
  } catch {
    return false;
  }
}

interface PaletteItemProps {
  palette: { id: string; name: string; steps: PaletteSteps; primaryStep: Step };
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onEditChange: (name: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function PaletteItem({
  palette,
  isActive,
  isEditing,
  editingName,
  onSelect,
  onStartEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  onDuplicate,
}: PaletteItemProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [downloadHover, setDownloadHover] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'copied' | 'error'>('idle');
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) {
      setDownloadHover(false);
      setCopyStatus('idle');
    }
  }, [menuOpen]);

  return (
    <div
      className={cn(
        "group flex h-7 items-center justify-between rounded-lg pl-3 pr-1 text-xs transition-colors cursor-pointer select-none",
        isActive
          ? "bg-surface-elevated"
          : "hover:bg-surface"
      )}
      onClick={onSelect}
    >
      {isEditing ? (
        <Input
          value={editingName}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") onEditSave();
            if (e.key === "Escape") onEditCancel();
          }}
          className="h-5 px-1 py-0 text-xs rounded-lg"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate text-xs">{palette.name}</span>
      )}

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <IconButton
            icon={MoreHorizontal}
            variant="ghost"
            size="sm"
            aria-label="More options"
            className={cn(
              "h-5 w-5 transition-opacity",
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
          />
        </PopoverTrigger>
        <PopoverContent
          ref={menuRef}
          className="w-32 p-1"
          align="end"
          side="right"
          onMouseLeave={() => setDownloadHover(false)}
        >
          <div className="flex flex-col">
            <button
              className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onStartEdit();
              }}
            >
              Rename
            </button>

            <button
              className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDuplicate();
              }}
            >
              Duplicate
            </button>

            <div
              className="relative"
              onMouseEnter={() => setDownloadHover(true)}
            >
              <button
                className="flex items-center justify-between rounded px-2 py-1.5 text-xs hover:bg-accent text-left w-full cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Download</span>
                <ChevronRight className="h-2.5 w-2.5 opacity-50" />
              </button>

              {downloadHover && (
                <div
                  className="absolute left-full top-0 ml-1 w-28 rounded-md border bg-popover p-1"
                  onMouseEnter={() => setDownloadHover(true)}
                  onMouseLeave={() => setDownloadHover(false)}
                >
                  <button
                    className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left w-full cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportAsJSON(palette.name, palette.steps);
                      setMenuOpen(false);
                    }}
                  >
                    JSON
                  </button>
                  <button
                    className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left w-full cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportAsCSS(palette.name, palette.steps);
                      setMenuOpen(false);
                    }}
                  >
                    CSS
                  </button>
                  <button
                    className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left w-full cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportAsText(palette.name, palette.steps);
                      setMenuOpen(false);
                    }}
                  >
                    Text
                  </button>
                  <div className="my-1 h-px bg-border/50" />
                  <button
                    className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left w-full cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const success = await copyPaletteAsSVG(palette.name, palette.steps);
                      setCopyStatus(success ? 'copied' : 'error');
                      if (success) {
                        setTimeout(() => setMenuOpen(false), 800);
                      }
                    }}
                  >
                    {copyStatus === 'copied' ? '✓ Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy for Figma'}
                  </button>
                </div>
              )}
            </div>

            <div className="my-1 h-px bg-border/50" />

            <button
              className="rounded px-2 py-1.5 text-xs hover:bg-accent text-left cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              Delete
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Palette</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{palette.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteDialogOpen(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ColorSidebar() {
  const {
    palettes,
    activePaletteId,
    createPalette,
    deletePalette,
    setActivePalette,
    renamePalette,
    reorderPalettes,
    duplicatePalette,
    viewMode,
    setViewMode,
  } = usePaletteStore();

  const [newPaletteName, setNewPaletteName] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleCreate = () => {
    if (newPaletteName.trim()) {
      createPalette(newPaletteName.trim());
      setNewPaletteName("");
      setDialogOpen(false);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renamePalette(id, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const filteredPalettes = palettes
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-full w-48 flex-col bg-sidebar-background relative z-10">
      <div className="flex flex-col gap-2 px-2 pt-5 pb-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <CompactTooltip content="Create Palette">
            <DialogTrigger asChild>
              <CompactButton 
                icon={Plus} 
                label="New Palette" 
                className="w-full"
              />
            </DialogTrigger>
          </CompactTooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Palette</DialogTitle>
              <DialogDescription>
                Enter a name for your new color palette.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Palette Name</Label>
                <Input
                  id="name"
                  value={newPaletteName}
                  onChange={(e) => setNewPaletteName(e.target.value)}
                  placeholder="e.g., Brand Colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!newPaletteName.trim()}>
                Create Palette
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="px-2 py-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 px-2 pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
          {palettes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
              <p className="text-xs">No palettes yet</p>
              <p className="text-[10px]">Click + to create one</p>
            </div>
          ) : filteredPalettes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
              <p className="text-xs">No palettes found</p>
              <p className="text-[10px]">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredPalettes.map((palette) => (
                <PaletteItem
                  key={palette.id}
                  palette={palette}
                  isActive={activePaletteId === palette.id && (viewMode === "palette" || viewMode === "surface-stacking")}
                  isEditing={editingId === palette.id}
                  editingName={editingName}
                  onSelect={() => {
                    setActivePalette(palette.id);
                    setViewMode("palette");
                  }}
                  onStartEdit={() => startEditing(palette.id, palette.name)}
                  onEditChange={setEditingName}
                  onEditSave={() => handleRename(palette.id)}
                  onEditCancel={() => {
                    setEditingId(null);
                    setEditingName("");
                  }}
                  onDelete={() => deletePalette(palette.id)}
                  onDuplicate={() => duplicatePalette(palette.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3">
        <button
          onClick={() => setViewMode("how-it-works")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer",
            viewMode === "how-it-works"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>How it works</span>
        </button>
      </div>
    </div>
  );
}
