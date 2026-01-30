/**
 * Compact Palette Selector
 * Custom dropdown component with palette preview using Popover
 */

import React, { useState } from 'react';
import { usePaletteStore } from '@/store/palette-store';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@colors/utils';

interface CompactPaletteSelectorProps {
  label: string;
  value: string; // palette ID
  paletteName: string;
  onChange: (paletteId: string, paletteName: string) => void;
  required?: boolean;
  compact?: boolean; // For future 2-column grid styling
}

export function CompactPaletteSelector({
  label,
  value,
  paletteName,
  onChange,
  required = false,
  compact = false
}: CompactPaletteSelectorProps) {
  const palettes = usePaletteStore((state) => state.palettes);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Get selected palette for preview
  const selectedPalette = palettes.find((p) => p.id === value);

  // Filter palettes by search query
  const filteredPalettes = palettes.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (id: string, name: string) => {
    onChange(id, name);
    setOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredPalettes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredPalettes.length) {
          const palette = filteredPalettes[focusedIndex];
          handleSelect(palette.id, palette.name);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full max-w-full">
      <Label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-7 px-1.5 text-xs font-light border-border"
            onClick={() => setOpen(!open)}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {selectedPalette && (
                <div
                  className="h-3.5 w-3.5 rounded border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: selectedPalette.steps[1200] || '#ccc' }}
                />
              )}
              <span className={cn(
                "truncate",
                value ? "text-foreground" : "text-foreground-tertiary"
              )}>
                {value ? selectedPalette?.name || paletteName : "Select palette..."}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 ml-2 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[260px] p-0" 
          align="start"
          side="left"
          sideOffset={4}
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={8}
        >
          {/* Search input */}
          <div className="p-1.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-foreground-tertiary" />
              <Input
                placeholder="Search palettes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>

          {/* Palette list */}
          <ScrollArea className="h-[240px]">
            <div className="p-1">
              {filteredPalettes.length === 0 ? (
                <div className="py-6 text-center text-xs text-foreground-secondary">
                  No palettes found
                </div>
              ) : (
                filteredPalettes.map((palette, index) => (
                  <div
                    key={palette.id}
                    className={`
                      p-1.5 rounded-md cursor-pointer transition-colors
                      ${
                        value === palette.id
                          ? 'bg-surface-elevated'
                          : 'hover:bg-surface'
                      }
                      ${focusedIndex === index ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => handleSelect(palette.id, palette.name)}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3.5 w-3.5 rounded border border-border/50 flex-shrink-0"
                        style={{ backgroundColor: (palette?.steps as any)?.[1200] || '#ccc' }}
                        title="Step 1200"
                      />
                      <span className="text-xs font-normal text-foreground">
                        {palette.name}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {!selectedPalette && value && (
        <div className="text-[10px] text-red-500 mt-0.5">
          ⚠ Palette not found: {paletteName}
        </div>
      )}
    </div>
  );
}
