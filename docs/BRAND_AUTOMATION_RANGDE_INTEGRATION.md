# Brand Automation + RangDe Integration

## Overview

The Brand Automation system (Automate tab) integrates directly with the RangDe color palette system to provide a seamless workflow:

1. Users create and configure color palettes in **RangDe tab** (Colors)
2. Users create brands in **Automate tab** and select from RangDe palettes
3. System generates full variable set using RangDe's 8 generated scales
4. Variables are synced to Figma as modes within existing collections

## Integration Flow

```
RangDe Tab (Colors)          →    Automate Tab (Brands)       →    Figma
─────────────────────────────────────────────────────────────────────────
1. Create palettes                1. Create brand                 1. Add mode
2. Generate scales (8x)           2. Select palettes              2. Map variables
3. Preview stacking               3. Configure brand              3. Sync all
                                  4. Preview & sync
```

## Data Flow

### 1. Palette Creation (RangDe)

```typescript
// User creates palette in RangDe tab
const palette: Palette = {
  id: "palette_1234",
  name: "Brand Blue",
  steps: {
    200: "#0b0034",   // Darkest
    300: "#170054",
    ...
    2500: "#ffffff"   // Lightest
  },
  primaryStep: 600
};

// RangDe automatically generates 8 scales
const generatedScales = {
  Surface: { hex: "#...", contrast: ... },
  High: { hex: "#...", contrast: ... },
  Medium: { hex: "#...", contrast: ... },
  Low: { hex: "#...", contrast: ... },
  Heavy: { hex: "#...", contrast: ... },
  Bold: { hex: "#...", contrast: ... },
  BoldA11Y: { hex: "#...", contrast: ... },
  Minimal: { hex: "#...", contrast: ... }
};
```

### 2. Brand Configuration (Automate)

```typescript
// User selects palettes in Automate tab
const brand: Brand = {
  id: "brand_myjio",
  name: "MyJio",
  colors: {
    primary: {
      paletteId: "palette_1234",    // Brand Blue
      paletteName: "Brand Blue"
    },
    secondary: {
      paletteId: "palette_5678",    // Accent Orange
      paletteName: "Accent Orange"
    },
    sparkle: {
      paletteId: "palette_9012",    // Forest Green
      paletteName: "Forest Green"
    },
    neutral: {
      paletteId: "palette_3456",    // Neutral Grey
      paletteName: "Neutral Grey"
    },
    semantic: {
      positive: { paletteId: "...", paletteName: "Success Green" },
      negative: { paletteId: "...", paletteName: "Error Red" },
      warning: { paletteId: "...", paletteName: "Warning Amber" },
      informative: { paletteId: "...", paletteName: "Info Blue" }
    }
  }
};
```

### 3. Variable Generation

```typescript
// BrandGenerator loads scales from palette-store
export class BrandGenerator {
  generate(brand: Brand): GeneratedBrand {
    const paletteStore = usePaletteStore.getState();
    
    // For each appearance context
    for (const appearance of ['Neutral', 'Primary', 'Secondary', ...]) {
      const paletteRef = brand.colors[appearance.toLowerCase()];
      const palette = paletteStore.palettes.find(p => p.id === paletteRef.paletteId);
      
      // Load 8 generated scales
      const scales = generateAllScales(palette.steps, palette.primaryStep);
      
      // Create variables for each scale
      for (const scale of ['Surface', 'High', 'Medium', ...]) {
        createVariable({
          name: `${brand.name}/${appearance}/[appearance] ${scale}`,
          value: scales[scale].hex,
          mode: brand.name
        });
      }
    }
  }
}
```

### 4. Figma Sync

```typescript
// ModeMapper adds brand as mode to existing collections
await figma.variables.getLocalVariableCollections().then(collections => {
  const themeCollection = collections.find(c => c.name === '9 Theme');
  
  // Add MyJio as new mode
  themeCollection.addMode('MyJio');
  
  // For each variable in collection
  for (const variable of themeCollection.variables) {
    // Set value for MyJio mode using generated scales
    variable.setValueForMode('MyJio', generatedValue);
  }
});
```

## UI Components

### PaletteDropdown Component

```typescript
interface PaletteDropdownProps {
  value: string;  // palette ID
  onChange: (paletteId: string) => void;
  label: string;  // "Primary Palette"
  role: 'primary' | 'secondary' | 'sparkle' | 'neutral';
}

export function PaletteDropdown({ value, onChange, label, role }: PaletteDropdownProps) {
  const { palettes } = usePaletteStore();
  
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        {palettes.map(palette => (
          <SelectItem value={palette.id}>
            <div>
              <span>{palette.name}</span>
              {/* Preview key steps */}
              <ColorPreview colors={[
                palette.steps[200],
                palette.steps[600],
                palette.steps[1200],
                palette.steps[2500]
              ]} />
            </div>
          </SelectItem>
        ))}
      </Select>
      
      {/* Show all 8 generated scales */}
      <GeneratedScalesPreview paletteId={value} role={role} />
    </div>
  );
}
```

### GeneratedScalesPreview Component

```typescript
export function GeneratedScalesPreview({ paletteId, role }: Props) {
  const palette = usePaletteStore(state => 
    state.palettes.find(p => p.id === paletteId)
  );
  
  if (!palette) return null;
  
  const scales = generateAllScales(palette.steps, palette.primaryStep);
  
  return (
    <div className="scales-preview">
      <div className="scale-item">
        <span>Surface</span>
        <ColorSwatch color={scales.Surface.hex} />
        <span>CR: {scales.Surface.contrast}</span>
      </div>
      <div className="scale-item">
        <span>High</span>
        <ColorSwatch color={scales.High.hex} />
        <span>CR: {scales.High.contrast}</span>
      </div>
      {/* ... repeat for all 8 scales */}
    </div>
  );
}
```

