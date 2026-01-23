# JSON Export Schema Documentation

## Overview

FigZig exports the complete variable graph to a structured JSON format with versioning and metadata. This document describes the schema structure and explains why it is future-proof.

## Schema Version

**Current Version:** `1.0.0`

## Schema Structure

```json
{
  "$schema": "https://figzig.dev/schemas/variable-graph/v1.0",
  "schemaVersion": "1.0.0",
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "exporter": "FigZig",
    "exporterVersion": "1.0.0",
    "figmaFileId": "optional-file-id",
    "figmaFileKey": "optional-file-key"
  },
  "graph": {
    "collections": [...],
    "groups": [...],
    "variables": [...],
    "aliases": [...]
  }
}
```

## Field Descriptions

### Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `$schema` | string | Yes | URI reference to the JSON Schema definition |
| `schemaVersion` | string | Yes | Semantic version of the schema (e.g., "1.0.0") |
| `metadata` | object | Yes | Export metadata and context |
| `graph` | object | Yes | The variable graph data |

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exportDate` | string | Yes | ISO 8601 timestamp of export creation |
| `exporter` | string | Yes | Name of the tool that created the export |
| `exporterVersion` | string | Yes | Version of the exporter tool |
| `figmaFileId` | string | No | Figma file ID (if available) |
| `figmaFileKey` | string | No | Figma file key (if available) |

### Graph Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `collections` | array | Yes | Array of collection objects |
| `groups` | array | Yes | Array of group objects |
| `variables` | array | Yes | Array of variable objects |
| `aliases` | array | Yes | Array of alias relationship objects |

## Entity Schemas

### Collection

Represents a top-level container for organizing design tokens.

```typescript
{
  id: string;                    // Unique identifier
  name: string;                  // Display name
  type: 'primitive' | 'semantic' | 'interaction' | 'theme' | 'brand';
}
```

**Example:**
```json
{
  "id": "VariableCollectionId:1:23",
  "name": "Color Primitives",
  "type": "primitive"
}
```

### Group

Represents a nested organizational unit within a collection.

```typescript
{
  id: string;           // Unique identifier
  name: string;         // Display name (e.g., "Colors/Brand")
  collectionId: string; // Parent collection ID
}
```

**Example:**
```json
{
  "id": "VariableGroupId:2:45",
  "name": "Colors/Brand",
  "collectionId": "VariableCollectionId:1:23"
}
```

### Variable

Represents a design token with one or more mode values.

```typescript
{
  id: string;                           // Unique identifier
  name: string;                         // Display name
  groupId: string;                      // Parent group ID
  variableType?: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  modes: Mode[];                        // Array of mode objects
}
```

**Example:**
```json
{
  "id": "VariableID:3:67",
  "name": "color-blue-500",
  "groupId": "VariableGroupId:2:45",
  "variableType": "COLOR",
  "modes": [...]
}
```

### Mode

Represents a variant of a variable (e.g., Light/Dark, Default/Hover).

```typescript
{
  id: string;              // Mode identifier
  name: string;            // Mode name (e.g., "Light", "Dark")
  value: ModeValueOrAlias; // Either a direct value or an alias
}
```

**Example with Direct Value:**
```json
{
  "id": "1:0",
  "name": "Light",
  "value": {
    "type": "value",
    "value": "#3B82F6"
  }
}
```

**Example with Alias:**
```json
{
  "id": "1:1",
  "name": "Dark",
  "value": {
    "type": "alias",
    "variableId": "VariableID:3:67",
    "modeId": "1:0"
  }
}
```

### Mode Value Types

#### Direct Value

```typescript
{
  type: 'value';
  value: string | number | boolean; // Actual value
}
```

#### Alias Reference

```typescript
{
  type: 'alias';
  variableId: string; // Target variable ID
  modeId: string;     // Target mode ID
}
```

### Alias

Represents a relationship between two variables with mode mappings.

```typescript
{
  fromVariableId: string;           // Source variable ID
  toVariableId: string;             // Target variable ID
  modeMap: Record<string, string>;  // sourceModeId -> targetModeId
}
```

**Example:**
```json
{
  "fromVariableId": "VariableID:4:89",
  "toVariableId": "VariableID:3:67",
  "modeMap": {
    "1:0": "1:0",  // Light mode -> Light mode
    "1:1": "1:1"   // Dark mode -> Dark mode
  }
}
```

## Complete Example

```json
{
  "$schema": "https://figzig.dev/schemas/variable-graph/v1.0",
  "schemaVersion": "1.0.0",
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "exporter": "FigZig",
    "exporterVersion": "1.0.0"
  },
  "graph": {
    "collections": [
      {
        "id": "col-1",
        "name": "Primitives",
        "type": "primitive"
      },
      {
        "id": "col-2",
        "name": "Semantic",
        "type": "semantic"
      }
    ],
    "groups": [
      {
        "id": "grp-1",
        "name": "Colors",
        "collectionId": "col-1"
      },
      {
        "id": "grp-2",
        "name": "Theme",
        "collectionId": "col-2"
      }
    ],
    "variables": [
      {
        "id": "var-1",
        "name": "blue-500",
        "groupId": "grp-1",
        "variableType": "COLOR",
        "modes": [
          {
            "id": "mode-1",
            "name": "Default",
            "value": {
              "type": "value",
              "value": "#3B82F6"
            }
          }
        ]
      },
      {
        "id": "var-2",
        "name": "primary",
        "groupId": "grp-2",
        "variableType": "COLOR",
        "modes": [
          {
            "id": "mode-1",
            "name": "Default",
            "value": {
              "type": "alias",
              "variableId": "var-1",
              "modeId": "mode-1"
            }
          }
        ]
      }
    ],
    "aliases": [
      {
        "fromVariableId": "var-2",
        "toVariableId": "var-1",
        "modeMap": {
          "mode-1": "mode-1"
        }
      }
    ]
  }
}
```

## Why This Schema is Future-Proof

### 1. **Semantic Versioning**

The `schemaVersion` field uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes that require migration
- **MINOR**: New optional fields, backward compatible
- **PATCH**: Bug fixes, clarifications

**Example Evolution:**
- `1.0.0` → `1.1.0`: Add optional `description` field to variables
- `1.1.0` → `2.0.0`: Change structure, require migration

### 2. **Schema Reference ($schema)**

The `$schema` field points to a schema definition URL. This enables:

- **Validation**: Tools can validate exports against the schema
- **Documentation**: Automatic schema documentation generation
- **IDE Support**: Auto-completion and validation in editors

Future: We can host actual JSON Schema files at these URLs.

### 3. **Extensible Metadata**

The `metadata` section is separate from the core graph data:

- **Add new metadata fields** without touching graph structure
- **Track export context** (file info, user, environment)
- **Version-specific metadata** for different schema versions

**Example Future Additions:**
```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "exporter": "FigZig",
    "exporterVersion": "2.0.0",
    "exportedBy": "user@example.com",        // NEW
    "exportEnvironment": "production",       // NEW
    "figmaVersion": "124.5.0"               // NEW
  }
}
```

### 4. **Optional Fields**

All non-essential fields are optional:

- **Backward compatible**: Old parsers ignore new fields
- **Forward compatible**: New parsers handle missing optional fields
- **Graceful degradation**: Missing data doesn't break parsing

### 5. **Isolated Graph Data**

Core graph data is in a separate `graph` section:

- **Clear separation** between metadata and data
- **Stable structure** for graph algorithms
- **Easy to extract** just the graph portion

### 6. **Type Safety**

The schema uses discriminated unions for mode values:

```typescript
type: 'value' | 'alias'
```

This enables:
- **Type-safe parsing** in TypeScript/JavaScript
- **Clear distinction** between value types
- **Easy extension** with new types (e.g., `type: 'computed'`)

### 7. **Flat Structure**

Entities are stored in flat arrays with ID references:

- **Efficient lookups** using ID maps
- **No circular references** in JSON
- **Database-friendly** structure
- **Easy to query** and transform

### 8. **Self-Contained**

Exports include all referenced entities:

- **Complete graph** in single file
- **No external dependencies**
- **Portable** across systems
- **Version control friendly**

## Migration Strategy

When schema versions change, follow this strategy:

### Minor Version Changes (1.0.0 → 1.1.0)

**No migration needed** - just add optional fields.

**Example:**
```typescript
// v1.0.0 export works with v1.1.0 parser
const oldExport = { schemaVersion: "1.0.0", ... };
const parsed = parseExport(oldExport); // ✅ Works
```

### Major Version Changes (1.x.x → 2.0.0)

**Migration required** - provide migration function.

**Example:**
```typescript
function migrateV1ToV2(v1Export: V1Export): V2Export {
  return {
    ...v1Export,
    schemaVersion: "2.0.0",
    // Transform structure as needed
  };
}
```

## Import Functionality

FigZig supports importing JSON exports back into Figma, enabling round-trip workflows.

### How Import Works

1. **Click Import Button** in the header toolbar
2. **Select JSON file** from your computer
3. **Automatic validation** of schema and compatibility
4. **Smart conflict handling** - existing entities are reused
5. **Progress feedback** with detailed statistics

### Import Behavior

#### Collections
- **Existing collections** are reused by name
- **New collections** are created if they don't exist
- Warning shown if collection already exists

#### Variables
- **Full path matching** using group/variable name
- **Skip existing** variables to avoid duplicates
- **Create new** variables that don't exist
- **Type validation** ensures correct variable types

#### Aliases
- **Recreate all aliases** from the export
- **Mode mapping** preserves Light/Dark/etc. relationships
- **Validation** ensures target variables exist

### Import Statistics

After import, you'll see:
- Collections created
- Variables created
- Aliases created
- Items skipped (already exist)
- Warnings and errors

### Example Import Workflow

```bash
# 1. Export from Figma A
Click "Export" → Save figzig-export-2024-01-15.json

