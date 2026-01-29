# Rule Engine: Step-by-Step Evaluation Explanation

## Overview

The Rule Engine automates Figma variable aliasing by evaluating JSON-defined rules against your variable graph. This document explains exactly how the engine processes rules, step by step.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Rule Engine Flow                         │
└─────────────────────────────────────────────────────────────────┘

1. INPUT: Rules (JSON)
   ↓
2. PARSE & VALIDATE
   ├─ Check rule structure
   ├─ Validate required fields
   └─ Normalize rules
   ↓
3. LOAD GRAPH
   ├─ Fetch Figma variables
   ├─ Build internal graph
   └─ Parse collections/groups/variables
   ↓
4. EVALUATE EACH RULE
   ├─ MATCH PHASE
   │  ├─ Find source variables (when condition)
   │  └─ Resolve target variables (then action)
   ├─ MODE MAPPING
   │  ├─ Match modes by name
   │  └─ Fallback to first mode
   └─ VALIDATION
      ├─ Check circular dependencies
      └─ Validate mode compatibility
   ↓
5. GENERATE OPERATIONS
   ├─ Create alias operations list
   ├─ Track source → target mappings
   └─ Include mode mappings
   ↓
6. EXECUTION (Apply Mode Only)
   ├─ Execute each operation
   ├─ Create alias via Figma API
   └─ Handle errors
   ↓
7. OUTPUT: Evaluation Result
   ├─ Summary (matches, aliases, status)
   ├─ Step-by-step details
   ├─ Warnings
   └─ Errors
```

---

## Step-by-Step Evaluation Process

### Step 1: Rule Parsing

**Input**: JSON string with rules

```json
[
  {
    "id": "rule-1",
    "name": "Hover → Base",
    "when": { "collection": "interaction", "group": "hover" },
    "then": { "aliasTo": "primitive/base" },
    "enabled": true
  }
]
```

**Process**:
1. Parse JSON string → JavaScript objects
2. Validate each rule structure:
   - Check required fields (`id`, `name`, `when`, `then`)
   - Validate `when` has at least one condition
   - Validate `aliasTo` path format
3. Normalize rules (set defaults for optional fields)
4. Filter enabled rules

**Output**: Array of validated `Rule` objects

**Possible Errors**:
- Invalid JSON syntax
- Missing required fields
- Invalid `aliasTo` format (must be `collection/group` or `collection/group/variable`)

---

### Step 2: Graph Loading

**Process**:
1. Fetch all variable collections from Figma
2. Fetch all variables from Figma
3. Build internal graph structure:
   - Map collections by ID
   - Extract groups from variable names
   - Map variables by ID
   - Extract existing aliases

**Output**: `VariableGraph` object
```typescript
{
  collections: Map<id, Collection>,
  groups: Map<id, Group>,
  variables: Map<id, Variable>,
  aliases: Alias[]
}
```

---

### Step 3: Rule Matching (Per Rule)

For each enabled rule, the engine performs matching:

#### 3.1 Source Variable Matching

**Process**:
```
For each variable in graph:
  1. Get variable's group
  2. Get group's collection
  3. Check if matches rule.when.collection (if specified)
  4. Check if matches rule.when.group (if specified)
  5. If both match (or only one was specified), add to matches
```

**Example**:
```
Rule: when { collection: "interaction", group: "hover" }

Variables in Graph:
✓ interaction/hover/primary-hover    → MATCHED
✓ interaction/hover/secondary-hover  → MATCHED
✗ interaction/default/primary        → NOT MATCHED (wrong group)
✗ semantic/hover/text               → NOT MATCHED (wrong collection)
```

**Output**: Array of matched source variables

---

#### 3.2 Target Variable Resolution

**Process**:
```
1. Parse aliasTo path: "collection/group" or "collection/group/variable"
2. Find collection by name
3. Find group in that collection
4. If specific variable specified:
   - Find that variable in the group
   - Return single variable
5. Else:
   - Return all variables in the group
