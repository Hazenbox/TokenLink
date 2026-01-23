import * as React from "react";
import { Plus, MoreHorizontal, ChevronRight, HelpCircle, Search, GripVertical, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
import { ThemeToggle } from "../theme/ThemeToggle";
import { useViewStore } from "../../store/view-store";
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
  svgContent += `    .step-label { font-family: system-ui, sans-serif; font-size: 12px; font-weight: 600; }\n`;
  svgContent += `    .hex-label { font-family: ui-monospace, monospace; font-size: 10px; }\n`;
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

  const baseHex = palette.steps[300 as Step];
  const activeBg = isValidHex(baseHex) ? baseHex : undefined;
  const activeText = activeBg ? getReadableTextColor(activeBg) : undefined;

  return (
    <div
      style={{
        ...(isActive && activeBg ? { backgroundColor: activeBg, color: activeText } : {})
      }}
      className={cn(
        "group flex h-8 items-center justify-between rounded-lg pl-3 pr-1 text-sm transition-colors cursor-pointer select-none",
        isActive
          ? (!activeBg && "bg-sidebar-accent text-sidebar-accent-foreground")
          : "hover:bg-sidebar-accent/50"
      )}
      onClick={onSelect}
    >
      <div
        className="mr-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 transition-opacity touch-none"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 pointer-events-none" />
      </div>
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
          style={isActive && activeText ? { color: activeText, backgroundColor: "rgba(255,255,255,0.1)", border: "none" } : {}}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 truncate">{palette.name}</span>
      )}

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-5 w-5 rounded-full cursor-pointer transition-opacity",
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            style={isActive && activeText ? { color: activeText } : {}}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(true);
            }}
          >
            <MoreHorizontal className="h-3 w-3 opacity-50" />
          </Button>
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
  } = usePaletteStore();
  
  const { colorSubView, setColorSubView } = useViewStore();

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

  const filteredPalettes = palettes.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-56 flex-col bg-sidebar-background relative z-10">
      <div className="flex items-center justify-between px-3 pt-5 pb-3">
        <svg
          width="88"
          height="26"
          viewBox="0 0 110 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="VarCar Color"
          role="button"
          className="text-foreground cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => setColorSubView("palette")}
        >
          <path d="M25.2533 18.9333L26.1066 20.24C25.2355 23.2978 23.431 24.8267 20.6933 24.8267C20.071 24.8267 19.5288 24.7111 19.0666 24.48C18.6221 24.2489 18.2844 23.9733 18.0533 23.6533C17.8221 23.3333 17.6355 22.9244 17.4933 22.4267C17.2977 21.68 17.191 20.6933 17.1733 19.4667C17.1733 18.24 17.0221 17.3956 16.7199 16.9333C16.4355 16.4711 15.8844 16.2133 15.0666 16.16L15.3599 13.8933C15.3955 13.8933 15.4221 13.8933 15.4399 13.8933C16.471 13.8933 17.3244 13.6 17.9999 13.0133C18.7288 12.3556 19.0933 11.5111 19.0933 10.48C19.0933 9.44888 18.6044 8.57777 17.6266 7.86666C16.6666 7.15555 15.4221 6.8 13.8933 6.8C11.9199 6.8 10.3999 7.28889 9.33325 8.26666C8.76436 8.8 8.47992 9.44 8.47992 10.1867C8.47992 11.1289 9.19992 11.6978 10.6399 11.8933L10.2666 13.8933C9.18214 13.84 8.22214 13.4756 7.38659 12.8C6.55103 12.1244 6.13325 11.2533 6.13325 10.1867C6.13325 8.32 6.91547 6.88888 8.47992 5.89333C10.0444 4.88 12.0266 4.37333 14.4266 4.37333C15.9733 4.37333 17.3333 4.56 18.5066 4.93333C20.5155 5.60888 21.8488 6.78222 22.5066 8.45333C22.7199 9.04 22.8266 9.52 22.8266 9.89333C22.8266 10.2489 22.8266 10.4889 22.8266 10.6133C22.7555 11.5911 22.391 12.5511 21.7333 13.4933C21.0933 14.4356 20.1244 15.0844 18.8266 15.44C19.6088 15.6 20.1421 15.9378 20.4266 16.4533C20.711 16.9689 20.8621 17.7511 20.8799 18.8C20.8977 20.5956 20.9777 21.6889 21.1199 22.08C21.2799 22.4533 21.5999 22.64 22.0799 22.64C23.3777 22.64 24.4355 21.4044 25.2533 18.9333Z" fill="currentColor" />
        </svg>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full cursor-pointer bg-white dark:bg-white/10">
                    <Plus className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Create Palette</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-3 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
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
            <div className="space-y-0.5">
              {filteredPalettes.map((palette) => (
                <PaletteItem
                  key={palette.id}
                  palette={palette}
                  isActive={activePaletteId === palette.id && colorSubView === "palette"}
                  isEditing={editingId === palette.id}
                  editingName={editingName}
                  onSelect={() => {
                    setActivePalette(palette.id);
                    setColorSubView("palette");
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

      <div className="p-3 space-y-2">
        <button
          onClick={() => setColorSubView("scale")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-fast cursor-pointer",
            colorSubView === "scale"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Scale</span>
        </button>
        
        <button
          onClick={() => setColorSubView("how-it-works")}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-fast cursor-pointer",
            colorSubView === "how-it-works"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>How it works</span>
        </button>
        
        <ThemeToggle />
      </div>
    </div>
  );
}
