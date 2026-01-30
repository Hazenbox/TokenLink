import * as React from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompactButton } from "../common/CompactButton";
import { IconButton } from "../common/IconButton";
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
import { Input } from "@/components/ui/input";
import { useBrandStore } from "@/store/brand-store";
import { cn } from "@colors/utils";
import { EmptyState } from "../EmptyState";

interface BrandItemProps {
  brand: { id: string; name: string; syncedAt?: number; updatedAt: number };
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

function BrandItem({
  brand,
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
}: BrandItemProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  
  const getSyncStatus = () => {
    if (!brand.syncedAt) return { label: "Not synced", color: "text-muted-foreground" };
    if (brand.updatedAt > brand.syncedAt) return { label: "Modified", color: "text-orange-400/70" };
    return { label: "Synced", color: "text-green-400/70" };
  };
  
  const syncStatus = getSyncStatus();

  return (
    <div
      className={cn(
        "group flex items-center rounded-lg px-3 h-7 text-xs transition-colors cursor-pointer select-none",
        isActive
          ? "bg-surface-elevated"
          : "hover:bg-surface-elevated/50"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        {isEditing ? (
          <Input
            value={editingName}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") onEditSave();
              if (e.key === "Escape") onEditCancel();
            }}
            className="h-5 px-1 py-0 text-xs rounded-lg flex-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="truncate text-xs font-medium">{brand.name}</span>
              <span className={cn("text-[9px] flex-shrink-0", syncStatus.color)}>
                {syncStatus.label}
              </span>
            </div>
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
              <PopoverContent className="w-32 p-1" align="end" side="right">
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
          </>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{brand.name}&quot;? This action cannot be undone.
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

export function BrandSidebar() {
  const {
    brands,
    activeBrandId,
    createBrand,
    deleteBrand,
    setActiveBrand,
    renameBrand,
    duplicateBrand,
  } = useBrandStore();

  const [newBrandName, setNewBrandName] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const handleCreate = () => {
    if (newBrandName.trim()) {
      createBrand(newBrandName.trim());
      setNewBrandName("");
      setDialogOpen(false);
    }
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renameBrand(id, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const sortedBrands = brands
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-full w-[220px] flex-col bg-background border-r border-border/40 relative z-10 flex-shrink-0">
      {/* Header */}
      <div className="h-9 px-3 py-1.5 border-b border-border/30 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-foreground-secondary">
          Brands
        </span>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <CompactTooltip content="Create Brand">
            <DialogTrigger asChild>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface-elevated/50 text-foreground-tertiary"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </DialogTrigger>
          </CompactTooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Brand</DialogTitle>
              <DialogDescription>
                Enter a name for your new brand.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g., MyJio"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!newBrandName.trim()}>
                Create Brand
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pt-2 pb-1">
          {brands.length === 0 ? (
            <EmptyState
              title="No brands yet"
              description="Click + to create one"
              className="py-3"
            />
          ) : (
            <div className="space-y-0">
              {sortedBrands.map((brand) => (
                <BrandItem
                  key={brand.id}
                  brand={brand}
                  isActive={activeBrandId === brand.id}
                  isEditing={editingId === brand.id}
                  editingName={editingName}
                  onSelect={() => setActiveBrand(brand.id)}
                  onStartEdit={() => startEditing(brand.id, brand.name)}
                  onEditChange={setEditingName}
                  onEditSave={() => handleRename(brand.id)}
                  onEditCancel={() => {
                    setEditingId(null);
                    setEditingName("");
                  }}
                  onDelete={() => deleteBrand(brand.id)}
                  onDuplicate={() => duplicateBrand(brand.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