```

**Example**:
```
aliasTo: "primitive/base"

1. Find collection "primitive" → Found (id: col-123)
2. Find group "base" in collection → Found (id: grp-456)
3. No specific variable specified
4. Get all variables in group:
   - primitive/base/primary
   - primitive/base/secondary
   - primitive/base/tertiary

Output: [primary, secondary, tertiary]
```

---

#### 3.3 Variable Pairing

**Process**:
```
For each source variable:
  1. If only one target variable:
     - Pair source with that target
  2. If multiple target variables:
     - Try to match by name
     - If name match found, use that
     - Else, use first target as fallback
```

**Example**:
```
Source: interaction/hover/primary-hover
Targets: [primitive/base/primary, primitive/base/secondary]

1. Multiple targets available
2. Try name match:
   - "primary-hover" vs "primary" → Partial match!
   - Use "primary"

Result: primary-hover → primary
```

---

#### 3.4 Mode Mapping

**Process**:
```
For each mode in source variable:
  1. Try to find target mode with same name
  2. If found, create mapping: sourceModeId → targetModeId
  3. If not found, use first available target mode
  4. Add to mode mappings
```

**Example**:
```
Source Variable: primary-hover
  Modes: [Light (mode-1), Dark (mode-2)]

Target Variable: primary
  Modes: [Light (mode-10), Dark (mode-20)]

Mode Mapping:
  mode-1 (Light)  → mode-10 (Light)   [Name match]
  mode-2 (Dark)   → mode-20 (Dark)    [Name match]
```

**Example with Fallback**:
```
Source Variable: hover-state
  Modes: [Default (mode-1), Hover (mode-2)]

Target Variable: base-color
  Modes: [Light (mode-10)]

Mode Mapping:
  mode-1 (Default) → mode-10 (Light)   [Fallback - no name match]
  mode-2 (Hover)   → mode-10 (Light)   [Fallback - only one target mode]
```

---

### Step 4: Validation

For each source → target pair:

#### 4.1 Circular Dependency Check

**Process**:
```
Check if creating alias would create cycle:
  1. If source === target → CIRCULAR
  2. Build alias chain from target:
     - Follow target's aliases
     - Check if chain leads back to source
  3. If cycle found → Skip this pair
```

**Example**:
```
Existing: A → B → C

New Rule: C → A
Check: Does A's chain reach C?
  A → B → C → (would go to A) → CIRCULAR!
Result: Skip this alias
```

**Output**: Warning added to step

---

#### 4.2 Alias Direction Validation (NEW)

**Process**:
```
For each match:
  1. Get source collection type (primitive, semantic, etc.)
  2. Get target collection type
  3. Validate against token hierarchy:
     - Primitives (level 0) should NEVER be aliased
     - Higher levels can alias to lower levels
  4. If backwards → Skip match and add warning
```

**Token Hierarchy**:
```
Level 0: Primitive (foundation)
Level 1: Semantic/Interaction/Brand
Level 2: Theme

Valid: Level 1+ → Level 0 (e.g., Semantic → Primitive) ✅
Invalid: Level 0 → Level 1+ (e.g., Primitive → Semantic) ❌
```

**Example - Blocked**:
```
Rule: primitive/colors → semantic/brand

Validation:
  Source: primitive (level 0)
  Target: semantic (level 1)
  Result: BLOCKED - Primitives cannot be aliased

Warning: "Skipped primitive/colors/blue → semantic/brand/primary:
         Cannot create alias: Primitive collections should never be aliased."
```

#### 4.3 Mode Compatibility

**Process**:
```
For each mode mapping:
  1. Verify source mode exists
  2. Verify target mode exists
  3. If either missing, skip this mapping
