# FigZag - Figma Variables Automation Tool

Automated orchestration tool for Figma Variables that enables rule-based aliasing, visual dependency management, and batch operations on design tokens.

## Features

- **Phase 0**: Canonical data schema for variables, collections, groups, and aliases
- **Phase 1**: Read-only variable visualizer with graph-based UI
- More phases coming soon (manual aliasing, rule engine, batch operations, JSON export)

## Development

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Watch mode for development
npm run watch
```

## Usage

1. Build the plugin using `npm run build`
2. In Figma, go to Plugins > Development > Import plugin from manifest
3. Select the `manifest.json` file from this directory
4. Run the plugin from Plugins > Development > FigZag

## Architecture

- **React + TypeScript**: UI framework
- **Redux Toolkit**: State management
- **React Flow**: Graph visualization
- **Figma Plugin API**: Variables API integration

## Project Structure

```
src/
├── models/         # Data schemas (Phase 0)
├── services/       # Data transformation
├── store/          # Redux store
├── ui/             # React components
├── types/          # TypeScript types
└── code.ts         # Plugin main entry
```

See [PRD_Figma_Variables_Automation.md](PRD_Figma_Variables_Automation.md) for detailed product requirements.
