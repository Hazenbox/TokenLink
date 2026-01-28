# Figma Native Import Guide

## Overview

VarCar now supports importing Figma's native variable export format, in addition to the internal FigZig export format. This allows you to import variable collections that were exported directly from Figma using the "Export variables" feature.

## Supported Formats

VarCar automatically detects and handles two JSON formats:

### 1. Figma Native Format

This is the format Figma generates when you use **File → Export → Variables**.

**Structure:**
```json
{
  "schemaVersion": 1,
  "lastModified": "2026-01-24T03:21:13.596Z",
  "collections": [
    {
      "id": "VariableCollectionId:23:24054",
      "name": "Color Primitives",
      "modes": [
        { "name": "Light", "modeId": "23:0" },
        { "name": "Dark", "modeId": "23:1" }
      ],
      "variables": [
        {
          "id": "VariableID:23:24070",
          "name": "colors/primary/500",
          "resolvedType": "COLOR",
          "valuesByMode": {
            "23:0": { "r": 0.2, "g": 0.4, "b": 0.8, "a": 1 },
            "23:1": { "r": 0.3, "g": 0.5, "b": 0.9, "a": 1 }
          }
        }
      ]
    }
  ]
}
```

**Key Features:**
- Variables nested inside collections
- RGB colors in 0-1 range
- Modes defined per collection
- Variable aliases use `{ "type": "VARIABLE_ALIAS", "id": "..." }` format

### 2. FigZig Internal Format

This is VarCar's internal export format with enhanced metadata.

**Structure:**
```json
{
  "$schema": "https://figzig.dev/schemas/variable-graph/v1.0",
  "schemaVersion": "1.0.0",
  "metadata": {
    "exportDate": "2024-01-15T10:30:00.000Z",
    "exporter": "FigZig"
  },
  "graph": {
    "collections": [...],
    "groups": [...],
    "variables": [...],
    "aliases": [...]
  }
}
```

**Key Features:**
- Separate collections, groups, and variables arrays
- Enhanced metadata tracking
- Semantic versioning
- Explicit alias relationships

## How to Import

### Step 1: Export from Figma (for Figma Native format)

1. Open your Figma file
2. Go to **File → Export → Variables**
3. Save the JSON file to your computer

### Step 2: Import into VarCar

1. Open VarCar plugin in Figma
2. Click the **Import** button (or **Import JSON** button depending on view)
3. Select your JSON file
4. VarCar will automatically detect the format and import

### Step 3: Review Import Results

After import completes, you'll see a notification showing:
- Format detected (Figma native or FigZig)
- Number of collections created
- Number of variables created
- Number of aliases created
- Any warnings or errors

## Import Process

### Automatic Format Detection

VarCar analyzes the JSON structure to determine the format:

```typescript
// Figma native: has collections array with variables inside
{
  "collections": [
    { "variables": [...] }
  ]
}

// FigZig: has $schema and metadata.exporter fields
{
  "$schema": "...",
  "metadata": { "exporter": "FigZig" }
}
```

### Import Steps (Figma Native)

1. **Parse JSON** - Validate structure and required fields
2. **Convert Format** - Transform Figma native to internal graph model
3. **Create Collections** - Create or reuse existing collections
4. **Create Variables** - Create variables with proper grouping
5. **Create Aliases** - Resolve and create variable aliases
6. **Refresh Graph** - Update the UI with imported data

### Value Conversion

VarCar automatically converts values during import:

| Figma Format | Internal Format | Notes |
|--------------|-----------------|-------|
| `{ r: 0.5, g: 0.3, b: 0.8, a: 1 }` | `"#8066CC"` | RGB 0-1 → Hex string |
| `{ type: "VARIABLE_ALIAS", id: "..." }` | Alias reference | Preserved as alias |
| `42` (number) | `42` | Direct passthrough |
| `"text"` (string) | `"text"` | Direct passthrough |

### Group Extraction

Variables with `/` in their names are automatically split into groups:

```
Input:  "colors/primary/500"
Output: Group "colors/primary", Variable "500"

Input:  "spacing/large"
Output: Group "spacing", Variable "large"

Input:  "primary"
Output: Group "" (default), Variable "primary"
```

## Supported Variable Types

VarCar supports all Figma variable types:

- **COLOR** - RGB/RGBA colors
- **FLOAT** - Numeric values (spacing, sizing, etc.)
- **STRING** - Text values
- **BOOLEAN** - True/false flags

## Alias Resolution

Variable aliases are resolved intelligently:

1. **Mode Matching** - Aliases attempt to match mode names
   - Light mode → Light mode
   - Dark mode → Dark mode

2. **Fallback** - If no matching mode name, uses first mode

3. **Cross-Collection** - Aliases can reference variables in different collections

## Large File Performance

VarCar is optimized for large exports:

- **Tested with:** 270,000+ line JSON files (OneUI Foundations POC)
- **Progress Updates:** Real-time progress messages during import
- **Memory Efficient:** Streaming JSON parsing
- **Fast Processing:** Typically completes in < 30 seconds

### Progress Tracking

During import, VarCar displays progress:

```
Step 1/5: Detected Figma native format
Step 2/5: Converting to internal format...
Step 3/5: Creating collections and variables...
Step 4/5: Creating aliases...
Step 5/5: Refreshing graph...
```

## Error Handling

VarCar provides detailed error messages:

### Validation Errors

```
Invalid Figma native JSON: Collection 0 (Colors): Missing name
```

### Import Warnings

```
Variable "colors/primary" already exists, skipping
Collection "Primitives" already exists, using existing
```

### Format Detection Errors

```
Unrecognized JSON format. Expected FigZig export or Figma native export.
```

## Best Practices

### Before Import

