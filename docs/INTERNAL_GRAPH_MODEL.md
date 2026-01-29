# Internal Graph Model Documentation

## Overview

The internal graph model is a pure TypeScript data structure that represents Figma variables, collections, groups, and modes **without any dependency on Figma APIs**. This is the canonical representation used throughout FigZig for all graph operations, rule evaluation, validation, and exports.

## Architecture

### File Structure

```
src/models/
├── types.ts    # Core type definitions
├── graph.ts    # Graph container and utilities
└── index.ts    # Public API exports
```

## Core Types

### Collection

Represents a top-level container for organizing design tokens.

```typescript
interface Collection {
  id: string;
  name: string;
  type: 'primitive' | 'semantic' | 'interaction' | 'theme' | 'brand';
}
```

**Example:** "Color Primitives", "Semantic Tokens", "Brand Colors"

### Group

Represents a nested organizational unit within a collection.

```typescript
interface Group {
  id: string;
  name: string;
  collectionId: string;
}
```

**Example:** "Colors/Brand", "Spacing/Margins", "States/Hover"

### Variable

Represents a design token that can have different values in different modes.

```typescript
interface Variable {
  id: string;
  name: string;
  groupId: string;
  variableType?: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  modes: Mode[];
}
```

### Mode

Represents a variant of a variable (e.g., Light/Dark, Default/Hover).

```typescript
interface Mode {
  id: string;
  name: string;
  value: ModeValueOrAlias;
}
```

### Mode Values

A mode value can be either a direct value or an alias:

```typescript
// Direct value
interface ModeValue {
  type: 'value';
  value: string | number | boolean;
}

// Alias to another variable
interface ModeAlias {
  type: 'alias';
  variableId: string;
  modeId: string;
}

type ModeValueOrAlias = ModeValue | ModeAlias;
```

### Alias

Represents a relationship between two variables with mode mappings.

```typescript
interface Alias {
  fromVariableId: string;
  toVariableId: string;
  modeMap: Record<string, string>; // sourceModeId -> targetModeId
}
```

## Graph Container

The `VariableGraph` is the main container that holds all entities:

```typescript
interface VariableGraph {
  collections: Map<string, Collection>;
  groups: Map<string, Group>;
  variables: Map<string, Variable>;
  aliases: Alias[];
}
```

### Why Maps?

Uses `Map<string, T>` for **O(1) lookup performance**, critical when working with thousands of tokens in large design systems.

## API Functions

### Factory Functions

```typescript
createGraph(): VariableGraph
```

Creates an empty graph ready for population.

### Builder Methods

```typescript
addCollection(graph: VariableGraph, collection: Collection): VariableGraph
addGroup(graph: VariableGraph, group: Group): VariableGraph
addVariable(graph: VariableGraph, variable: Variable): VariableGraph
```

Add entities to the graph. `addVariable` automatically extracts and stores alias relationships.

### Query Helpers

```typescript
getVariableByPath(graph, collectionName, groupName, variableName): Variable | null
getAliasesForVariable(graph, variableId): Alias[]
getVariablesInGroup(graph, groupId): Variable[]
getGroupsInCollection(graph, collectionId): Group[]
getCollectionForGroup(graph, groupId): Collection | null
getGroupForVariable(graph, variableId): Group | null
```

### Validation

```typescript
validateGraph(graph: VariableGraph): ValidationResult
detectCircularDependencies(graph: VariableGraph): string[][]
```

Validates structural integrity and detects circular alias dependencies.

### Type Guards

```typescript
isModeValue(value: ModeValueOrAlias): value is ModeValue
isModeAlias(value: ModeValueOrAlias): value is ModeAlias
```

TypeScript type guards for safe value discrimination.

## Why This Separation Matters

### 1. Architectural Independence

**Testability:**
- Unit test graph operations without Figma running
- Test rules engine with mock graphs
- Test validation logic in isolation
- No need for Figma API mocks

**Example:**
```typescript
// Can test this without Figma
const graph = createGraph();
addCollection(graph, { id: '1', name: 'Colors', type: 'primitive' });
addGroup(graph, { id: '2', name: 'Brand', collectionId: '1' });
const result = validateGraph(graph);
expect(result.valid).toBe(true);
```

### 2. API Stability

**Abstraction Layer:**
- Figma's API may change, but our model stays stable
- Business logic doesn't break when Figma updates
- Can adapt to API changes in one place (adapter layer)

**Future Compatibility:**
- Could support other design tools (Sketch, Penpot, etc.)
- Could import from other token formats (Style Dictionary, Design Tokens Community Group)
- Could export to any format without rewriting core logic

