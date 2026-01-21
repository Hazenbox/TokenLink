# FigZag

**Automated Figma Variables Orchestration Tool**

## Overview

FigZag is a professional-grade Figma plugin for automating variable aliasing and managing design token graphs at scale. It treats design tokens as a graph with rule-based automation, eliminating manual repetition and enabling systematic control over thousands of variables.

## Current Status

**Phase 0: System Design & Schema Definition** ✓ Complete

### Phase 0 Deliverables

Phase 0 establishes the foundational type system and data models for the entire plugin.

#### 1. Core Data Models (`src/types/models.ts`)
- **Collection**: Variable collections (Primitive, Semantic, Interaction, Theme)
- **Group**: Nested groups within collections
- **Variable**: Design tokens with multiple modes
- **Mode**: Variants (Light/Dark, States, etc.) with values or aliases
- **Alias**: Relationships between variables with mode mapping
- **Color Types**: RGB and RGBA color definitions

#### 2. Token Graph System (`src/types/graph.ts`)
- **TokenGraph Class**: Root container with comprehensive graph operations
  - Collection, group, and variable lookup methods
  - Alias queries (dependencies, dependents, chains)
  - Validation (circular dependencies, broken aliases, orphans)
  - Path resolution and statistics
  - Graph filtering and manipulation

#### 3. Rule Engine Schema (`src/types/rules.ts`)
- **RuleCondition**: Pattern-based matching conditions
- **RuleAction**: Aliasing actions with mode mapping strategies
- **Rule**: Complete automation rules with priority and scope
- **RuleSet**: Collections of rules for batch operations
- **Execution Types**: Results, validation, evaluation, and conflict detection
- **Templates**: Reusable rule patterns

#### 4. Export System (`src/types/export.ts`)
- **ExportMetadata**: Complete export provenance and versioning
- **ExportStatistics**: Comprehensive graph analytics
- **TokenGraphExport**: Full graph serialization format
- **Import/Export**: Bidirectional data exchange
- **Diff System**: Version comparison and change tracking
- **Validation**: Issue detection and reporting

#### 5. Utility Functions (`src/types/utils.ts`)
- **Type Guards**: Runtime type checking for all models
- **Validation**: Schema validation functions
- **Conversion**: Color format conversion (RGB, hex, CSS)
- **Comparison**: Deep equality checking
- **Naming**: Sanitization and ID generation
- **Query Helpers**: Filtering and grouping utilities
- **Pattern Matching**: String and regex matching

#### 6. JSON Schemas (`src/schemas/`)
- `token-graph.schema.json`: Graph structure validation
- `rule-definition.schema.json`: Rule format validation
- `export.schema.json`: Export format validation

## Project Structure

```
FigZag/
├── src/
│   ├── types/
│   │   ├── models.ts        # Core data models
│   │   ├── graph.ts         # TokenGraph class
│   │   ├── rules.ts         # Rule engine types
│   │   ├── export.ts        # Export/import types
│   │   ├── utils.ts         # Utilities and helpers
│   │   └── index.ts         # Central type exports
│   └── schemas/
│       ├── token-graph.schema.json
│       ├── rule-definition.schema.json
│       └── export.schema.json
├── code.ts                  # Plugin main code
├── ui.html                  # Plugin UI
├── manifest.json            # Figma plugin manifest
├── package.json
└── tsconfig.json
```

## Development

### Prerequisites
- Node.js 14+
- npm or yarn
- TypeScript 5.3+

### Setup

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes
npm run watch

# Run linter
npm run lint
```

### Testing Phase 0

1. Load the plugin in Figma
2. Click "Test Schema Definitions" button
3. Verify that all schemas compile and validate correctly

## Technology Stack

- **TypeScript**: Strict typing with ES2017+ features
- **Figma Plugin API**: Native Figma integration
- **JSON Schema**: Runtime validation

## Design Principles

1. **Type Safety**: Strict TypeScript throughout
2. **Immutability**: Readonly properties where appropriate
3. **Graph Thinking**: Variables as nodes, aliases as edges
4. **Extensibility**: Future-proof schema design
5. **Validation**: Multiple layers of type and runtime validation
6. **Documentation**: Self-documenting code with JSDoc

## Next Steps: Phase 1

Phase 1 will build a read-only Variable Visualizer:
- Read all Figma Variables using the Variables API
- Render collections, groups, and variables as a graph
- Display aliases as edges
- Highlight broken aliases and cross-collection links

## Key Features (Planned)

- ✓ **Phase 0**: Canonical data models and schemas
- 🚧 **Phase 1**: Read-only variable visualization
- 📋 **Phase 2**: Manual aliasing actions
- 📋 **Phase 3**: Rule-based automation engine
- 📋 **Phase 4**: Batch operations at scale
- 📋 **Phase 5**: JSON export and versioning
- 📋 **Phase 6**: Validation and safety layer
- 📋 **Phase 7**: AI-assisted optimization (future)

## Architecture Decisions

### Why a Graph Model?
Design tokens naturally form a dependency graph. Treating them as such enables:
- Circular dependency detection
- Impact analysis (what depends on what)
- Path traversal and resolution
- Visual representation
- Systematic validation

### Why TypeScript Classes + Interfaces?
- **Interfaces** for data structures (serializable)
- **Classes** for behavior (TokenGraph with methods)
- Best of both worlds: type safety + functionality

### Why JSON Schema?
- Runtime validation for imported data
- External tool integration
- Contract for API consumers
- Documentation generation

## Contributing

This project is built incrementally following the PRD phases. Each phase builds on the previous foundation.

## License

Copyright © 2024 Upen

## Version

v1.0.0-phase0
