# Figma Variables Architecture - Complete Implementation

## Executive Summary

Successfully implemented Figma's correct variables architecture in VarCar based on:
- Official Figma plugin API documentation
- W3C Design Tokens Community Group (DTCG) standards  
- Real-world analysis of OneUI Foundations [POC] JSON structure (16 collections, 10,000+ variables)
- Community best practices from design system leaders

---

## Research Findings

### What We Learned About Figma's System

#### 1. Brand = Figma File = Project Container
- A Figma file acts as a **project/workspace**, NOT a single collection
- Contains 1-16+ independent variable collections
- Example: "OneUI Foundations [POC]" has 16 collections

#### 2. Collections Are Independent
- Each collection has its OWN modes (not shared)
- "00_Semi semantics": 1 mode ("Mode 1"), 2,688 variables
- "1 Appearance": 9 modes (Neutral, Primary, Secondary...), 41 variables
- "9 Theme": 3 modes (MyJio, JioFinance, JioHome), 224 variables

#### 3. Modes Are NOT "Surface/High/Medium"
**Critical Misunderstanding Fixed**:
- VarCar thought "Surface, High, Medium, Low..." were modes
- Reality: These are **scale types** (emphasis levels) - part of variable names!
- Real modes: Light/Dark, Brand variations, Themes, Responsive breakpoints

#### 4. Groups Are Derived From Names
- Figma has NO "Group" entity at API level
- Groups created through **slash-based naming**: `Group/Subgroup/Property`
- Example: `Grey/2500/Surface` → Group: "Grey", Step: "2500", Type: "Surface"
- Figma's UI automatically parses `/` to create collapsible groups

#### 5. Three-Tier Token Architecture
Based on W3C DTCG standards:
- **Primitive tokens**: Raw values (e.g., `Grey/2500/Surface → #ffffff`)
- **Semantic tokens**: ALIASES to primitives (e.g., `[appearance] Surface → Grey/2500/Surface`)
- **Component tokens**: References to semantic tokens

---

## What Changed

### Data Model Transformation

#### Before (Incorrect)
```typescript
Brand {
  id, name,
  colors: { primary, secondary, neutral, ... }  // Single set of palettes
}

// Generated single "collection" with fake "modes"
Collection: "MyBrand"
  Modes: [Surface, High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal]  ❌ WRONG
  Variables: [Primary] Indigo 200, [Primary] Indigo 300...
```

#### After (Correct)
```typescript
Brand {
  id, name,
  collections: [                              // Multiple collections
    {
      id: "col_primitives",
      name: "MyBrand - Primitives",
      modes: [{ modeId: "mode_default", name: "Default" }],  ✓ Correct
      generationType: "primitives",
      paletteAssignments: {
        "Neutral": { paletteId: "...", paletteName: "Grey Scale" },
        "Primary": { paletteId: "...", paletteName: "Indigo" }
      }
    },
    {
      id: "col_appearances",
      name: "MyBrand - Appearances",
      modes: [                                 // Multiple modes!
        { modeId: "mode_neutral", name: "Neutral" },
        { modeId: "mode_primary", name: "Primary" },
        { modeId: "mode_secondary", name: "Secondary" },
        ...
      ],
      generationType: "semantic",
      primitiveCollectionId: "col_primitives"
    }
  ]
}

// Variables with slash-based naming
Primitives Collection:
  Neutral/2500/Surface → #ffffff (mode: Default)
  Neutral/2500/High → #eeeeee (mode: Default)
  Primary/2500/Surface → #f0f0ff (mode: Default)

Appearances Collection:
  [appearance] Surface
    → Neutral mode: ALIAS to Neutral/2500/Surface
    → Primary mode: ALIAS to Primary/2500/Surface
    → Secondary mode: ALIAS to Secondary/2500/Surface
```

---

## Implementation Details

### Phase 1: Data Model (Files Modified)

