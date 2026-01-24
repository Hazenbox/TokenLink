/**
 * Palette Selector Component
 * Dropdown to select palettes from RangDe with preview
 */

import React from 'react';
import { usePaletteStore } from '@/store/palette-store';
import { Label } from '@/components/ui/label';

interface PaletteSelectorProps {
  label: string;
  value: string; // palette ID
  paletteName: string;
  onChange: (paletteId: string, paletteName: string) => void;
  required?: boolean;
}

export function PaletteSelector({
  label,
  value,
  paletteName,
  onChange,
  required = false
}: PaletteSelectorProps) {
  const palettes = usePaletteStore((state) => state.palettes);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedPalette = palettes.find((p) => p.id === selectedId);
    if (selectedPalette) {
      onChange(selectedId, selectedPalette.name);
    }
  };

  // Get selected palette for preview
  const selectedPalette = palettes.find((p) => p.id === value);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <select
        value={value}
        onChange={handleChange}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        <option value="">Select palette...</option>
        {palettes.map((palette) => (
          <option key={palette.id} value={palette.id}>
            {palette.name}
          </option>
        ))}
      </select>

      {/* Preview selected palette */}
      {selectedPalette && (
        <div className="flex gap-1 mt-1">
          {[200, 600, 1200, 2500].map((step) => {
            const color = (selectedPalette.steps as any)[step] || '#ccc';
            return (
              <div
                key={step}
                className="h-6 flex-1 rounded border border-gray-200"
                style={{ backgroundColor: color }}
                title={`Step ${step}: ${color}`}
              />
            );
          })}
        </div>
      )}

      {!selectedPalette && value && (
        <div className="text-xs text-red-500 mt-1">
          ⚠ Palette not found: {paletteName}
        </div>
      )}
    </div>
  );
}