## Validation

### Palette Availability Check

```typescript
// Before generating brand, ensure all palettes exist
function validateBrand(brand: Brand): ValidationResult {
  const paletteStore = usePaletteStore.getState();
  const errors: string[] = [];
  
  for (const [role, paletteRef] of Object.entries(brand.colors)) {
    if (!paletteStore.palettes.find(p => p.id === paletteRef.paletteId)) {
      errors.push(`Palette "${paletteRef.paletteName}" for ${role} not found in RangDe`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Scale Generation Check

```typescript
// Ensure scales can be generated
function validateScaleGeneration(paletteId: string): boolean {
  const palette = usePaletteStore.getState().palettes.find(p => p.id === paletteId);
  if (!palette) return false;
  
  try {
    const scales = generateAllScales(palette.steps, palette.primaryStep);
    return Object.keys(scales).length === 8;
  } catch (error) {
    console.error(`Failed to generate scales for ${paletteId}:`, error);
    return false;
  }
}
```

## Benefits of Integration

1. **Single Source of Truth**: RangDe palettes are the source, brands reference them
2. **Automatic Updates**: If user updates palette in RangDe, brands can be regenerated
3. **Consistency**: All brands use the same scale generation logic (8 scales)
4. **Flexibility**: Users can create unlimited palettes in RangDe for different brands
5. **Visual Workflow**: See palette → select for brand → sync to Figma

## User Workflow

### Step 1: Create Palettes in RangDe

```
1. Go to Colors tab (RangDe)
2. Create "Brand Blue" palette
3. Adjust 24 color steps
4. Preview 8 generated scales
5. Repeat for all needed palettes (primary, secondary, etc.)
```

### Step 2: Create Brand in Automate

```
1. Go to Automate tab
2. Click "Create Brand"
3. Enter name: "MyJio"
4. Select palettes from dropdowns:
   - Primary: Brand Blue
   - Secondary: Accent Orange
   - Sparkle: Forest Green
   - Neutral: Neutral Grey
5. Preview generated variables
6. Click "Sync Now"
```

### Step 3: Figma Sync

```
1. System adds "MyJio" as mode to collections
2. Maps 224 theme variables using selected palettes
3. Uses RangDe's 8 scales for each palette
4. Status updates to ✓ Synced
```

## Technical Implementation

### Store Connection

```typescript
// brand-store.ts
import { usePaletteStore } from '@/store/palette-store';

export const useBrandStore = create<BrandStoreState>((set, get) => ({
  // ... brand state
  
  // Get available palettes from RangDe
  getAvailablePalettes: () => {
    const paletteStore = usePaletteStore.getState();
    return paletteStore.palettes.map(p => ({
      id: p.id,
      name: p.name,
      previewColors: [
        p.steps[200],
        p.steps[600],
        p.steps[1200],
        p.steps[2500]
      ],
      scaleCount: 8  // Always 8 scales
    }));
  },
  
  // Validate palette availability
  validatePaletteReferences: (brand: Brand) => {
    const palettes = get().getAvailablePalettes();
    const paletteIds = new Set(palettes.map(p => p.id));
    
    // Check all palette references
    const allRefs = [
      brand.colors.primary,
      brand.colors.secondary,
      brand.colors.sparkle,
      brand.colors.neutral,
      ...Object.values(brand.colors.semantic)
    ];
    
    return allRefs.every(ref => paletteIds.has(ref.paletteId));
  }
}));
```

### Scale Loading Utility

```typescript
// utils/paletteIntegration.ts
import { usePaletteStore } from '@/store/palette-store';
import { generateAllScales } from '@/lib/scale-generator';

export function loadPaletteScales(paletteId: string): StepScales {
  const paletteStore = usePaletteStore.getState();
  const palette = paletteStore.palettes.find(p => p.id === paletteId);
  
  if (!palette) {
    throw new Error(`Palette ${paletteId} not found`);
  }
  
  return generateAllScales(palette.steps, palette.primaryStep);
}

export function getAllPaletteScales(brand: Brand): Record<string, StepScales> {
  return {
    primary: loadPaletteScales(brand.colors.primary.paletteId),
    secondary: loadPaletteScales(brand.colors.secondary.paletteId),
    sparkle: loadPaletteScales(brand.colors.sparkle.paletteId),
    neutral: loadPaletteScales(brand.colors.neutral.paletteId),
    positive: loadPaletteScales(brand.colors.semantic.positive.paletteId),
    negative: loadPaletteScales(brand.colors.semantic.negative.paletteId),
    warning: loadPaletteScales(brand.colors.semantic.warning.paletteId),
    informative: loadPaletteScales(brand.colors.semantic.informative.paletteId)
  };
}
```

## Error Handling

```typescript
// Handle missing palettes gracefully
try {
  const scales = loadPaletteScales(paletteId);
} catch (error) {
  showError({
    title: 'Palette Not Found',
    message: `The palette "${paletteName}" was not found in RangDe. Please create it first in the Colors tab.`,
    action: {
      label: 'Go to Colors',
      onClick: () => navigateToTab('colors')
    }
  });
}
```

## Future Enhancements

1. **Auto-sync**: Watch palette changes and offer to update brands
2. **Palette Templates**: Save palette combinations as brand templates
3. **Batch Import**: Import multiple palettes from external sources
4. **Color Harmony**: Suggest complementary palettes for brands
5. **A11Y Validation**: Warn if selected palettes don't meet contrast requirements
