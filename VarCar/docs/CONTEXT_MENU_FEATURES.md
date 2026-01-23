# Context Menu Features Guide

## Overview

FigZig now includes comprehensive right-click context menus for creating and managing collections, groups, modes, and variables directly from the plugin UI.

## Features Implemented

### Context Menu Improvements
- **Clean Design**: No emoji icons, compact sizing (6px padding)
- **Consistent Styling**: All options use regular text color (no red for delete)
- **Click Outside**: Menus automatically close when clicking outside
- **Keyboard Navigation**: Arrow keys, Enter, and Escape support

### Right-Click Actions by Context

#### 1. Empty Canvas (Graph View)
Right-click on the empty background to access:
- **Create Collection** - Opens modal to create a new collection

#### 2. Collection Header
Right-click on any collection header to access:
- **Add Mode** - Add a new mode to the collection (affects all variables)
- **Add Variable** - Create a new variable in this collection
- **Add Group** - Create a new group for organizing variables
- **Rename Collection** - Opens rename modal
- **Delete Collection** - Deletes collection and all its variables (with confirmation)

#### 3. Variable Node
Right-click on any variable to access:
- **Create Alias** - Opens alias modal to create variable reference
- **Rename Variable** - Opens rename modal
- **Delete Variable** - Deletes the variable (with confirmation)

#### 4. Mode (within Variable)
Right-click on any mode chip to access:
- **Create Alias** - Create alias for this specific mode
- **Rename Mode** - Opens rename modal (renames mode across entire collection)
- **Delete Mode** - Deletes the mode from collection (with confirmation)

#### 5. Group (Tree View)
Right-click on any group in tree view to access:
- **Add Variable** - Create a variable in this group
- **Delete Group** - Deletes all variables in the group (with confirmation)

### Modal Workflows

#### Create Collection
1. Right-click on canvas → "Create Collection"
2. Enter collection name
3. Select type (Primitive, Semantic, Interaction, Theme, Brand)
4. Click "Create Collection"

#### Create Mode
1. Right-click on collection → "Add Mode"
2. Enter mode name (e.g., "Dark", "Hover")
3. Click "Add Mode"
- Note: Modes are added to all variables in the collection

#### Create Variable
1. Right-click on collection or group → "Add Variable"
2. Enter variable name
3. Select existing group or create new group (optional)
4. Select variable type (Color, Number, String, Boolean)
5. Click "Create Variable"

#### Rename Any Entity
1. Right-click on collection/variable/mode → "Rename [Type]"
2. Edit the name in the modal (auto-selected for quick editing)
3. Click "Rename"

## Technical Details

### Files Modified
- `src/code.ts` - Backend handlers for CRUD operations
- `src/ui/App.tsx` - State management and handlers
- `src/ui/components/VariableGraphView.tsx` - Canvas context menu
- `src/ui/components/nodes/CollectionHeaderNode.tsx` - Removed plus button
- `src/ui/components/nodes/VariableNode.tsx` - Added context menu
- `src/ui/components/nodes/ModeNode.tsx` - Added context menu
- `src/ui/components/VariableTree.tsx` - Tree view context menus

### Files Created
- `src/ui/components/ContextMenu.tsx` - Reusable context menu
- `src/ui/components/CreateCollectionModal.tsx`
- `src/ui/components/CreateModeModal.tsx`
- `src/ui/components/CreateVariableModal.tsx`
- `src/ui/components/CreateGroupModal.tsx`
- `src/ui/components/RenameModal.tsx`

## Usage Tips

1. **Quick Access**: Right-click is the primary way to create and manage entities
2. **Validation**: All modals validate input before submission
3. **Confirmations**: Destructive operations (delete) require confirmation
4. **Auto-refresh**: Graph automatically updates after any operation
5. **Notifications**: Success/error messages appear in top-right corner

## Keyboard Shortcuts in Context Menus

- **Arrow Up/Down**: Navigate menu items
- **Enter**: Select highlighted item
- **Escape**: Close menu

## Error Handling

All operations include comprehensive error handling:
- Duplicate name detection
- Invalid character validation
- Missing entity checks
- Figma API error reporting
- User-friendly error messages