```

---

### Step 5: Result Aggregation

**Per Rule**:
```typescript
EvaluationStep {
  ruleId: "rule-1"
  ruleName: "Hover → Base"
  status: "matched" | "skipped" | "error"
  matchedVariables: [
    {
      sourceVariable: Variable,
      targetVariable: Variable,
      modeMappings: [
        { sourceModeId, sourceModeName, targetModeId, targetModeName }
      ]
    }
  ]
  aliasCount: 4  // Total mode mappings across all matches
  warnings: ["Skipped X → Y: would create cycle"]
  error?: "No variables matched"
}
```

**Overall Result**:
```typescript
EvaluationResult {
  mode: "dry-run" | "apply"
  steps: EvaluationStep[]
  totalMatched: 5     // Total variables matched
  totalAliases: 12    // Total aliases created
  errors: []
  warnings: []
  success: true
}
```

---

### Step 6: Alias Operation Generation (Apply Mode)

**Process**:
```
For each matched variable:
  For each mode mapping:
    Create AliasOperation {
      sourceVariableId
      sourceModeId
      targetVariableId
      targetModeId
      ruleId
      ruleName
    }
```

**Example**:
```
Matches:
  - primary-hover → primary (2 modes)
  - secondary-hover → secondary (2 modes)

Operations Generated: 4
  1. primary-hover.Light → primary.Light
  2. primary-hover.Dark → primary.Dark
  3. secondary-hover.Light → secondary.Light
  4. secondary-hover.Dark → secondary.Dark
```

---

### Step 7: Execution (Apply Mode Only)

**Process**:
```
For each operation:
  1. Get source variable from Figma
  2. Get target variable from Figma
  3. Create alias value: figma.variables.createVariableAlias(target)
  4. Set alias: source.setValueForMode(sourceModeId, aliasValue)
  5. Log success or error
```

**Error Handling**:
- If operation fails, log error but continue with next operation
- Track success/failure counts
- Return detailed error messages

---

## Dry-Run vs Apply Mode

### Dry-Run Mode
- Performs all steps 1-5 (parse, match, validate, aggregate)
- **Does NOT** execute step 7 (alias creation)
- Returns preview of what would happen
- Safe to run anytime

### Apply Mode
- Performs all steps 1-7
- **Actually creates aliases** in Figma
- Modifies your Figma file
- Can be undone via Figma's undo (Cmd/Ctrl+Z)

---

## Example: Complete Evaluation

### Input Rule
```json
{
  "id": "rule-hover",
  "name": "Hover States → Base Colors",
  "when": { "collection": "interaction", "group": "hover" },
  "then": { "aliasTo": "primitive/colors" },
  "enabled": true
}
```

### Graph State
```
Collections:
  - interaction (id: col-1)
  - primitive (id: col-2)

Groups:
  - interaction/hover (id: grp-1)
  - primitive/colors (id: grp-2)

Variables:
  - interaction/hover/primary-hover (id: var-1)
    Modes: [Light (m-1), Dark (m-2)]
  - interaction/hover/secondary-hover (id: var-2)
    Modes: [Light (m-3), Dark (m-4)]
  - primitive/colors/primary (id: var-10)
    Modes: [Light (m-10), Dark (m-11)]
  - primitive/colors/secondary (id: var-11)
    Modes: [Light (m-12), Dark (m-13)]
```

### Evaluation Steps

**Step 1: Parse Rule** ✓
- Rule structure valid
- Enabled: true

**Step 2: Load Graph** ✓
- 2 collections, 2 groups, 4 variables loaded

**Step 3.1: Match Sources**
```
Checking: interaction/hover/primary-hover
  Collection: interaction ✓
  Group: hover ✓
  → MATCHED

Checking: interaction/hover/secondary-hover
  Collection: interaction ✓
  Group: hover ✓
  → MATCHED

Result: 2 variables matched
```

**Step 3.2: Resolve Targets**
```
Parse: "primitive/colors"
  Collection: primitive → Found (col-2)
  Group: colors → Found (grp-2)
  Variables in group:
    - primary (var-10)
    - secondary (var-11)

Result: 2 target variables
```

**Step 3.3: Pair Variables**
```
Match 1:
  Source: primary-hover
  Name match: "primary-hover" ~ "primary" → Match!
  Target: primary

