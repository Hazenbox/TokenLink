# Export & Import Guide

## Overview

FigZig provides complete export and import functionality for variable graphs, enabling round-trip workflows, backup/restore, collaboration, and multi-file synchronization.

## Quick Start

### Export

1. Click **Export** button in the header toolbar
2. JSON file downloads automatically: `figzig-export-2026-01-22-130836.json`
3. File includes all collections, groups, variables, modes, and aliases

### Import

1. Click **Import** button in the header toolbar
2. Select a `.json` file exported from FigZig
3. Review import results (created/skipped entities)
4. Variables appear in Figma immediately

## Export Details

### What Gets Exported

- ✅ **All collections** (Primitives, Semantic, etc.)
- ✅ **All groups** with full path structure
- ✅ **All variables** with complete mode data
- ✅ **All modes** (Light, Dark, states, etc.)
- ✅ **All aliases** with mode mappings
- ✅ **Metadata** (timestamp, version, exporter info)

### Export Format

```json
{
  "$schema": "https://figzig.dev/schemas/variable-graph/v1.0",
  "schemaVersion": "1.0.0",
  "metadata": {
    "exportDate": "2026-01-22T07:38:36.000Z",
    "exporter": "FigZig",
    "exporterVersion": "1.0.0"
  },
  "graph": {
    "collections": [...],
    "groups": [...],
    "variables": [...],
    "aliases": [...]
  }
}
```

### File Naming

Exports are automatically named with timestamp:
- Format: `figzig-export-YYYY-MM-DD-HHMMSS.json`
- Example: `figzig-export-2026-01-22-130836.json`

## Import Details

### How Import Works

1. **Validation** - Checks JSON structure and schema version
2. **Version Check** - Ensures compatibility with current schema
3. **Collection Matching** - Reuses existing collections by name
4. **Variable Creation** - Creates missing variables with full paths
5. **Alias Recreation** - Restores all alias relationships
6. **Statistics** - Reports created/skipped entities

### Import Behavior

#### Collections

- **Existing collections** are reused by name
- **New collections** are created if they don't exist
- **No duplicates** - name matching prevents multiple collections with same name
- **Warning shown** when reusing existing collection

#### Variables

- **Full path matching** - Uses `group/variable` format
- **Skip existing** - Doesn't overwrite existing variables
- **Create new** - Only creates variables that don't exist
- **Type validation** - Ensures COLOR/FLOAT/STRING/BOOLEAN types match

#### Aliases

- **Recreate all** - All aliases from export are recreated
- **Mode mapping** - Preserves Light→Light, Dark→Dark relationships
- **Validation** - Skips if source or target variable missing
- **Safe updates** - Won't create circular dependencies

### Import Results

After import, you see detailed statistics:

```
Import successful!
Created 2 collection(s), 15 variable(s), 8 alias(es)

Statistics:
- Collections created: 2
- Variables created: 15
- Aliases created: 8
- Skipped: 3 (already exist)

Warnings: 0
Errors: 0
```

## Common Workflows

### 1. Backup & Restore

**Backup:**
```
1. Open Figma file
2. Open FigZig plugin
3. Click Export
4. Save JSON to safe location
```

**Restore:**
```
1. Open Figma file (same or different)
2. Open FigZig plugin
3. Click Import
4. Select saved JSON file
5. Review results
```

### 2. Sync Across Files

**Scenario:** Maintain consistent tokens across multiple Figma files

```
File A (Source)           File B (Target)
     │                          │
     ├── Export JSON ──────────>│
     │                          ├── Import JSON
     │                          └── Tokens synced ✅
```

**Steps:**
1. Export from source file
2. Switch to target file
3. Import JSON
4. Existing tokens skipped, new ones created

### 3. Version Control Workflow

**Team collaboration via Git:**

```
Designer A                  Git Repo              Designer B
    │                          │                      │
    ├── Export tokens ────────>│                      │
    │   Commit & push          │                      │
    │                          ├── Pull changes ─────>│
    │                          │                      ├── Import tokens
    │                          │                      └── Tokens updated ✅
```

### 4. Migration Between Projects

**Move tokens from old to new project:**

```
1. Old Project:
   - Export all variables → tokens-v1.json

2. New Project:
   - Import tokens-v1.json
   - All collections, variables, aliases recreated
   - Ready to use immediately
```

### 5. Testing & Development

**Safe experimentation:**

```
1. Export current state → backup.json
2. Make experimental changes
3. If works: Keep changes
4. If breaks: Import backup.json to restore
```

## Schema Version Compatibility

### Current Version: 1.0.0

- **Major version** (1.x.x): Breaking changes require migration
- **Minor version** (x.1.x): New optional fields, backward compatible
- **Patch version** (x.x.1): Bug fixes, fully compatible

### Import Version Checks

| Import Version | Current Version | Result |
|----------------|-----------------|--------|
| 1.0.0 | 1.0.0 | ✅ Import successful |
| 1.1.0 | 1.0.0 | ⚠️ Newer minor, may have extra fields (ignored) |
| 0.9.0 | 1.0.0 | ✅ Older minor, migrated automatically |
| 2.0.0 | 1.0.0 | ❌ Incompatible - update FigZig |