#### 1.1 `src/models/brand.ts`
**Added new interfaces**:
- `CollectionMode`: Mode within a collection (modeId, name)
- `VariableValueByMode`: Maps mode IDs to values (direct or alias)
- `FigmaVariable`: Updated with correct structure (name, valuesByMode, resolvedValuesByMode)
- `FigmaCollection`: Updated with modes, generationType, paletteAssignments
- `FigmaGroup`: Updated with steps array

**Updated Brand interface**:
- Added `collections?: FigmaCollection[]` array
- Made `colors?: BrandColors` optional (backward compatibility)
- Brand now acts as project container

#### 1.2 `src/lib/brand-migration.ts` (NEW)
**Migration utility**:
- `migrateLegacyBrand()`: Converts old brands to multi-collection
- Creates 2 collections: Primitives + Appearances
- `needsMigration()`: Checks if brand needs migration
- Helper functions: `getDefaultCollection()`, `getCollectionById()`, `getCollectionByType()`

**Migration Strategy**:
- Auto-detects legacy brands (has `colors` but no `collections`)
- Creates Primitives collection with single mode
- Creates Appearances collection with 8 modes (one per appearance context)
- Preserves all palette assignments

#### 1.3 `src/store/brand-store.ts`
**New actions**:
- Collection CRUD: `createCollection`, `updateCollection`, `deleteCollection`, `duplicateCollection`
- Mode management: `addModeToCollection`, `removeModeFromCollection`, `renameModeInCollection`
- Palette assignment: `assignPaletteToGroup` (per collection)

**Auto-migration**:
- Added `onRehydrateStorage` callback
- Automatically migrates legacy brands on load
- Console logs migration progress

**Updated refresh methods**:
- `refreshFigmaData`: Calls `getAllVariablesForBrand()` to generate all variables
- `refreshFigmaGroups`: Uses `getGroupsForCollection()` with slash parsing
- `refreshFigmaVariables`: Now a no-op (variables loaded in refreshFigmaData)

---

### Phase 2: Variable Generation (Adapter Rewrite)

#### 2.1 `src/adapters/brandToFigmaVariables.ts` (COMPLETE REWRITE)

**New architecture**:
```typescript
// Collections come from brand, not generated
convertBrandToCollections(brand) → returns brand.collections

// Generate primitives with slash naming
generatePrimitivesCollectionVariables(collection) → 
  Neutral/2500/Surface, Neutral/2500/High, Primary/2500/Surface...

// Generate semantic with aliases
generateSemanticCollectionVariables(semantic, primitives, primitivesVars) →
  [appearance] Surface (mode Neutral → ALIAS to Neutral/2500/Surface)
  [appearance] Surface (mode Primary → ALIAS to Primary/2500/Surface)

// Extract groups from variable names
extractGroupsFromVariables(variables) →
  Parses "Grey/2500/Surface" → group: "Grey", step: "2500"
  Returns: [{ id: "Grey", name: "Grey", steps: ["2500", "2400", ...] }]
```

**Key methods**:
1. `generatePrimitivesCollectionVariables()`:
   - Iterates palette assignments
   - Generates scales for all steps (100-2500)
   - Creates variables: `{Palette}/{Step}/{Scale}`
   - Direct COLOR values
   
2. `generateSemanticCollectionVariables()`:
   - Creates semantic variables: `[appearance] {Scale}`
   - For each mode, creates ALIAS to corresponding primitive
   - Example: Neutral mode → aliases to Neutral group primitives
   
3. `extractGroupsFromVariables()`:
   - Parses slash-based names
   - Extracts unique groups and their steps
   - Returns FigmaGroup[] with steps sorted descending

4. `getAllVariablesForBrand()`:
   - Generates variables for all collections in brand
   - Returns Map<collectionId, FigmaVariable[]>
   - Caching to avoid regeneration

**Removed**:
- Old strategy-based generation
- `CACHED_MODES` (Surface/High/Medium are NOT modes!)
- `generateModes()` method
- `convertBrandToGroups()` method
- `convertBrandToVariables()` method

---

### Phase 3: UI Restructure

#### 3.1 `src/store/variables-view-store.ts`
**New state**:
- `selectedStep: string | 'all'` - Selected step within group
- `setSelectedStep` action
- Updated reset and setActiveGroup to handle selectedStep