1. **Backup** - Save your current Figma file before importing
2. **Review JSON** - Check the exported JSON is valid
3. **Check Size** - Large files (>100MB) may take longer

### During Import

1. **Don't Close** - Keep Figma open during import
2. **Wait** - Allow import to complete (check progress)
3. **Monitor Console** - Watch for warnings/errors (View → Developer → Console)

### After Import

1. **Verify** - Check that all collections imported correctly
2. **Test Aliases** - Confirm variable references work
3. **Review Warnings** - Address any import warnings

## Troubleshooting

### Import Fails Immediately

**Problem:** "Unrecognized JSON format"

**Solution:**
- Verify JSON is from Figma export or FigZig export
- Check JSON is valid (use JSON validator)
- Ensure file isn't corrupted

### Some Variables Missing

**Problem:** Not all variables imported

**Solution:**
- Check console for warnings
- Variables may already exist (check warnings)
- Verify JSON contains all expected variables

### Aliases Not Working

**Problem:** Aliases broken after import

**Solution:**
- Ensure target variables exist before aliases
- Check mode names match between source and target
- Review alias resolution warnings in console

### Slow Import Performance

**Problem:** Import takes very long

**Solution:**
- Normal for files >50MB
- Check progress messages in console
- Wait for completion (may take 30-60 seconds for very large files)

## Examples

### Example 1: Simple Color System

**Figma Export:**
```json
{
  "schemaVersion": 1,
  "collections": [{
    "name": "Colors",
    "modes": [{ "name": "Light", "modeId": "1:0" }],
    "variables": [{
      "name": "primary",
      "resolvedType": "COLOR",
      "valuesByMode": {
        "1:0": { "r": 0.2, "g": 0.4, "b": 0.8, "a": 1 }
      }
    }]
  }]
}
```

**Result:**
- 1 collection created: "Colors"
- 1 variable created: "primary" = #3366CC

### Example 2: Multi-Mode with Aliases

**Figma Export:**
```json
{
  "schemaVersion": 1,
  "collections": [
    {
      "name": "Primitives",
      "modes": [
        { "name": "Light", "modeId": "1:0" },
        { "name": "Dark", "modeId": "1:1" }
      ],
      "variables": [{
        "name": "blue/500",
        "resolvedType": "COLOR",
        "valuesByMode": {
          "1:0": { "r": 0.2, "g": 0.4, "b": 0.8, "a": 1 },
          "1:1": { "r": 0.3, "g": 0.5, "b": 0.9, "a": 1 }
        }
      }]
    },
    {
      "name": "Semantics",
      "modes": [
        { "name": "Light", "modeId": "2:0" },
        { "name": "Dark", "modeId": "2:1" }
      ],
      "variables": [{
        "name": "primary",
        "resolvedType": "COLOR",
        "valuesByMode": {
          "2:0": { "type": "VARIABLE_ALIAS", "id": "blue/500" },
          "2:1": { "type": "VARIABLE_ALIAS", "id": "blue/500" }
        }
      }]
    }
  ]
}
```

**Result:**
- 2 collections created
- 2 variables created
- 2 aliases created (Light→Light, Dark→Dark)

## Advanced Topics

### Custom Import Logic

If you need custom import behavior, you can modify:

**Parser:** `src/adapters/figmaNativeImporter.ts`
- Format detection
- Value conversion
- Group extraction

**Import Handler:** `src/code.ts`
- Collection creation
- Variable creation
- Alias resolution

### Extending Format Support

To support additional formats:

1. Add format detection in `detectImportFormat()`
2. Create parser function (e.g., `parseCustomJSON()`)
3. Create converter (e.g., `customToGraph()`)
4. Update import handler in `code.ts`

## API Reference

### Format Detection

```typescript
function detectImportFormat(jsonString: string): 'figzig' | 'figma-native' | 'unknown'
```

### Figma Native Parser

```typescript
function parseFigmaNativeJSON(jsonString: string): FigmaNativeParseResult

interface FigmaNativeParseResult {
  valid: boolean;
  data?: FigmaNativeExport;
  errors: string[];
  warnings: string[];
}
```

### Graph Conversion

```typescript
function figmaNativeToGraph(data: FigmaNativeExport): VariableGraph
```

### Statistics

```typescript
function getFigmaNativeStats(data: FigmaNativeExport): {
  collections: number;
  variables: number;
  aliases: number;
  modes: number;
  colorVariables: number;
  floatVariables: number;
  stringVariables: number;
  booleanVariables: number;
}
```

## Type Definitions

All types are defined in:
- `src/models/export.ts` - Export/import types
- `src/adapters/figmaNativeImporter.ts` - Conversion types

Key types:
- `FigmaNativeExport` - Complete export structure
- `FigmaNativeCollection` - Collection with variables
- `FigmaNativeVariable` - Variable with modes
- `FigmaNativeRGBA` - Color value
- `FigmaNativeAlias` - Alias reference

## Changelog

### v1.0.0 - Initial Release

**Features:**
- Automatic format detection
- Figma native import support
- FigZig import support
- RGB to hex conversion
- Alias resolution
- Progress tracking
- Large file optimization

## Related Documentation

- [Export/Import Guide](EXPORT_IMPORT_GUIDE.md) - General export/import
- [JSON Export Schema](JSON_EXPORT_SCHEMA.md) - FigZig format details
- [Quick Start](QUICK_START.md) - Getting started
- [Guide](GUIDE.md) - Complete user guide

## Support

If you encounter issues:

1. Check console for detailed errors (View → Developer → Console)
2. Verify JSON format matches expected structure
3. Try with a smaller test file first
4. Review troubleshooting section above

For bugs or feature requests, please file an issue with:
- Sample JSON file (if possible)
- Error messages from console
- Steps to reproduce
