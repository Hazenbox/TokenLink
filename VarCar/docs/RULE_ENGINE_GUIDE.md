# Rule Engine Guide

## Overview

The Rule Engine is a powerful automation tool that automatically creates aliases between Figma variables based on JSON-defined rules. It eliminates manual aliasing work and ensures consistent token relationships across your design system.

## What is a Rule?

A rule defines a pattern for automatic variable aliasing:
- **When** (Condition): Matches variables based on collection and/or group
- **Then** (Action): Specifies the target to alias matched variables to

## Rule Structure

```json
{
  "id": "unique-rule-id",
  "name": "Human-readable rule name",
  "description": "Optional description of what the rule does",
  "when": {
    "collection": "collection-name",
    "group": "group-name"
  },
  "then": {
    "aliasTo": "target-collection/target-group"
  },
  "enabled": true
}
```

### Required Fields

- `id`: Unique identifier for the rule
- `name`: Descriptive name shown in UI
- `when`: Condition object with at least one of:
  - `collection`: Collection name (exact match)
  - `group`: Group name (exact match)
- `then`: Action object with:
  - `aliasTo`: Target path in format `collection/group` or `collection/group/variable`

### Optional Fields

- `description`: Explains what the rule does
- `enabled`: Boolean to enable/disable the rule (default: true)

## Rule Matching Logic

### Source Matching
Rules match variables based on the `when` condition:

1. **Collection Only**: Matches all variables in the specified collection
   ```json
   "when": { "collection": "interaction" }
   ```

2. **Group Only**: Matches all variables in any collection with the specified group
   ```json
   "when": { "group": "hover" }
   ```

3. **Both Collection and Group**: Matches variables in specific collection AND group
   ```json
   "when": {
     "collection": "interaction",
     "group": "hover"
   }
   ```

### Target Resolution
The `aliasTo` path specifies where to alias matched variables:

1. **Collection/Group**: Aliases to all variables in the target group
   ```json
   "then": { "aliasTo": "primitive/default" }
   ```
   - If multiple target variables exist, matches by name
   - Falls back to first available variable

2. **Collection/Group/Variable**: Aliases to a specific variable
   ```json
   "then": { "aliasTo": "primitive/colors/blue-500" }
   ```
   - All matched variables alias to this single target

### Mode Mapping
The engine automatically maps modes between source and target variables:

1. **Same Mode Name**: Matches modes with identical names (e.g., Light → Light)
2. **Fallback**: Uses first available mode if no name match found

## Using the Rule Engine

### 1. Access the Rules View
Click the **"Rules Engine"** button in the header to switch to rules mode.

### 2. Create Rules

**Option A: Using the Form**
1. Click **"+ Add Rule"**
2. Fill in the form:
   - Rule name and description
   - Collection and/or group to match
   - Target alias path
3. Click **"Save Rule"**

**Option B: Using JSON**
1. Click **"+ Add Rule"**
2. Switch to **"JSON"** tab
3. Paste or edit JSON directly
4. Click **"Save Rule"**

**Option C: Load from File**
1. Create a JSON file with rules (see `rules/example-rules.json`)
2. Copy the JSON content
3. Use the form or JSON editor to add rules

### 3. Manage Rules

- **Enable/Disable**: Click the checkbox next to a rule
- **Edit**: Click the pencil icon (✏️)
- **Delete**: Click the trash icon (🗑️)

### 4. Evaluate Rules

**Dry Run (Preview)**
1. Click **"🔍 Dry Run (Preview)"**
2. Review the step-by-step evaluation
3. See what aliases would be created
4. Check for warnings or errors

**Apply Rules**
1. Click **"⚡ Apply Rules"**
2. Confirm the action
3. The engine creates all aliases in Figma
4. Review the results

## Step-by-Step Evaluation

The engine provides detailed logging for each rule:

### Evaluation Steps

1. **Load Rules**: Parse and validate rule definitions
2. **Match Phase**: Find variables matching `when` conditions
3. **Target Resolution**: Resolve target variables from `aliasTo` path
4. **Mode Mapping**: Map modes between source and target
5. **Circular Check**: Validate no circular dependencies
6. **Execution**: Create aliases (apply mode only)

### Status Types

- **Matched**: Rule found variables and created aliases
- **Skipped**: Rule had no matches or was disabled
- **Error**: Rule failed due to invalid conditions

### Result Display

For each rule, you'll see:
- Number of variables matched
- Number of aliases created
- Source → Target mappings
- Mode mappings
- Warnings (e.g., circular dependencies)
- Errors (e.g., target not found)

## Safety Features

### Circular Dependency Prevention
The engine checks for circular dependencies before creating aliases:
- Variables cannot alias to themselves
- Variables cannot create circular chains (A → B → A)

### Backwards Alias Prevention
The engine enforces design token hierarchy rules:
- **Primitives cannot be aliased** (they must retain raw values)
- Semantic/Interaction/Theme tokens can alias to primitives
- Invalid alias directions are automatically blocked
- Clear error messages explain the token hierarchy

**Token Hierarchy Rules**:
```
Valid:
✅ Semantic → Primitive
✅ Interaction → Primitive
✅ Brand → Primitive
✅ Theme → Semantic
✅ Theme → Primitive

Invalid (Blocked):
❌ Primitive → Semantic
❌ Primitive → Interaction
❌ Primitive → Theme
❌ Primitive → Brand
```

**Example Error**:
If you write a rule like:
```json
{
  "when": { "collection": "primitive", "group": "colors" },
  "then": { "aliasTo": "semantic/brand" }
}
```