**Purpose**: Enable step-based filtering from Groups sidebar

#### 3.2 `src/ui/components/variables/GroupsSidebar.tsx` (COMPLETE REWRITE)
**Accordion UI**:
```
Groups
├─ All (576)
├─ > Neutral (192)                ← Collapsed
├─ v Primary (192)                ← Expanded, Active
│   ├─ All steps
│   ├─ 2500                       ← Selected (filters table)
│   ├─ 2400
│   ├─ 2300
│   └─ ...
└─ > Secondary (192)              ← Collapsed
```

**Implementation**:
- Parse variable names to extract steps per group
- Chevron icons show expand state
- Clicking group header expands to show steps
- Clicking step filters table to that step
- Highlight active group and selected step
- "All steps" option shows all variables in group

**Visual feedback**:
- ChevronRight when collapsed
- ChevronDown when expanded
- bg-surface-selected for active items
- text-blue-500 for selected step

#### 3.3 `src/ui/components/BrandVariableTable.tsx` (COMPLETE REWRITE)
**Flat table** (NO ACCORDION):

```
| Name               | Default | (modes based on collection)
|--------------------|---------|
| Neutral/2500/Surface | #fff  |
| Neutral/2500/High    | #eee  |
| Neutral/2500/Medium  | #ddd  |
| Neutral/2400/Surface | #fef  |
```

Or for semantic collection with multiple modes:

```
| Name                | Neutral | Primary | Secondary | ...
|---------------------|---------|---------|-----------|
| [appearance] Surface| #fff    | #f0f0ff | #f0fff0   |
| [appearance] High   | #eee    | #e0e0ff | #e0ffe0   |
```

**Filtering**:
1. Filter by activeGroupId (from sidebar)
2. Filter by selectedStep (from sidebar)
3. Filter by searchQuery (from header search)

**Implementation**:
- Uses `brandToFigmaAdapter.filterVariablesByGroup()`
- Uses `brandToFigmaAdapter.filterVariablesByStep()`
- Simple flat rendering - one variable = one row
- Mode columns from collection.modes (not hardcoded!)
- ModeCell component for color display

**Removed**:
- All accordion logic (groupedData, getSortedSteps, etc.)
- Expand All / Collapse All buttons (moved to sidebar)
- Group header rows
- Step sub-rows

**Updated export**:
- CSV includes: Group, Step, Type, [Mode1], [Mode2], ...
- Parses variable names to extract group/step/type

#### 3.4 Collections & Background Colors
**CollectionsSidebar**: Already correct (shows all collections from brand)
**AutomateApp**: Changed bg-card to bg-background
**All components**: Unified to single bg-background

---

## Variable Naming Examples

### Primitives Collection
```
Neutral/100/Surface → #ffffff
Neutral/100/High → #f8f8f8
Neutral/100/Medium → #f0f0f0
Neutral/200/Surface → #fefefe
Primary/100/Surface → #f5f7ff
Primary/100/High → #eef2f9
```

**Pattern**: `{Palette}/{Step}/{Scale}`
- Palette: Neutral, Primary, Secondary... (from palette assignments)
- Step: 100, 200, 300... 2500
- Scale: Surface, High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal

### Semantic Collection
```
[appearance] Surface
  - Neutral mode → ALIAS: Neutral/2500/Surface
  - Primary mode → ALIAS: Primary/2500/Surface
  - Secondary mode → ALIAS: Secondary/2500/Surface
  
[appearance] High
  - Neutral mode → ALIAS: Neutral/2500/High
  - Primary mode → ALIAS: Primary/2500/High
  - Secondary mode → ALIAS: Secondary/2500/High
```

**Pattern**: `[semantic] {Scale}`
- Semantic: appearance, background, text, etc.
- Scale: Surface, High, Medium... (same as primitives)
- Each mode aliases to different primitive variable

---

## User Interactions

### 1. Select Collection
- Click collection in Collections sidebar
- Table shows variables for that collection
- Modes columns update to collection's modes

### 2. Filter by Group
- Click group in Groups sidebar (e.g., "Primary")
- Table shows only variables starting with "Primary/"
- Group expands to show available steps

