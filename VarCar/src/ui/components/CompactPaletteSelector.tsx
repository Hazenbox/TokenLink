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
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-8 px-2 text-xs font-normal"
            onClick={() => setOpen(!open)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedPalette && (
                <div
                  className="h-4 w-4 rounded border border-border/50 flex-shrink-0"
                  style={{ backgroundColor: selectedPalette.steps[600] || '#ccc' }}
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
          className="w-[280px] p-0" 
          align="start"
          side="left"
          sideOffset={4}
          alignOffset={0}
          avoidCollisions={true}
          collisionPadding={8}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
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
                filteredPalettes.map((palette) => (
                  <div
                    key={palette.id}
                    className={`
                      p-2 rounded-md cursor-pointer transition-colors
                      ${
                        value === palette.id
                          ? 'bg-surface-elevated'
                          : 'hover:bg-surface'
                      }
                    `}
                    onClick={() => handleSelect(palette.id, palette.name)}
                  >
                    <div className="text-xs font-medium text-foreground mb-1">
                      {palette.name}
                    </div>
                    {/* Preview palette steps */}
                    <div className="flex gap-0.5">
                      {[200, 600, 1200, 2500].map((step) => {
                        const color = (palette?.steps as any)?.[step] || '#ccc';
                        return (
                          <div
                            key={step}
                            className="h-4 flex-1 rounded border border-border/50"
                            style={{ backgroundColor: color }}
                            title={`Step ${step}: ${color}`}
                          />
                        );
                      })}
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