# 2. Import to Figma B
Click "Import" → Select figzig-export-2024-01-15.json

# 3. Review results
- 2 collections created
- 15 variables created
- 8 aliases created
- 0 skipped
```

## Use Cases

### 1. Version Control & Collaboration

Commit exports to Git for:
- **Design token history**
- **Change tracking**
- **Code review** of token changes
- **Import changes** from teammates

### 2. Multi-File Sync

Synchronize tokens across Figma files:
- **Export from source** file
- **Import to target** files
- **Maintain consistency** across projects

### 3. Backup & Restore

Use exports as backups:
- **Export regularly** to save state
- **Import to restore** if needed
- **Version history** in Git

### 4. CI/CD Pipelines

Use exports in automation:
- **Generate CSS/SCSS** from tokens
- **Validate token structure**
- **Deploy to CDN**

### 5. Cross-Tool Integration

Import into other tools:
- **Style Dictionary**
- **Tokens Studio**
- **Custom token systems**

### 6. Documentation

Generate documentation from exports:
- **Token catalogs**
- **Design system docs**
- **API documentation**

### 7. Analysis

Analyze design systems:
- **Token usage statistics**
- **Dependency graphs**
- **Coverage reports**

## Best Practices

### 1. **Always Include Metadata**

Even if optional, include as much metadata as possible:
```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "exporter": "FigZig",
    "exporterVersion": "1.0.0",
    "figmaFileId": "abc123"  // Include when available
  }
}
```

### 2. **Version Exports**

Include exports in version control with meaningful names:
```
tokens-v1.0.0.json
tokens-2024-01-15.json
```

### 3. **Validate Before Use**

Always validate imported exports:
```typescript
const validation = validateExport(importedData);
if (!validation.valid) {
  console.error('Invalid export:', validation.errors);
}
```

### 4. **Handle Missing Optional Fields**

Write defensive code for optional fields:
```typescript
const fileId = export.metadata.figmaFileId ?? 'unknown';
```

### 5. **Document Custom Extensions**

If adding custom fields, document them:
```json
{
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "customField": "value",  // Document: What this is for
    "_comment": "Custom fields prefixed with underscore"
  }
}
```

## Support

For questions or issues with the export schema:

- **Documentation**: See this file
- **Examples**: Check `test-export.ts`
- **Type Definitions**: See `src/models/export.ts`

## Changelog

### Version 1.0.0 (Initial Release)

- Initial schema definition
- Support for collections, groups, variables, modes, and aliases
- Metadata section with export context
- Versioned schema with $schema reference