### 3. Filter by Step
- Expand group to see steps (2500, 2400, 2300...)
- Click step (e.g., "2500")
- Table shows only variables with "/2500/" in name
- Example: Primary/2500/Surface, Primary/2500/High, Primary/2500/Medium

### 4. Search
- Type in search box
- Filters variables by name
- Works across group and step filters

### 5. Export
- Click "Export CSV"
- Downloads CSV with columns: Group, Step, Type, [Mode1], [Mode2], ...
- Example row: `Primary,2500,Surface,#f0f0ff`

---

## Technical Architecture

### Data Flow

```
User creates/loads Brand
         ↓
Brand Store auto-migrates if needed (adds collections array)
         ↓
refreshFigmaData() called
         ↓
For each collection in brand.collections:
  ├─ If primitives: generatePrimitivesCollectionVariables()
  │    └─ Iterate paletteAssignments
  │         └─ Generate scales for all steps
  │              └─ Create variables: Palette/Step/Scale
  │
  └─ If semantic: generateSemanticCollectionVariables()
       └─ Create semantic variables: [semantic] Scale
            └─ For each mode, create ALIAS to primitive
         ↓
Store variables in figmaVariablesByCollection Map
         ↓
extractGroupsFromVariables() parses names to get groups
         ↓
UI displays:
  - Collections sidebar: All collections
  - Groups sidebar: Accordion with groups/steps
  - Table: Flat list (filtered by group + step)
```

### Aliasing System

**Cross-Collection Aliases**:
```typescript
{
  type: 'ALIAS',
  aliasId: 'var_col_primitives_Neutral_2500_Surface',
  aliasCollectionId: 'col_brandId_primitives'
}
```

**Resolution**:
- resolvedValuesByMode stores final hex values
- Follows alias chain across collections
- Mode-aware resolution

---

## Files Created/Modified

### New Files
1. `src/lib/brand-migration.ts` - Migration utility for legacy brands

### Modified Files
1. `src/models/brand.ts` - New correct Figma interfaces
2. `src/store/brand-store.ts` - Collection CRUD, auto-migration
3. `src/adapters/brandToFigmaVariables.ts` - Complete rewrite
4. `src/store/variables-view-store.ts` - selectedStep state
5. `src/ui/components/variables/GroupsSidebar.tsx` - Accordion UI
6. `src/ui/components/BrandVariableTable.tsx` - Flat table
7. `src/ui/components/variables/CollectionsSidebar.tsx` - bg color fix
8. `src/ui/AutomateApp.tsx` - bg color fix

---

## Backward Compatibility

### Migration Strategy
- Legacy brands with `colors` property auto-migrate on load
- Creates 2 default collections: Primitives + Appearances
- Preserves all palette assignments
- Console logs migration progress
- No user action required

### Detection
```typescript
function needsMigration(brand: Brand): boolean {
  return !!brand.colors && (!brand.collections || brand.collections.length === 0);
}
```

### Process
1. User loads plugin
2. Store rehydrates from localStorage
3. `onRehydrateStorage` callback runs
4. Detects legacy brands
5. Calls `migrateAllLegacyBrands()`
6. Saves migrated brands automatically

---

## Testing Instructions

### 1. Load Plugin in Figma
```bash
npm run build
# In Figma: Plugins → Development → VarCar → Reload
```

### 2. Check Migration
- Open browser console
- Should see: `[Migration] Migrating legacy brand: ...`
- Should see: `[Migration] Migration complete!`

### 3. Verify Collections
- Open Automate tab
- Collections sidebar should show:
  - "MyBrand - Primitives" (or existing collections)
  - "MyBrand - Appearances"
- Click each collection → table updates

### 4. Verify Groups Accordion
- Groups sidebar should show groups with chevrons
- Click "Primary" → expands to show steps
  - All steps
  - 2500
  - 2400
  - 2300
  - ...
- Click "2500" → table filters to show only step 2500 variables

