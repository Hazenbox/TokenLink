# Testing the Variable Tree Visualizer

## What Was Implemented

Phase 1 Variable Tree Visualizer (Read-only) - A hierarchical tree view showing:
- **Collection** → Group → Variable → Modes

## How to Test

### 1. Build the Plugin

```bash
npm run build
```

### 2. Load in Figma

1. Open Figma Desktop App
2. Go to Menu → Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from this project
4. The plugin will appear in Plugins → Development → FigZig

### 3. Prepare Test Data

To see the tree visualizer in action, you need a Figma file with variables:

**Option A: Create Test Variables**
1. In Figma, go to the Local Variables panel (right sidebar)
2. Create a new collection (e.g., "Color Primitives")
3. Add some variables with paths:
   - `Colors/Primary` (COLOR type, set to #0000FF)
   - `Colors/Secondary` (COLOR type, set to #00FF00)
   - `Spacing/Small` (FLOAT type, set to 8)
   - `Spacing/Medium` (FLOAT type, set to 16)
4. Add modes to the collection (e.g., Light/Dark)
5. Set different values for each mode

**Option B: Use Existing Design System**
- Open a Figma file that already has variable collections

### 4. Run the Plugin

1. With your test file open, go to Plugins → Development → FigZig
2. The plugin window will open (600x600px)
3. You should see:
   - Header with summary stats (collection count, group count, variable count)
   - Tree view with expandable nodes

### 5. Test the Tree Functionality

**Expected Behavior:**

1. **Collections** (Level 1):
   - Each collection appears as a card with expand/collapse arrow
   - Shows collection type badge (PRIMITIVE, SEMANTIC, etc.)
   - Shows group and variable counts
   - Click to expand/collapse

2. **Groups** (Level 2):
   - Extracted from variable names (text before last `/`)
   - Example: `Colors/Primary` creates a "Colors" group
   - Shows variable count
   - Click to expand/collapse
   - Blue left border when expanded

3. **Variables** (Level 3):
   - Shows variable name (text after last `/`)
   - Shows variable type (COLOR, FLOAT, STRING, BOOLEAN)
   - Shows mode count
   - Click to expand/collapse if multiple modes

4. **Modes** (Level 4):
   - Shows mode name (e.g., "Light", "Dark")
   - Shows value with appropriate formatting:
     - **Colors**: Hex value with color preview square
     - **Numbers**: Plain number
     - **Strings**: Quoted string
     - **Booleans**: true/false
     - **Aliases**: "→ VariableName" in blue

## Expected Visual Structure

```
Collection Name [PRIMITIVE] (2 groups • 4 variables) ▼
  ├─ Colors (2 variables) ▶
  │   ├─ Primary [COLOR] (2 modes) ▶
  │   │   ├─ Light: [■] #0000FF
  │   │   └─ Dark: [■] #8888FF
  │   └─ Secondary [COLOR] (2 modes)
  └─ Spacing (2 variables)
      ├─ Small [FLOAT] (1 mode)
      └─ Medium [FLOAT] (1 mode)
```

## Edge Cases to Test

### No Variables
- Open a blank Figma file with no variables
- Should show: "No variable collections found" with package icon

### Flat Variables (No Groups)
- Create variables without `/` in names (e.g., "primary", "secondary")
- Should create a default group named after the collection

### Deep Nesting
- Create variables like `Colors/Brand/Primary/Dark`
- Should create group: "Colors/Brand/Primary"
- Variable name: "Dark"

### Aliases
- Create a semantic collection
- Set a variable to alias a primitive variable
- Should show: "→ PrimitiveVariableName" in blue

### Single Mode Variables
- Create a variable with only 1 mode
- Should show bullet (•) instead of expand arrow
- Should not be expandable

## Troubleshooting

### Plugin won't load
- Check console for errors: Plugins → Development → Open Console
- Verify build completed: `npm run build`
- Check `dist/code.js` exists

### Tree is empty
- Check if the file has local variables (not remote/library variables)
- Check browser console for errors
- Verify collections are not hidden

### Build errors
```bash
# Clean build
rm -rf dist/
npm run build
```

### TypeScript errors
```bash
# Check for type errors
npm run build:code
```

## What to Look For

✅ **Working correctly if:**
- Collections load and display
- Groups are extracted from variable names
- Variables show under correct groups
- Modes expand and show values
- Color previews appear for COLOR types
- Aliases show target variable names
- Expand/collapse works smoothly
- No console errors

❌ **Issues to report:**
- Collections don't load
- Groups incorrectly extracted
- Variables missing or duplicated
- Modes not showing values
- Color previews not appearing
- Crashes or freezes
- Console errors

## Next Steps

After verifying this works:
- Phase 2: Add manual alias actions
- Phase 3: Implement rule engine
- Add validation warnings
- Add graph visualization with React Flow

## Technical Notes

**Group Extraction Logic:**
- Uses `lastIndexOf('/')` to split variable names
- Everything before last `/` = group name
- Everything after last `/` = variable name
- No `/` = uses collection name as default group

**Data Flow:**
1. UI requests graph: `get-variable-graph`
2. Plugin fetches Figma collections: `getLocalVariableCollectionsAsync()`
3. Plugin fetches Figma variables: `getLocalVariablesAsync()`
4. Adapter converts to internal graph model
5. Graph serialized to JSON
6. UI receives: `variable-graph-loaded`
7. Tree component renders hierarchy

---

**Testing Date:** $(date +%Y-%m-%d)
**Plugin Version:** 0.1.0
**Phase:** Phase 1 - Variable Visualizer (Read-only)