Match 2:
  Source: secondary-hover
  Name match: "secondary-hover" ~ "secondary" → Match!
  Target: secondary
```

**Step 3.4: Map Modes**
```
Match 1: primary-hover → primary
  Mode m-1 (Light) → m-10 (Light)  [Name match]
  Mode m-2 (Dark)  → m-11 (Dark)   [Name match]

Match 2: secondary-hover → secondary
  Mode m-3 (Light) → m-12 (Light)  [Name match]
  Mode m-4 (Dark)  → m-13 (Dark)   [Name match]
```

**Step 4: Validate**
```
Check circular: primary-hover → primary
  Does primary's chain reach primary-hover? No ✓

Check circular: secondary-hover → secondary
  Does secondary's chain reach secondary-hover? No ✓

All validations passed
```

**Step 5: Aggregate Result**
```
EvaluationStep {
  ruleId: "rule-hover"
  ruleName: "Hover States → Base Colors"
  status: "matched"
  matchedVariables: 2
  aliasCount: 4  // 2 variables × 2 modes each
  warnings: []
  error: null
}
```

**Step 6: Generate Operations (Apply Mode)**
```
Operations:
  1. var-1.m-1 → var-10.m-10  (primary-hover.Light → primary.Light)
  2. var-1.m-2 → var-10.m-11  (primary-hover.Dark → primary.Dark)
  3. var-2.m-3 → var-11.m-12  (secondary-hover.Light → secondary.Light)
  4. var-2.m-4 → var-11.m-13  (secondary-hover.Dark → secondary.Dark)
```

**Step 7: Execute (Apply Mode)**
```
Operation 1: var-1.m-1 → var-10.m-10
  ✓ Created alias successfully

Operation 2: var-1.m-2 → var-10.m-11
  ✓ Created alias successfully

Operation 3: var-2.m-3 → var-11.m-12
  ✓ Created alias successfully

Operation 4: var-2.m-4 → var-11.m-13
  ✓ Created alias successfully

Result: 4/4 succeeded
```

### Final Result
```typescript
{
  mode: "apply",
  steps: [
    {
      ruleId: "rule-hover",
      ruleName: "Hover States → Base Colors",
      status: "matched",
      matchCount: 2,
      aliasCount: 4,
      details: [
        "primary-hover → primary (2 modes)",
        "secondary-hover → secondary (2 modes)"
      ],
      warnings: [],
      error: null
    }
  ],
  totalMatched: 2,
  totalAliases: 4,
  errors: [],
  warnings: [],
  success: true
}
```

---

## Real-World Examples: Before & After

### Example 1: Building an Interaction Layer

#### Scenario
You have primitive colors and want interaction states (hover, active, focus) to automatically alias to them.

#### Before: Manual State

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive/colors                                │
│   ├─ primary      = #0066FF  (Light: #0066FF)  │
│   │                           (Dark: #4D94FF)   │
│   ├─ secondary    = #6B7280  (Light: #6B7280)  │
│   │                           (Dark: #9CA3AF)   │
│   └─ danger       = #DC2626  (Light: #DC2626)  │
│                               (Dark: #EF4444)   │
│                                                 │
│ interaction/hover                               │
│   ├─ primary-hover   = #0052CC  (Light)        │
│   │                   = #6BA3FF  (Dark)         │
│   ├─ secondary-hover = #4B5563  (Light)        │
│   │                   = #D1D5DB  (Dark)         │
│   └─ danger-hover    = #B91C1C  (Light)        │
│                       = #F87171  (Dark)         │
└─────────────────────────────────────────────────┘

Problem: All hover states are hardcoded values, not aliased.
         Need to manually update 6 mode values if primitives change.
```

#### Rule Definition

```json
{
  "id": "rule-hover-states",
  "name": "Hover States → Primitive Colors",
  "description": "Automatically alias hover states to base primitive colors",
  "when": {
    "collection": "interaction",
    "group": "hover"
  },
  "then": {
    "aliasTo": "primitive/colors"
  },
  "enabled": true
}
```