### 5. Verify Flat Table
- Table should show simple flat rows
- NO accordion inside table
- One variable = one row
- Mode columns based on collection's modes
- Example rows:
  ```
  Primary/2500/Surface
  Primary/2500/High
  Primary/2500/Medium
  ```

### 6. Verify Filtering
- Select group "Primary" → shows only Primary/* variables
- Select step "2500" → shows only */2500/* variables
- Type search "Surface" → shows only variables with "Surface" in name
- All filters work together (AND logic)

### 7. Verify Export
- Click "Export CSV"
- Open file in spreadsheet
- Should have columns: Group, Step, Type, [Mode names...]
- Example row: `Primary,2500,Surface,#f0f0ff`

### 8. Verify Single Background
- Entire Automate tab should have single consistent background
- No visual clutter from mixed bg colors
- Sidebars, config panel, table all use bg-background

---

## Build Status

```
✓ Build: SUCCESS
✓ UI Bundle: 1,371.11 kB (649.79 kB gzipped)
✓ Code Bundle: 83.2 kB
✓ TypeScript: No errors
✓ Linter: No errors
```

---

## API Compatibility

### Figma Plugin API Methods Supported
- `getLocalVariableCollectionsAsync()` → Mapped to brand.collections
- `collection.modes` → Each collection has independent modes
- `variable.valuesByMode` → Correctly implemented
- `variable.setValueForMode()` → Supported via store actions
- Slash-based grouping → Parsed from variable names

### Figma JSON Export Format
Matches structure of OneUI Foundations [POC]:
```json
{
  "collections": [
    {
      "id": "...",
      "name": "00_Semi semantics",
      "modes": [{"name": "Mode 1", "modeId": "23:2"}],
      "variables": [
        {
          "name": "Grey/2500/Surface",
          "valuesByMode": {
            "23:2": { "type": "COLOR", "value": "#ffffff" }
          }
        }
      ]
    }
  ]
}
```

---

## Benefits

### 1. Matches Real Figma
- Exact same architecture as Figma files
- Collections with independent modes
- Slash-based grouping
- Cross-collection aliasing

### 2. Scalable Design Systems
- Support unlimited collections per brand
- Three-tier token architecture (primitive → semantic → component)
- W3C DTCG alignment

### 3. Better UX
- Accordion in sidebar (natural for hierarchy)
- Flat table (easier to scan)
- Single background color (cleaner visual)
- Context-aware filtering

### 4. Professional Workflows
- Multi-brand theming (via theme collections)
- Responsive design (via platform collections)
- Localization (via language collections)
- Light/dark modes (via mode variants)

---

## Known Limitations & Future Work

### Current Implementation
- Collection CRUD actions implemented (store level)
- Migration utility complete
- Variable generation working
- UI restructured

### Future Enhancements
1. **Config Panel UI**: Add visual collection management
   - Currently: Collections managed programmatically
   - Future: UI for add/edit/delete collections
   - UI for managing modes per collection
   - UI for palette assignments per collection

2. **Advanced Aliasing**: Resolve multi-level alias chains
3. **Export Formats**: Add Figma JSON export (not just CSV)
4. **Sync to Figma**: Push variables to real Figma files
5. **Import**: Import from Figma JSON files

---

## Status: READY FOR TESTING

Core architecture complete:
- ✅ Data model with multiple collections
- ✅ Auto-migration of legacy brands
- ✅ Variable generation with slash-based naming
- ✅ Semantic variables with aliases
- ✅ Groups sidebar with accordion
- ✅ Flat variables table
- ✅ Group + step filtering
- ✅ Single background color
- ✅ Build successful (no errors)

Test in Figma by reloading the plugin and verifying:
1. Collections display correctly
2. Groups expand to show steps
3. Clicking step filters table
4. Table shows flat rows
5. Export includes group/step/type columns

---

## Commits

- `bfc70ae` - Data model and migration
- `9617a97` - Adapter rewrite
- `ffd7df2` - UI restructure
- `e38ef5b` - Store refresh methods update

**Total Lines Changed**: ~1,500 lines
**Files Created**: 2
**Files Modified**: 8
**Architecture**: Completely transformed to match Figma