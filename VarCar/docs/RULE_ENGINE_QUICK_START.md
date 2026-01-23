# Rule Engine Quick Start

## What Was Built

A complete rule engine for automated Figma variable aliasing with:
- ✅ JSON-defined rules
- ✅ Automatic aliasing based on collection/group patterns
- ✅ Dry-run (preview) mode
- ✅ Apply (execute) mode
- ✅ Step-by-step evaluation logging
- ✅ Circular dependency prevention
- ✅ Full UI integration

## How to Use (5 Minutes)

### 1. Build and Load Plugin
```bash
npm run build
```

Load plugin in Figma:
- Open Figma Desktop
- Plugins → Development → Import plugin from manifest
- Select `manifest.json` from the FigZig directory
- Run: Plugins → Development → FigZig

### 2. Access Rules Engine

In the plugin UI:
1. Click **"Rules Engine"** button in the header
2. You'll see two panels:
   - Left: Rule List (manage rules)
   - Right: Rule Runner (evaluate rules)

### 3. Create Your First Rule

Click **"+ Add Rule"** and fill in:

**Basic Example:**
```
Name: Hover States to Base
Description: Map interaction hover states to primitive base colors
When:
  Collection: interaction
  Group: hover
Then:
  Alias To: primitive/base
Enabled: ✓
```

Click **"Save Rule"**

### 4. Test with Dry-Run

1. Click **"🔍 Dry Run (Preview)"**
2. Review the results:
   - See what variables matched
   - See what aliases would be created
   - Check for warnings/errors
3. Verify the output is what you expect

### 5. Apply Rules

If dry-run looks good:
1. Click **"⚡ Apply Rules"**
2. Confirm the action
3. The engine creates all aliases in Figma
4. Review the results panel

## Example Rules

### Example 1: Simple Interaction States
```json
{
  "id": "rule-hover",
  "name": "Hover → Base",
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

### Example 2: Semantic Layer
```json
{
  "id": "rule-semantic",
  "name": "Semantic → Primitives",
  "when": {
    "collection": "semantic"
  },
  "then": {
    "aliasTo": "primitive/colors"
  },
  "enabled": true
}
```

### Example 3: Theme Switching
```json
{
  "id": "rule-dark-theme",
  "name": "Dark Theme",
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

## Rule Format

### Minimal Rule
```json
{
  "id": "unique-id",
  "name": "Rule Name",
  "when": { "collection": "source-collection" },
  "then": { "aliasTo": "target/group" },
  "enabled": true
}
```

### Full Rule
```json
{
  "id": "unique-id",
  "name": "Rule Name",
  "description": "What this rule does",
  "when": {
    "collection": "source-collection",
    "group": "source-group"
  },
  "then": {
    "aliasTo": "target-collection/target-group"
  },
  "enabled": true
}
```

## Understanding the UI

### Rule List Panel (Left)
- **Green checkbox**: Rule is enabled
- **Pencil icon** (✏️): Edit rule
- **Trash icon** (🗑️): Delete rule
- **+ Add Rule**: Create new rule

### Rule Runner Panel (Right)
- **Dry Run**: Preview without changing anything
- **Apply Rules**: Execute and create aliases
- **Results**: Step-by-step evaluation details

### Evaluation Results

#### Summary
- **Status**: ✓ Success or ✗ Failed
- **Variables Matched**: How many variables matched rules
- **Aliases Created**: How many aliases were created

#### Step-by-Step
Each rule shows:
- **Matched** (green): Rule found variables and created aliases
- **Skipped** (orange): Rule had no matches or was disabled
- **Error** (red): Rule failed due to invalid conditions

Expand steps to see:
- Variable matches (source → target)
- Mode mappings
- Warnings (e.g., circular dependencies skipped)
- Errors (e.g., target not found)

## Common Patterns

### Pattern 1: Token Hierarchy
```
Level 1: Primitives (raw values, no aliases)
Level 2: Semantic → Primitives
Level 3: Component → Semantic
Level 4: Theme → Component
```

Create rules in order, applying level by level.

### Pattern 2: Interaction States
```
Rule: interaction/hover → primitive/base
Rule: interaction/active → primitive/base
Rule: interaction/disabled → primitive/muted
```

### Pattern 3: Theme Switching
```
Rule: theme/light → semantic/colors
Rule: theme/dark → semantic-dark/colors
```

## Tips

1. **Start Simple**: Create one rule, test it, then add more
2. **Always Dry-Run First**: Preview before applying
3. **Use Descriptive Names**: Make rules easy to understand
4. **Check Graph View**: Verify variable structure before creating rules
5. **Match Exact Names**: Collection/group names are case-sensitive

## Troubleshooting

### "No variables matched"
- Verify collection/group names match exactly
- Check Tree View to see actual names
- Try matching by collection only first

### "Target not found"
- Check spelling in `aliasTo` path
- Ensure target collection/group exists
- Use format: `collection/group`

### "Would create circular dependency"
- Review existing aliases in Graph View
- Choose a different target
- Use primitive variables as targets (they have no aliases)

## Next Steps

1. **Read the Full Guide**: [`docs/RULE_ENGINE_GUIDE.md`](./RULE_ENGINE_GUIDE.md)
2. **Understand Evaluation**: [`docs/RULE_ENGINE_EXPLANATION.md`](./RULE_ENGINE_EXPLANATION.md)
3. **Example Rules**: [`rules/example-rules.json`](../rules/example-rules.json)

## Key Files

```
FigZig/
├── src/
│   ├── models/rules.ts              # Rule type definitions
│   ├── engine/                      # Rule engine core
│   │   ├── ruleEngine.ts           # Main orchestrator
│   │   ├── ruleEvaluator.ts        # Evaluation logic
│   │   ├── ruleMatcher.ts          # Variable matching
│   │   └── ruleParser.ts           # JSON parsing
│   ├── code.ts                     # Plugin backend (message handlers)
│   └── ui/
│       ├── App.tsx                 # Main UI (integrated)
│       └── components/
│           ├── RuleList.tsx        # Rule management
│           ├── RuleEditor.tsx      # Rule creation/editing
│           └── RuleRunner.tsx      # Dry-run & apply
├── rules/
│   └── example-rules.json          # Example rules
└── docs/
    ├── RULE_ENGINE_QUICK_START.md  # This file
    ├── RULE_ENGINE_GUIDE.md        # Comprehensive guide
    └── RULE_ENGINE_EXPLANATION.md  # Step-by-step explanation
```

## Success!

You now have a fully functional rule engine that can:
- Match variables by collection/group
- Automatically map modes
- Prevent circular dependencies
- Create aliases in bulk
- Provide detailed evaluation logging

Happy automating! 🎉
