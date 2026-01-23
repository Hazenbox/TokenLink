# ⚡ Quick Start Guide - FigZig

> Get up and running in 5 minutes

---

## 🎯 The Only 2 Files You Need to Know

### 1. **`src/ui/App.tsx`** - What Users See
Build your interface here. Add buttons, inputs, lists, etc.

### 2. **`src/code.ts`** - What the Plugin Does
Write Figma API calls here. Read/create/modify variables, layers, etc.

---

## 🚀 Daily Workflow

### 1. Edit Your Code
```bash
# Open these files in your editor:
src/ui/App.tsx    # Add UI components
src/code.ts       # Add Figma logic
```

### 2. Build
```bash
npm run build
```

### 3. Test in Figma
- Close plugin sidebar if open
- Reopen: `Plugins` → `Development` → `FigZig` → `Open FigZig`

---

## 💬 Communication Between UI and Plugin

### Send Message from UI to Plugin:
```tsx
// In src/ui/App.tsx
window.parent.postMessage({ 
  pluginMessage: { 
    type: 'do-something',
    data: { foo: 'bar' }
  } 
}, '*');
```

### Handle Message in Plugin:
```typescript
// In src/code.ts
figma.ui.onmessage = (msg) => {
  if (msg.type === 'do-something') {
    console.log(msg.data); // { foo: 'bar' }
    // Do Figma API stuff here
  }
};
```

### Send Response Back to UI:
```typescript
// In src/code.ts
figma.ui.postMessage({
  type: 'response',
  data: { result: 'success' }
});
```

### Handle Response in UI:
```tsx
// In src/ui/App.tsx
React.useEffect(() => {
  window.onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (msg.type === 'response') {
      console.log(msg.data); // { result: 'success' }
    }
  };
}, []);
```

---

## 📋 Common Figma API Patterns

### Get All Variables:
```typescript
const collections = figma.variables.getLocalVariableCollections();
```

### Get Variable by ID:
```typescript
const variable = figma.variables.getVariableById('id-here');
```

### Create a Variable:
```typescript
const collection = collections[0];
const newVariable = figma.variables.createVariable(
  'MyVariable',
  collection,
  'COLOR'
);
```

### Get Current Selection:
```typescript
const selection = figma.currentPage.selection;
```

### Close Plugin:
```typescript
figma.closePlugin('Done!'); // Shows success message
```

---

## 🐛 Debugging

### View Console Logs:
1. Open plugin in Figma
2. Right-click on plugin UI → `Inspect`
3. Console tab shows logs from `src/ui/App.tsx`
4. For `src/code.ts` logs, check Figma's developer console

### Common Issues:

**UI is blank**
- Check browser console for errors
- Make sure you ran `npm run build`
- Try rebuilding: `npm run build`

**Changes not showing**
- Did you rebuild? `npm run build`
- Did you reload the plugin in Figma?
- Try closing Figma completely and reopening

**TypeScript errors**
- Check the terminal output from `npm run build`
- Fix any type errors shown

---

## 📦 Adding a New Library

```bash
# Example: Add a UI component library
npm install @radix-ui/react-dialog

# It auto-updates package.json
# Then use it in src/ui/App.tsx:
import * as Dialog from '@radix-ui/react-dialog';
```

---

## 🎨 Styling Tips

### Option 1: Inline Styles (Current)
```tsx
<div style={{ padding: '24px', color: '#333' }}>
  Content
</div>
```

### Option 2: CSS in index.html
```html
<!-- In src/ui/index.html -->
<style>
  .button {
    padding: 8px 16px;
    background: #18a0fb;
    color: white;
    border: none;
    border-radius: 4px;
  }
</style>
```

### Option 3: CSS Modules (Add Later)
Install a CSS-in-JS library like styled-components or emotion

---

## 🔥 Hot Tips

### Tip 1: Use TypeScript!
```typescript
// Define message types
type Message = 
  | { type: 'list-variables' }
  | { type: 'create-variable', name: string };

// Get autocomplete and type safety
figma.ui.onmessage = (msg: Message) => {
  // TypeScript knows what properties exist!
};
```

### Tip 2: Error Handling
```typescript
figma.ui.onmessage = async (msg) => {
  try {
    // Your code here
    figma.ui.postMessage({ type: 'success' });
  } catch (error) {
    figma.ui.postMessage({ 
      type: 'error', 
      message: error.message 
    });
  }
};
```

### Tip 3: Loading States
```tsx
const [loading, setLoading] = useState(false);

const handleClick = () => {
  setLoading(true);
  window.parent.postMessage({ 
    pluginMessage: { type: 'do-work' } 
  }, '*');
};

// In onmessage:
if (msg.type === 'done') {
  setLoading(false);
}

return <button disabled={loading}>
  {loading ? 'Loading...' : 'Click Me'}
</button>
```

---

## 📂 Project Structure Quick View

```
FigZig/
├── 🎯 START HERE
│   ├── src/ui/App.tsx      ← Build UI
│   └── src/code.ts         ← Figma logic
│
├── 📖 Documentation
│   ├── README.md           ← Setup instructions
│   ├── docs/
│   │   ├── GUIDE.md        ← Complete file guide
│   │   ├── QUICK_START.md  ← This file
│   │   └── PRD_Figma_Variables_Automation.md
│
├── ⚙️ Configuration (Don't Touch)
│   ├── manifest.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.code.json
│   ├── vite.config.ts
│   └── build-plugin.js
│
└── 📦 Auto-Generated (Ignored)
    ├── dist/
    └── node_modules/
```

---

## ✅ Next Steps

1. **Read this:** `docs/GUIDE.md` for complete file explanations
2. **Try this:** Add a button that logs "Hello" to console
3. **Build this:** Implement Phase 1 from the PRD (Variable Visualizer)

---

## 🆘 Need Help?

- **Figma API:** https://www.figma.com/plugin-docs/
- **Plugin Examples:** https://www.figma.com/plugin-docs/samples/
- **React Docs:** https://react.dev/

---

**Remember:** Focus on `App.tsx` and `code.ts`. That's it! 🎉