### 3. Graph Operations

**Performance:**
- No Figma API overhead for graph traversal
- Batch operations can be planned before execution
- Efficient in-memory algorithms

**Algorithms:**
- Cycle detection doesn't need Figma API calls
- Path finding works on pure data structures
- Dependency resolution is instant

**Example:**
```typescript
// This runs entirely in memory, no API calls
const cycles = detectCircularDependencies(graph);
if (cycles.length > 0) {
  console.log('Found circular dependencies:', cycles);
}
```

### 4. Rules Engine Foundation

The rules engine (Phase 3) will operate on this model:

```typescript
// Rule engine can work with pure data
function applyRule(graph: VariableGraph, rule: Rule): Alias[] {
  // Find all variables matching the rule
  // Create aliases based on rule logic
  // Return the new aliases
  // All without touching Figma APIs
}
```

### 5. JSON Export & Serialization

**Export Capability:**
- Can serialize the entire graph to JSON
- Perfect for versioning and auditing
- Enables external pipelines and tooling

**Example Export:**
```json
{
  "collections": [...],
  "groups": [...],
  "variables": [...],
  "aliases": [...]
}
```

### 6. Performance at Scale

**Large Design Systems:**
- 1000+ variables load instantly into memory
- Graph operations complete in milliseconds
- No API rate limits to worry about

**Batch Operations:**
- Plan all changes in memory first
- Validate everything before touching Figma
- Execute Figma API calls only when ready

## Usage Example

```typescript
import {
  createGraph,
  addCollection,
  addGroup,
  addVariable,
  validateGraph,
  getVariableByPath,
} from './models';

// Create a graph
const graph = createGraph();

// Add a collection
addCollection(graph, {
  id: 'col-1',
  name: 'Primitives',
  type: 'primitive',
});

// Add a group
addGroup(graph, {
  id: 'grp-1',
  name: 'Colors',
  collectionId: 'col-1',
});

// Add a variable with modes
addVariable(graph, {
  id: 'var-1',
  name: 'primary',
  groupId: 'grp-1',
  variableType: 'COLOR',
  modes: [
    {
      id: 'mode-light',
      name: 'Light',
      value: { type: 'value', value: '#0000FF' },
    },
    {
      id: 'mode-dark',
      name: 'Dark',
      value: { type: 'value', value: '#8888FF' },
    },
  ],
});

// Validate the graph
const validation = validateGraph(graph);
console.log('Valid:', validation.valid);

// Query by path
const variable = getVariableByPath(graph, 'Primitives', 'Colors', 'primary');
console.log('Found:', variable?.name);
```

## Next Steps

### Phase 1: Adapter Layer
Create functions to convert Figma API data to this internal model:
```typescript
function figmaToGraph(figmaCollections): VariableGraph
```

### Phase 3: Rules Engine
Build rules that operate on this model:
```typescript
function applyRules(graph: VariableGraph, rules: Rule[]): VariableGraph
```

### Phase 5: JSON Export
Serialize and deserialize the graph:
```typescript
function exportGraph(graph: VariableGraph): string
function importGraph(json: string): VariableGraph
```

### Phase 6: Advanced Validation
Add more validation rules:
- Complex circular dependency detection
- Missing mode warnings
- Naming convention checks
- Duplicate detection

## Design Decisions

### 1. Map vs Array
**Decision:** Use `Map<string, T>` for collections, groups, and variables.
**Reason:** O(1) lookups critical for 1000+ token systems.

### 2. Discriminated Union for Values
**Decision:** Use `type: 'value' | 'alias'` discriminator.
**Reason:** Type-safe, clear intent, enables type guards.

### 3. Separate Alias Array
**Decision:** Store aliases separately from variables.
**Reason:** Enables efficient graph traversal and cycle detection.

### 4. Optional Variable Type
**Decision:** Make `variableType` optional.
**Reason:** Flexibility for future types, not all contexts need it.

### 5. Immutable-Style API
**Decision:** Builder functions return the graph (for chaining).
**Reason:** Enables functional-style composition while mutating for performance.

## Performance Characteristics

- **Creation:** O(1)
- **Add entity:** O(1)
- **Get by ID:** O(1)
- **Get by path:** O(n) where n = entities in category
- **Validation:** O(n + m) where n = entities, m = aliases
- **Cycle detection:** O(V + E) where V = variables, E = aliases

## Conclusion

This pure TypeScript model is the foundation of FigZig's architecture. By separating the data model from Figma APIs, we gain testability, flexibility, performance, and the ability to build sophisticated features like rules engines and validation without being constrained by API limitations.