#### After: Automated Aliasing

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive/colors                                │
│   ├─ primary      = #0066FF  (Light: #0066FF)  │
│   │                           (Dark: #4D94FF)   │
│   ├─ secondary    = #6B7280  (Light: #6B7280)  │
│   │                           (Dark: #9CA3AF)   │
│   └─ danger       = #DC2626  (Light: #DC2626)  │
│                               (Dark: #EF4444)   │
│                                                 │
│ interaction/hover                               │
│   ├─ primary-hover   ──→ primitive/primary     │
│   │   Light mode: ALIAS → primitive.Light      │
│   │   Dark mode:  ALIAS → primitive.Dark       │
│   ├─ secondary-hover ──→ primitive/secondary   │
│   │   Light mode: ALIAS → secondary.Light      │
│   │   Dark mode:  ALIAS → secondary.Dark       │
│   └─ danger-hover    ──→ primitive/danger      │
│       Light mode: ALIAS → danger.Light         │
│       Dark mode:  ALIAS → danger.Dark          │
└─────────────────────────────────────────────────┘

Result: 3 variables × 2 modes = 6 aliases created
        All hover states now automatically inherit from primitives
        Changing primitive/primary updates primary-hover instantly
```

#### Impact

**Before Rule:**
- Manual values: 6 separate values to maintain
- Updates require: Changing each hover state individually
- Risk: Values can drift out of sync

**After Rule:**
- Automatic aliases: 6 aliases pointing to primitives
- Updates require: Change primitive only (hover updates automatically)
- Benefit: Values always stay in sync

---

### Example 2: Semantic Token Layer

#### Scenario
Building semantic tokens that reference primitives based on purpose, not color name.

#### Before: Manual State

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive/colors                                │
│   ├─ blue-500    = #0066FF                     │
│   ├─ gray-600    = #6B7280                     │
│   ├─ red-600     = #DC2626                     │
│   ├─ green-600   = #10B981                     │
│   └─ amber-600   = #F59E0B                     │
│                                                 │
│ semantic/feedback                               │
│   ├─ success     = #10B981  (hardcoded)        │
│   ├─ error       = #DC2626  (hardcoded)        │
│   ├─ warning     = #F59E0B  (hardcoded)        │
│   └─ info        = #0066FF  (hardcoded)        │
│                                                 │
│ semantic/ui                                     │
│   ├─ text-primary   = #111827  (hardcoded)     │
│   ├─ text-secondary = #6B7280  (hardcoded)     │
│   └─ border         = #E5E7EB  (hardcoded)     │
└─────────────────────────────────────────────────┘

Problem: Semantic tokens have hardcoded values
         Cannot change brand color system without updating each
```

#### Rule Definition

```json
{
  "id": "rule-semantic-feedback",
  "name": "Semantic Feedback → Primitives",
  "description": "Map semantic feedback tokens to primitive colors",
  "when": {
    "collection": "semantic",
    "group": "feedback"
  },
  "then": {
    "aliasTo": "primitive/colors"
  },
  "enabled": true
}
```

#### After: Automated Aliasing

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive/colors                                │
│   ├─ blue-500    = #0066FF                     │
│   ├─ gray-600    = #6B7280                     │
│   ├─ red-600     = #DC2626                     │
│   ├─ green-600   = #10B981                     │
│   └─ amber-600   = #F59E0B                     │
│                                                 │
│ semantic/feedback                               │
│   ├─ success  ──→ primitive/green-600          │
│   ├─ error    ──→ primitive/red-600            │
│   ├─ warning  ──→ primitive/amber-600          │
│   └─ info     ──→ primitive/blue-500           │
│                                                 │
│ semantic/ui (not affected - different group)   │
│   ├─ text-primary   = #111827  (unchanged)     │
│   ├─ text-secondary = #6B7280  (unchanged)     │
│   └─ border         = #E5E7EB  (unchanged)     │
└─────────────────────────────────────────────────┘

Result: 4 variables aliased
        Semantic layer now references primitives
        semantic/ui not affected (different group)
```

#### Mapping Logic

```
Name Matching Strategy:
  success  → green-600  (fallback to first if no name match)
  error    → red-600    (fallback to first if no name match)
  warning  → amber-600  (fallback to first if no name match)
  info     → blue-500   (fallback to first if no name match)

Note: If no name match found, engine uses first available variable
      in target group. For better control, ensure names align or
      create specific rules per variable.
```

---

### Example 3: Theme Switching System

#### Scenario
Create a theme system where light/dark themes alias to different primitive sets.

#### Before: Manual State

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive-light/colors                          │
│   ├─ background = #FFFFFF                       │
│   ├─ surface    = #F9FAFB                       │
│   ├─ text       = #111827                       │
│   └─ border     = #E5E7EB                       │
│                                                 │
│ primitive-dark/colors                           │
│   ├─ background = #111827                       │
│   ├─ surface    = #1F2937                       │
│   ├─ text       = #F9FAFB                       │
│   └─ border     = #374151                       │
│                                                 │
│ theme/colors                                    │
│   ├─ background                                 │
│   │   Light mode: #FFFFFF  (hardcoded)          │
│   │   Dark mode:  #111827  (hardcoded)          │
│   ├─ surface                                    │
│   │   Light mode: #F9FAFB  (hardcoded)          │
│   │   Dark mode:  #1F2937  (hardcoded)          │
│   ├─ text                                       │
│   │   Light mode: #111827  (hardcoded)          │
│   │   Dark mode:  #F9FAFB  (hardcoded)          │
│   └─ border                                     │
│       Light mode: #E5E7EB  (hardcoded)          │
│       Dark mode:  #374151  (hardcoded)          │
└─────────────────────────────────────────────────┘

Problem: Theme variables manually set for each mode
         8 values to maintain (4 variables × 2 modes)
         Cannot easily add new theme (e.g., high contrast)
```

#### Rule Definitions

```json
[
  {
    "id": "rule-theme-light",
    "name": "Theme Light Mode → Light Primitives",
    "when": {
      "collection": "theme",
      "group": "colors"
    },
    "then": {
      "aliasTo": "primitive-light/colors"
    },
    "enabled": true
  }
]
```

**Note**: This example shows a limitation - current v1 doesn't support mode-specific aliasing. The rule would alias both modes to the same target. For full theme switching, you'd need:
- Separate theme collections for light/dark, OR
- Manual mode-specific aliasing (planned for v2)

#### Better Approach for Current Version

```json
[
  {
    "id": "rule-light-theme",
    "name": "Light Theme → Light Primitives",
    "when": {
      "collection": "theme-light"
    },
    "then": {
      "aliasTo": "primitive-light/colors"
    },
    "enabled": true
  },
  {
    "id": "rule-dark-theme",
    "name": "Dark Theme → Dark Primitives",
    "when": {
      "collection": "theme-dark"
    },
    "then": {
      "aliasTo": "primitive-dark/colors"
    },
    "enabled": true
  }
]
```

#### After: Automated Aliasing

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive-light/colors                          │
│   ├─ background = #FFFFFF                       │
│   ├─ surface    = #F9FAFB                       │
│   ├─ text       = #111827                       │
│   └─ border     = #E5E7EB                       │
│                                                 │
│ primitive-dark/colors                           │
│   ├─ background = #111827                       │
│   ├─ surface    = #1F2937                       │
│   ├─ text       = #F9FAFB                       │
│   └─ border     = #374151                       │
│                                                 │
│ theme-light/colors                              │
│   ├─ background ──→ primitive-light/background  │
│   ├─ surface    ──→ primitive-light/surface     │
│   ├─ text       ──→ primitive-light/text        │
│   └─ border     ──→ primitive-light/border      │
│                                                 │
│ theme-dark/colors                               │
│   ├─ background ──→ primitive-dark/background   │
│   ├─ surface    ──→ primitive-dark/surface      │
│   ├─ text       ──→ primitive-dark/text         │
│   └─ border     ──→ primitive-dark/border       │
└─────────────────────────────────────────────────┘

Result: 8 variables aliased (4 per theme)
        Easy to add new themes (theme-high-contrast, etc.)
        Update primitive sets and themes follow automatically
```

---

### Example 4: Multi-Level Token Hierarchy

#### Scenario
Build a complete 3-level token system: Primitives → Semantic → Components.

#### Before: Flat Structure

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ All in one collection - "tokens"                │
│   ├─ blue-500     = #0066FF                     │
│   ├─ primary      = #0066FF                     │
│   ├─ button-bg    = #0066FF                     │
│   ├─ gray-600     = #6B7280                     │
│   ├─ text-muted   = #6B7280                     │
│   ├─ input-border = #6B7280                     │
│   └─ ...                                        │
└─────────────────────────────────────────────────┘

Problem: No hierarchy, no relationships
         All variables are independent
         Can't systematically update related tokens
```

#### Rule Definitions

```json
[
  {
    "id": "rule-level-2-semantic",
    "name": "Level 2: Semantic → Primitives",
    "when": {
      "collection": "semantic"
    },
    "then": {
      "aliasTo": "primitive/colors"
    },
    "enabled": true
  },
  {
    "id": "rule-level-3-component",
    "name": "Level 3: Components → Semantic",
    "when": {
      "collection": "component"
    },
    "then": {
      "aliasTo": "semantic/colors"
    },
    "enabled": true
  }
]
```

#### After: Hierarchical Structure

```
Variables Structure (3-Level Hierarchy):
┌─────────────────────────────────────────────────┐
│ LEVEL 1: primitive/colors (Foundation)          │
│   ├─ blue-500    = #0066FF  (RAW VALUE)         │
│   ├─ gray-600    = #6B7280  (RAW VALUE)         │
│   └─ red-600     = #DC2626  (RAW VALUE)         │
│                      ↑                           │
│                      │ (aliased to)             │
│                      │                           │
│ LEVEL 2: semantic/colors (Purpose)              │
│   ├─ primary     ──→ blue-500                   │
│   ├─ text-muted  ──→ gray-600                   │
│   └─ danger      ──→ red-600                    │
│                      ↑                           │
│                      │ (aliased to)             │
│                      │                           │
│ LEVEL 3: component/colors (Context)             │
│   ├─ button-bg      ──→ semantic/primary        │
│   ├─ input-border   ──→ semantic/text-muted     │
│   └─ error-text     ──→ semantic/danger         │
└─────────────────────────────────────────────────┘

Alias Chain Example:
  component/button-bg 
    └─→ semantic/primary 
        └─→ primitive/blue-500 
            └─→ #0066FF (final value)
```

#### Impact of Changes

**Scenario**: Brand color changes from blue to purple

```
Change Made:
  primitive/blue-500: #0066FF → #7C3AED

Automatic Cascade:
  1. primitive/blue-500    = #7C3AED ✓ (changed directly)
  2. semantic/primary      → #7C3AED ✓ (aliased, updates automatically)
  3. component/button-bg   → #7C3AED ✓ (aliased, updates automatically)

Result: 1 change → 3 variables updated
        All components using "primary" now use new brand color
        No manual updates needed at semantic or component level
```

---

### Example 5: Complex Mapping with Multiple Variables

#### Scenario
You have interaction states for multiple button types that should all reference primitives.

#### Before: Manual Mappings

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive/colors                                │
│   ├─ blue-500     = #0066FF                     │
│   ├─ blue-600     = #0052CC                     │
│   ├─ gray-500     = #9CA3AF                     │
│   └─ gray-600     = #6B7280                     │
│                                                 │
│ interaction/button-primary                      │
│   ├─ default = #0066FF  (hardcoded)             │
│   ├─ hover   = #0052CC  (hardcoded)             │
│   └─ active  = #003D99  (hardcoded)             │
│                                                 │
│ interaction/button-secondary                    │
│   ├─ default = #9CA3AF  (hardcoded)             │
│   ├─ hover   = #6B7280  (hardcoded)             │
│   └─ active  = #4B5563  (hardcoded)             │
└─────────────────────────────────────────────────┘

Problem: 6 hardcoded values across multiple button states
```

#### Rule Definition

```json
{
  "id": "rule-button-states",
  "name": "Button States → Primitives",
  "when": {
    "collection": "interaction",
    "group": "button-primary"
  },
  "then": {
    "aliasTo": "primitive/colors"
  },
  "enabled": true
}
```

#### After: Automated Aliasing

```
Variables Structure:
┌─────────────────────────────────────────────────┐
│ primitive/colors                                │
│   ├─ blue-500     = #0066FF                     │
│   ├─ blue-600     = #0052CC                     │
│   ├─ gray-500     = #9CA3AF                     │
│   └─ gray-600     = #6B7280                     │
│                                                 │
│ interaction/button-primary                      │
│   ├─ default ──→ primitive/blue-500             │
│   ├─ hover   ──→ primitive/blue-600             │
│   └─ active  ──→ primitive/blue-500 (fallback)  │
│                                                 │
│ interaction/button-secondary (not in rule)      │
│   ├─ default = #9CA3AF  (unchanged)             │
│   ├─ hover   = #6B7280  (unchanged)             │
│   └─ active  = #4B5563  (unchanged)             │
└─────────────────────────────────────────────────┘

Matching Logic:
  default → blue-500  (name match: "default" ~ "blue-500"? No → first available)
  hover   → blue-600  (name match: "hover" ~ "blue-600"? No → next available)
  active  → blue-500  (fallback - limited targets)

Note: Only button-primary was affected (specified in rule)
      button-secondary needs separate rule
```

#### Better Targeting with Specific Rules

```json
[
  {
    "id": "rule-btn-primary-default",
    "name": "Button Primary Default",
    "when": {
      "collection": "interaction",
      "group": "button-primary"
    },
    "then": {
      "aliasTo": "primitive/colors/blue-500"
    }
  },
  {
    "id": "rule-btn-primary-hover",
    "name": "Button Primary Hover",
    "when": {
      "collection": "interaction",
      "group": "button-primary-hover"
    },
    "then": {
      "aliasTo": "primitive/colors/blue-600"
    }
  }
]
```

---

## Key Insights from Examples

### 1. Alias Chains
Rules can create multi-level hierarchies:
```
Component → Semantic → Primitive → Raw Value
```
Changing the primitive updates everything downstream.

### 2. Granular Control
- **Broad rules**: Match entire collections
- **Specific rules**: Match collection + group
- **Targeted rules**: Alias to specific variables

### 3. Naming Matters
The engine matches variables by name when possible:
- `primary-hover` matches with `primary`
- `success` might not match with `green-600`
- Use consistent naming for better automatic pairing

### 4. Mode Mapping
Rules automatically map modes by name:
- Light → Light
- Dark → Dark
- Default → Default (or first available)

### 5. Incremental Adoption
Apply rules gradually:
1. Start with one collection
2. Verify with dry-run
3. Apply and test
4. Add next rule
5. Build complete system

### 6. Rule Order Matters
When building hierarchies:
1. Create primitives (raw values)
2. Apply Level 2 rules (primitives → semantic)
3. Apply Level 3 rules (semantic → components)
4. Each level builds on previous

---

## Summary

The Rule Engine evaluation process:

1. **Parse** rules from JSON and validate structure
2. **Load** current variable graph from Figma
3. **Match** source variables using `when` conditions
4. **Resolve** target variables from `aliasTo` path
5. **Pair** sources with targets (name matching)
6. **Map** modes between source and target
7. **Validate** for circular dependencies
8. **Generate** alias operations list
9. **Execute** operations (apply mode only)
10. **Report** detailed results with step-by-step logging

Each step logs its progress, warnings, and errors, providing complete visibility into the automation process.