The engine will block it with:
```
Rule validation failed: Would create backwards aliases
Cannot create alias: Primitive collections should never be aliased.
Primitive tokens must maintain their raw values as the foundation of your design system.
```

### Dry-Run Mode
Always test rules with dry-run before applying:
- Preview what will happen
- Identify issues before making changes
- Validate rule logic
- See which aliases would be blocked

### Warnings
The engine warns about:
- Skipped aliases (circular dependencies)
- Skipped aliases (invalid directions)
- Missing targets
- Mode mapping fallbacks

## Example Rules

### Example 1: Interaction States
Map interaction hover states to base primitives:

```json
{
  "id": "rule-hover-states",
  "name": "Hover → Base Primitives",
  "description": "Hover state variables inherit from base primitive colors",
  "when": {
    "collection": "interaction",
    "group": "hover"
  },
  "then": {
    "aliasTo": "primitive/base"
  },
  "enabled": true
}
```

### Example 2: Semantic Tokens
Build semantic layer on primitives:

```json
{
  "id": "rule-semantic-colors",
  "name": "Semantic Colors → Primitives",
  "description": "Semantic color tokens alias to primitive colors",
  "when": {
    "collection": "semantic",
    "group": "colors"
  },
  "then": {
    "aliasTo": "primitive/colors"
  },
  "enabled": true
}
```

### Example 3: Theme Switching
Enable theme switching via aliasing:

```json
{
  "id": "rule-dark-theme",
  "name": "Dark Theme → Dark Primitives",
  "description": "Dark theme variables alias to dark primitive set",
  "when": {
    "collection": "theme",
    "group": "dark"
  },
  "then": {
    "aliasTo": "primitive-dark/colors"
  },
  "enabled": true
}
```

## Best Practices

### 1. Organize Rules by Purpose
Group related rules together:
- State management (hover, active, disabled)
- Theme switching (light, dark)
- Token hierarchy (primitive → semantic → component)

### 2. Use Descriptive Names
Make rule intent clear:
- ✅ "Interaction Hover → Primitive Default"
- ❌ "Rule 1"

### 3. Add Descriptions
Explain why the rule exists and what it accomplishes.

### 4. Test with Dry-Run
Always preview before applying:
1. Create rule
2. Run dry-run
3. Review results
4. Fix issues
5. Apply

### 5. Enable Incrementally
Don't enable all rules at once:
- Test one rule at a time
- Verify results
- Enable next rule

### 6. Use Consistent Naming
Follow naming conventions for collections and groups:
- Use lowercase for collection/group names in rules
- Match exact names from Figma
- Be consistent across your design system

## Troubleshooting

### Rule Not Matching Variables

**Problem**: Dry-run shows 0 matches

**Solutions**:
- Verify collection/group names match exactly (case-sensitive)
- Check if variables exist in that collection/group
- Try matching by collection only first
- Use Tree View to verify variable structure

### Target Not Found

**Problem**: Error "No target variables found at path"

**Solutions**:
- Verify target collection/group exists
- Check spelling in `aliasTo` path
- Ensure target has variables
- Use format: `collection/group` or `collection/group/variable`

### Circular Dependency Warning

**Problem**: Warning "would create circular dependency"

**Solutions**:
- Review alias chain: check what target already aliases to
- Break the circular chain
- Alias to a different target
- Use primitive variables as final targets

### All Matches Skipped

**Problem**: Rule matched but all skipped

**Likely Cause**: All matches would create circular dependencies

**Solutions**:
- Review existing aliases in Graph View
- Choose different target that doesn't create cycles
- Ensure target is a primitive (not aliased itself)

## Advanced Tips

### Chain Rules
Build token hierarchies by chaining rules:

1. **Level 1**: Primitives (no aliases)
2. **Level 2**: Semantic → Primitives
3. **Level 3**: Component → Semantic
4. **Level 4**: Theme → Component

Apply rules in order to build the hierarchy.

### Conditional Application
Use enabled/disabled to control which rules run:
- Disable rules for specific scenarios
- Enable only what you need
- Test one rule at a time

### Mode Strategy
Design mode mappings carefully:
- Name modes consistently (Light, Dark)
- Use same mode names across collections
- First mode becomes fallback

## Integration with Existing Workflow

### 1. Manual Aliasing First
Start by manually creating a few aliases to establish patterns.

### 2. Identify Patterns
Look for repetitive aliasing patterns:
- Same source → target relationship
- Consistent collection → collection mappings

### 3. Create Rules
Convert patterns into rules.

### 4. Validate
Use dry-run to ensure rules match your intent.

### 5. Apply and Iterate
Apply rules and refine based on results.

## Limitations (v1)

Current limitations:
- **Exact Matching Only**: No wildcards or patterns (e.g., can't match "hover*")
- **Simple Conditions**: No AND/OR logic for complex conditions
- **Auto Mode Mapping**: Cannot specify custom mode mappings
- **No Variable Filtering**: Cannot filter by variable type or name pattern

These features are planned for future versions.

## Future Enhancements

Planned features:
- Wildcard pattern matching
- Complex condition logic (AND/OR)
- Custom mode mapping rules
- Variable name pattern matching
- Rule templates and suggestions
- Import/export rule sets
- Rule versioning

## Summary

The Rule Engine automates Figma variable aliasing by:
1. Matching variables based on collection/group
2. Resolving target variables from alias paths
3. Mapping modes automatically
4. Checking for circular dependencies
5. Creating aliases safely

Use dry-run to preview, then apply to execute. Build complex token hierarchies by chaining rules strategically.