## Error Handling

### Common Import Errors

#### 1. Invalid JSON

**Error:** `Invalid JSON: Unexpected token`

**Solution:**
- Ensure file is valid JSON
- Check file wasn't corrupted during download
- Re-export from source

#### 2. Schema Validation Failed

**Error:** `Missing required field: graph.collections`

**Solution:**
- File may be from different tool
- Ensure using FigZig export format
- Check schema version compatibility

#### 3. Incompatible Version

**Error:** `Import requires schema version 2.0.0, but this tool only supports 1.0.0`

**Solution:**
- Update FigZig plugin to latest version
- Or export from source using compatible version

### Import Warnings

Warnings don't stop import, but should be reviewed:

- **"Collection already exists, using existing"**
  - Not an error - reusing is expected behavior
  - Variables will be added to existing collection

- **"Variable already exists, skipping"**
  - Prevents overwriting existing work
  - Remove existing variable first if you want to replace it

- **"Alias skipped: target variable not found"**
  - Target variable doesn't exist yet
  - May need to import in correct order

## Best Practices

### 1. Regular Exports

Create exports regularly as backups:
- Before major changes
- After completing features
- Weekly for active projects

### 2. Naming Convention

Organize exports with clear names:
```
project-tokens-v1.0.0.json
project-tokens-2026-01-22.json
project-tokens-before-rebrand.json
```

### 3. Git Integration

Commit exports to version control:
```bash
git add tokens/figzig-export-*.json
git commit -m "Update design tokens: Added dark mode variants"
git push
```

### 4. Documentation

Include export with design system docs:
```
design-system/
├── README.md
├── tokens/
│   ├── current.json       (latest export)
│   └── archive/
│       ├── v1.0.0.json
│       └── v1.1.0.json
└── docs/
```

### 5. Testing Imports

Always test imports in a copy first:
1. Duplicate Figma file
2. Test import in duplicate
3. Verify results
4. Then import to production file

## Troubleshooting

### Import Creates Duplicates

**Problem:** Variables appear twice after import

**Cause:** Name mismatch - import uses full path `group/variable`

**Solution:**
- Check variable naming convention
- Ensure groups match between files
- Remove duplicates manually if needed

### Aliases Not Created

**Problem:** Import succeeds but aliases missing

**Cause:** Target variables don't exist or were skipped

**Solution:**
1. Check import statistics
2. Review warnings about missing variables
3. Import may need to run twice (first creates variables, second creates aliases)

### Mode Mappings Incorrect

**Problem:** Dark mode aliases to Light mode values

**Cause:** Mode order differs between files

**Solution:**
- Ensure consistent mode creation order
- May need to manually adjust aliases
- Consider standardizing mode setup across files

## Advanced Usage

### Programmatic Access

The export JSON can be parsed by other tools:

```typescript
import { parseImportJSON } from 'figzig';

const result = parseImportJSON(jsonString);
if (result.valid && result.data) {
  // Access collections
  result.data.graph.collections.forEach(col => {
    console.log(`Collection: ${col.name}`);
  });
  
  // Access variables
  result.data.graph.variables.forEach(variable => {
    console.log(`Variable: ${variable.name}`);
  });
}
```

### Custom Scripts

Build custom workflows:

```javascript
// Example: Extract all color values
const colors = export.graph.variables
  .filter(v => v.variableType === 'COLOR')
  .map(v => ({
    name: v.name,
    value: v.modes[0].value.value
  }));

// Generate CSS
const css = colors.map(c => 
  `--${c.name}: ${c.value};`
).join('\n');
```

### CI/CD Integration

Automate token publishing:

```yaml
# .github/workflows/tokens.yml
name: Publish Tokens

on:
  push:
    paths:
      - 'tokens/current.json'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate CSS
        run: node scripts/tokens-to-css.js
      - name: Deploy
        run: npm run deploy
```

## FAQ

**Q: Can I import exports from other tools?**

A: Only if they match FigZig's schema format. Exports from other tools need conversion first.

**Q: What happens if I import the same file twice?**

A: Second import skips existing variables. No duplicates created.

**Q: Can I edit the JSON before importing?**

A: Yes! JSON is human-readable and editable. Just maintain valid schema structure.

**Q: Do imports preserve variable IDs?**

A: No. Figma generates new IDs. Aliases are recreated using names, not IDs.

**Q: Can I import partial exports?**

A: Yes. Remove unwanted collections/variables from JSON before importing.

**Q: Does import work across Figma organizations?**

A: Yes. Exports are portable across any Figma account/organization.

**Q: Are imports reversible?**

A: Partially. You can't "undo" an import, but you can import a previous export to restore state.

## Support

For issues or questions:
- Check schema documentation: `docs/JSON_EXPORT_SCHEMA.md`
- Review import logs in browser console
- File issue with export JSON for debugging

## Related Documentation

- [JSON Export Schema](./JSON_EXPORT_SCHEMA.md) - Complete schema reference
- [Internal Graph Model](./INTERNAL_GRAPH_MODEL.md) - Data structure details
- [Variable Aliasing Feature](./VARIABLE_ALIASING_FEATURE.md) - Alias system
