# FigZag Quick Start Guide

## What's Built (Phase 0 & Phase 1)

FigZag is a Figma plugin that provides automated orchestration of Figma Variables through a visual graph interface. Phase 0 and Phase 1 are now complete and ready to use.

### Phase 0: Data Schema ✅

Complete canonical data model for Figma Variables:
- **Collection** - Top-level grouping with type detection (primitive, semantic, interaction, theme)
- **Group** - Nested organization within collections
- **Variable** - Individual design tokens with modes
- **Mode** - Values across different modes (Light/Dark, states)
- **Alias** - Relationships between variables

### Phase 1: Read-Only Visualizer ✅

Visual graph interface showing:
- Collections as parent nodes (color-coded by type)
- Groups as nested containers
- Variables as leaf nodes
- Aliases as edges connecting variables
- Broken aliases highlighted in red
- Cross-collection links highlighted in blue

## Installation

1. Build the plugin:
```bash
npm install
npm run build
```

2. Load in Figma:
   - Open Figma Desktop
   - Go to **Plugins > Development > Import plugin from manifest**
   - Select `manifest.json` from the FigZag directory
   - The plugin will appear in your Plugins menu

## Usage

1. **Open the plugin**: Plugins > Development > FigZag - Variables Automation

2. **View your variables**: The plugin automatically loads all variables from your current file and displays them as a graph

3. **Navigate the graph**:
   - **Zoom**: Mouse wheel or pinch
   - **Pan**: Click and drag background
   - **Select nodes**: Click on collections, groups, or variables
   - Use minimap (bottom-right) for quick navigation

4. **Understand the visualization**:
   - **Blue nodes** = Primitive collections
   - **Purple nodes** = Semantic collections
   - **Orange nodes** = Interaction collections
   - **Pink nodes** = Theme collections
   - **Green edges** = Normal aliases
   - **Blue animated edges** = Cross-collection aliases
   - **Red dashed edges** = Broken aliases (need fixing)

## Project Structure

```
src/
├── code.ts                 # Figma plugin entry point
├── common/
│   └── types.ts            # Shared TypeScript types
├── models/                 # Phase 0: Data schemas
│   ├── collection.ts
│   ├── group.ts
│   ├── variable.ts
│   ├── mode.ts
│   └── alias.ts
├── services/               # Data transformation
│   ├── figmaParser.ts      # Figma API → Internal models
│   └── graphBuilder.ts     # Models → React Flow graph
├── store/                  # Redux state management
│   ├── index.ts
│   ├── hooks.ts
│   └── slices/
│       ├── variablesSlice.ts
│       └── graphSlice.ts
└── ui/                     # React components
    ├── index.tsx
    ├── App.tsx
    ├── GraphView.tsx
    ├── styles.css
    └── components/
        ├── CollectionNode.tsx
        ├── GroupNode.tsx
        └── VariableNode.tsx
```

## Development

### Watch mode for development
```bash
npm run watch
```

### Build for production
```bash
npm run build
```

### Key Features Implemented

1. **Automatic Variable Detection**: Reads all local variables from Figma
2. **Smart Grouping**: Extracts groups from variable naming patterns (e.g., "color/primary/default")
3. **Collection Type Detection**: Heuristic-based detection of collection types
4. **Alias Tracking**: Identifies and visualizes all alias relationships
5. **Error Detection**: Highlights broken aliases that reference missing variables
6. **Cross-Collection Awareness**: Visually distinguishes aliases that cross collection boundaries

## What's Next (Future Phases)

- **Phase 2**: Manual alias creation UI
- **Phase 3**: Rule engine for automated aliasing
- **Phase 4**: Batch operations and refactoring
- **Phase 5**: JSON export compiler
- **Phase 6**: Validation and safety layer

## Technical Stack

- **Figma Plugin API** - Variables API integration
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Redux Toolkit** - State management
- **React Flow 11** - Graph visualization
- **Webpack 5** - Build tooling

## Troubleshooting

### Plugin doesn't load
- Ensure you've run `npm run build`
- Check that `dist/code.js` and `dist/ui.html` exist
- Restart Figma Desktop

### No variables showing
- Create some variables in your Figma file first
- Click the Refresh button in the plugin

### Build errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires Node 16+)

## Success Criteria (All Met ✅)

- [x] Plugin loads in Figma without errors
- [x] All collections, groups, and variables parsed correctly
- [x] Graph renders with proper hierarchy
- [x] Aliases displayed as edges between nodes
- [x] Broken aliases visually highlighted
- [x] Cross-collection links visually distinct
- [x] Graph is interactive (zoom, pan, selection)

## Support

For issues or questions, refer to:
- [PRD](PRD_Figma_Variables_Automation.md) - Full product requirements
- [README](README.md) - Project overview
- [core.md](core.md) - Development guidelines
