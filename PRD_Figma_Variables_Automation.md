# PRD: Automated Figma Variables Orchestration Tool

## Author
Upen

## Version
v1.0

## Status
Planning → Build in Phases

---

## 1. Problem Statement

Design systems at scale contain:
- Thousands of color variables
- Multiple collections (Primitives, Semantic, Interaction, Brand, Theme, etc.)
- Nested groups
- Multiple modes (Light/Dark, States, Brand variants)

Today, managing **aliasing across collections, groups, and modes** in Figma is:
- Highly manual
- Error-prone
- Time-consuming
- Impossible to scale

There is **no native Figma workflow** for:
- Rule-based aliasing
- Batch mapping across collections
- Visual dependency management
- Exportable, auditable token graphs

---

## 2. Product Vision

Build an **industry-standard, node-based automation tool** for Figma Variables that:

- Treats variables as a **graph**
- Enables **rule-based aliasing**
- Automates **collection → group → mode mappings**
- Eliminates manual repetition
- Exports a **fully structured JSON token graph**
- Works **natively inside Figma**

This tool should feel like:
> Variable Visualizer × Rules Engine × Token Compiler

---

## 3. Goals & Non-Goals

### Goals
- Zero manual aliasing
- Deterministic, repeatable mappings
- Visual clarity of dependencies
- Fast iteration on large token sets
- Cursor-friendly codebase

### Non-Goals (v1)
- No AI generation initially
- No external design token registry
- No theming runtime engine
- No CSS / platform token output (yet)

---

## 4. Target Users

- Design System Designers
- Design Ops / Platform Teams
- Token / Theme Owners
- Large multi-brand organizations

---

## 5. Core Concepts & Terminology

### Variable Graph Model

```
Primitive Collection
└── Group
└── Variable
└── Modes

↓ (Aliased to)

Interaction Collection
└── Group (State)
└── Variable
└── Modes

↓ (Aliased to)

Semantic / Brand / Theme Collection
```

### First-Class Entities
- Collection
- Group
- Variable
- Mode
- Alias (Edge)
- Rule (Mapping logic)

---

## 6. High-Level Architecture

### Tech Stack
- **Figma Plugin API** (Variables API)
- **React + TypeScript**
- **React Flow** (Node Graph)
- **Zustand / Redux** (State)
- **JSON Schema Compiler**
- Built using **Cursor**

---

## 7. Phased Delivery Plan

---

## PHASE 0: System Design & Schema Definition

### Objective
Define a **canonical internal data model** independent of Figma UI.

### Deliverables
- Token Graph Schema
- Rule Definition Schema
- JSON Export Schema

### Data Models

```ts
Collection {
  id
  name
  type: primitive | semantic | interaction | theme
}

Group {
  id
  name
  collectionId
}

Variable {
  id
  name
  groupId
  modes: Mode[]
}

Mode {
  id
  name
  value | alias
}

Alias {
  fromVariableId
  toVariableId
  modeMap
|}
```

---

## PHASE 1: Read-Only Variable Visualizer (Foundation)

### Objective

Build a **Variable Visualizer clone** (read-only).

### Features

* Read all Figma Variables
* Render:

  * Collections as parent nodes
  * Groups as nested nodes
  * Variables as leaf nodes
  * Aliases as edges
* Highlight:

  * Broken aliases
  * Cross-collection links

### Figma APIs Used

* `figma.variables.getLocalVariableCollections()`
* `figma.variables.getVariableById()`

### Cursor Tasks

* Scaffold plugin (React + TS)
* Build graph renderer
* Parse variables → internal graph

---

## PHASE 2: Manual Alias Actions (Controlled Writes)

### Objective

Enable **safe, manual aliasing via UI**.

### Features

* Select source variable
* Select target variable
* Map modes (Light → Light, Hover → Default, etc.)
* Apply alias in bulk

### Guardrails

* Prevent circular aliases
* Prevent invalid mode mapping
* Visual diff preview before apply

### APIs Used

* `variable.setValueForMode()`
* `variable.setAlias()`

---

## PHASE 3: Rule Engine (Automation Core)

### Objective

Remove manual work using **rules**.

### Rule Examples

* "All Interaction/Hover map to Primitive/Default"
* "Dark mode aliases Dark primitives automatically"
* "States inherit from base group"

### Rule Types

* Group → Group
* Mode → Mode
* Collection → Collection

### Implementation

* Rules stored as JSON
* Deterministic rule evaluation
* Dry-run + Apply

```json
{
  "when": {
    "collection": "interaction",
    "group": "hover"
  },
  "then": {
    "aliasTo": "primitive/default"
  }
}
```

---

## PHASE 4: Batch Operations & Refactoring

### Objective

Operate on **thousands of tokens safely**.

### Features

* Apply rules to:

  * Selected collections
  * Selected groups
* Bulk re-alias
* Rollback support (session-based)

---

## PHASE 5: JSON Compiler & Export

### Objective

Export a **complete token graph**.

### Output

* Collections
* Groups
* Variables
* Modes
* Alias relationships
* Rules applied

### Use Cases

* Audits
* Versioning
* External pipelines
* Design system governance

---

## PHASE 6: Validation & Safety Layer

### Objective

Prevent bad token states.

### Validations

* Circular dependencies
* Missing modes
* Invalid aliases
* Orphan variables

### UX

* Inline warnings
* Rule errors
* Graph highlights

---

## PHASE 7 (Future): AI Assist Layer (Optional)

### Ideas

* Suggest rules based on patterns
* Detect redundant variables
* Recommend normalization
* Auto-group primitives

---

## 8. Success Metrics

* 90% reduction in manual aliasing
* <5 seconds for 1k variable mapping
* Zero circular alias bugs
* Designers trust automation

---

## 9. Risks & Mitigations

| Risk             | Mitigation           |
| ---------------- | -------------------- |
| Figma API limits | Chunk operations     |
| Performance      | Graph virtualization |
| User trust       | Dry-run + preview    |
| Complexity       | Strict schema        |

---

## 10. Why This Will Work

* Aligns with how **design systems actually scale**
* Treats tokens as **infrastructure**
* Uses **graph thinking**, not lists
* Built incremental, not monolithic
* Cursor-friendly architecture

---

## 11. Next Immediate Actions

1. Create repo
2. Scaffold Figma plugin
3. Implement Phase 0 schema
4. Build Phase 1 visualizer
5. Iterate weekly

---

## End of PRD
