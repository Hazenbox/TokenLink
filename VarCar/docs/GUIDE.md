# 🎓 Complete Beginner's Guide to FigZig Plugin

## Table of Contents
1. [Project Structure](#project-structure)
2. [Essential Files (Edit Often)](#essential-files)
3. [Secondary Files (Edit Occasionally)](#secondary-files)
4. [Configuration Files (Usually Don't Touch)](#configuration-files)
5. [Helper Files (Can Ignore)](#helper-files)
6. [Documentation Files](#documentation-files)
7. [What Can You Safely Ignore?](#what-to-ignore)
8. [Daily Workflow](#daily-workflow)
9. [Adding Your First Feature](#adding-your-first-feature)

---

## 📁 Project Structure

```
FigZig/
├── 📖 Documentation
│   ├── README.md                      # Installation & usage guide
│   ├── GUIDE.md                       # This file - beginner's guide
│   └── PRD_Figma_Variables_Automation.md  # Product requirements
│
├── 🎯 Core Plugin Files (YOU EDIT THESE)
│   ├── manifest.json                  # Plugin ID card for Figma
│   └── src/
│       ├── code.ts                    # Plugin logic (Figma API)
│       ├── globals.d.ts               # TypeScript definitions
│       └── ui/
│           ├── App.tsx                # UI interface (React)
│           ├── index.tsx              # React entry point
│           └── index.html             # HTML shell
│
├── ⚙️ Build & Configuration (RARELY TOUCH)
│   ├── package.json                   # Dependencies & scripts
│   ├── package-lock.json              # Locked dependency versions
│   ├── tsconfig.json                  # TypeScript config (UI)
│   ├── tsconfig.code.json             # TypeScript config (plugin)
│   ├── vite.config.ts                 # Vite bundler config
│   ├── build-plugin.js                # Custom build script
│   └── .gitignore                     # Git ignore rules
│
├── 📦 Generated (AUTO-CREATED ON BUILD)
│   ├── dist/                          # Built plugin files
│   │   ├── code.js                    # Final plugin code
│   │   └── ui/
│   │       └── index.html             # Built UI (inlined)
│   └── node_modules/                  # Installed dependencies
```

---

## 🔥 Essential Files (Edit Often)

### 1. **`src/ui/App.tsx`** ⭐⭐⭐

**What it is:** Your plugin's visual interface (what users see)

**Plain English:** This is like the "face" of your plugin. It's a React component that defines what appears in the Figma sidebar. Right now it just shows "FigZig – Plugin Loaded" with some styling.

**You'll edit this to:**
- Add buttons, inputs, dropdowns, lists
- Change colors, layout, typography
- Add the actual features users interact with
- Handle user input and send messages to plugin code

**Example structure:**
```tsx
const App: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1>FigZig – Plugin Loaded</h1>
      {/* Add your UI components here */}
    </div>
  );
};
```

**When you'll edit:** EVERY DAY - This is where you build features

---

### 2. **`src/code.ts`** ⭐⭐⭐

**What it is:** The "brain" of your plugin that talks to Figma

**Plain English:** This file runs in Figma's environment and can access all Figma data (layers, variables, styles, etc.). It opens the UI and communicates with it. Think of it as the "backend" of your plugin.

**You'll edit this to:**
- Read Figma variables, layers, styles
- Create/modify/delete Figma elements
- Respond to messages from the UI
- Do the actual work with Figma's API
- Send data back to the UI

**Current structure:**
```typescript
// Opens the UI sidebar
figma.showUI(__html__, { width: 400, height: 300 });

// Listen for messages from UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'ready') {
    console.log('UI is ready');
  }
};
```

**Common patterns you'll add:**
```typescript
// Get all variable collections
const collections = figma.variables.getLocalVariableCollections();

// Send data to UI
figma.ui.postMessage({ type: 'variables', data: collections });

// Close the plugin
figma.closePlugin();
```

**When you'll edit:** EVERY DAY - This is where you write Figma logic

---

### 3. **`manifest.json`** ⭐⭐

**What it is:** The "ID card" for your plugin

**Plain English:** This tells Figma who your plugin is, what it's called, and where to find its files. Figma reads this file first when you import the plugin.

**Current content:**
```json
{
  "name": "FigZig",
  "id": "figzig-plugin",
  "api": "1.0.0",
  "main": "dist/code.js",
  "editorType": ["figma"],
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": ["none"]
  },
  "menu": [
    {
      "name": "Open FigZig",
      "command": "open"
    }
  ]
}
```

**You'll edit this to:**
- Change plugin name/description
- Add multiple menu commands
- Request permissions (network, clipboard)
- Add keyboard shortcuts
- Support FigJam or other editors

**Example - Adding a new menu item:**
```json
"menu": [
  {
    "name": "Open FigZig",
    "command": "open"
  },
  {
    "name": "Export Variables",
    "command": "export"
  }
]
```

**When you'll edit:** OCCASIONALLY - When adding features that need new commands

---

## 📝 Secondary Files (Edit Occasionally)

### 4. **`src/ui/index.tsx`**

**What it is:** The "glue" that connects React to the HTML page

**Plain English:** This file takes your `App.tsx` component and puts it into the webpage. It also sends a "ready" message to the plugin code.

**Current structure:**
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);

// Tell plugin code the UI is ready
window.parent.postMessage({ pluginMessage: { type: 'ready' } }, '*');
```

**When you'll edit:**
- Adding global React context providers
- Setting up state management (Redux, Zustand)
- Adding error boundaries

**95% of the time:** Leave it as-is

---

### 5. **`src/ui/index.html`**

**What it is:** The HTML skeleton for your UI

**Plain English:** This is the basic HTML page that holds your React app. It has a `<div id="root">` where React renders your `App.tsx`.

**Current structure:**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>FigZig</title>
    <style>
      /* Global CSS */
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
```

**When you'll edit:**
- Change page `<title>`
- Add global fonts (Google Fonts, etc.)
- Add global CSS reset
- Include external stylesheets

**Most of the time:** Leave it alone

---

## ⚙️ Configuration Files (Usually Don't Touch)

### 6. **`package.json`**

**What it is:** List of all tools, libraries, and scripts

**Plain English:** Like a shopping list that tells npm "I need React, TypeScript, Vite" etc. Also defines commands like `npm run build`.

**Key sections:**
```json
{
  "name": "figzig",
  "version": "0.1.0",
  "scripts": {
    "build": "npm run build:ui && npm run build:code && node build-plugin.js",
    "build:ui": "vite build",
    "build:code": "tsc --project tsconfig.code.json"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.90.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

**When you'll edit:**
- Installing new libraries: `npm install <library-name>`
- Adding custom scripts
- Changing version number

**How to add a library:**
```bash
npm install library-name
# Automatically updates package.json
```

---

### 7. **`tsconfig.json`** (UI TypeScript Config)

**What it is:** TypeScript compiler settings for UI code

**Plain English:** Tells TypeScript how to check your React/UI code for errors. Like grammar rules for your code.

**Key settings:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src/ui/**/*"]
}
```

**When you'll edit:** Almost never. These settings work great.

**IF you need to:** Maybe to add path aliases or change strictness

---

### 8. **`tsconfig.code.json`** (Plugin TypeScript Config)

**What it is:** TypeScript compiler settings for plugin code

**Plain English:** Same as above, but for `src/code.ts`. Different settings because it runs in Figma's environment, not a browser.

**Key settings:**
```json
{
  "compilerOptions": {
    "target": "ES2019",
    "lib": ["ES2019"],
    "strict": true
  },
  "include": ["src/code.ts", "src/globals.d.ts"]
}
```

**When you'll edit:** Never, unless you're doing advanced Figma API stuff

---

### 9. **`vite.config.ts`**

**What it is:** Vite bundler configuration

**Plain English:** Vite takes your React code and packages it into files Figma can use. This file controls that process.

**Key settings:**
```typescript
export default defineConfig({
  root: path.resolve(__dirname, 'src/ui'),
  build: {
    outDir: path.resolve(__dirname, 'dist/ui'),
  },
  plugins: [
    react(),
    viteSingleFile()  // Bundles everything into one file
  ]
});
```

**When you'll edit:**
- Adding Vite plugins
- Changing build output location
- Adding path aliases

**Most of the time:** Leave it as-is

---

### 10. **`build-plugin.js`**

**What it is:** Custom script that combines everything

**Plain English:** After Vite builds the UI into HTML, this script takes that HTML and embeds it into `code.js` by replacing `__html__` with the actual HTML content.

**What it does:**
1. Reads `dist/ui/index.html` (built React app)
2. Reads `dist/code.js` (compiled plugin code)
3. Replaces `__html__` in code.js with the actual HTML
4. Saves the final `code.js`

**When you'll edit:** Never, unless the build process breaks

**How it works:**
```javascript
const html = fs.readFileSync('dist/ui/index.html', 'utf8');
let code = fs.readFileSync('dist/code.js', 'utf8');
code = code.replace('__html__', `\`${escapedHtml}\``);
fs.writeFileSync('dist/code.js', code);
```

---

## 🔧 Helper Files (Can Ignore)

### 11. **`src/globals.d.ts`**

**What it is:** TypeScript type declarations

**Plain English:** Tells TypeScript "yes, `__html__` exists, don't show an error." It's technical glue.

```typescript
declare const __html__: string;
```

**When you'll edit:** Never. This is set up correctly.

---

### 12. **`.gitignore`**

**What it is:** List of files Git should ignore

**Plain English:** Tells Git "don't track `node_modules`, `dist`, or log files." Keeps your repository clean.

```
node_modules/
dist/
*.log
.DS_Store
```

**When you'll edit:** Rarely, only if you want to ignore additional files

---

### 13. **`package-lock.json`**

**What it is:** Exact versions of all dependencies

**Plain English:** When you run `npm install`, npm creates this file to remember the *exact* versions of everything. This ensures everyone gets the same versions.

**When you'll edit:** ❌ **NEVER** - This is auto-generated by npm

**What to do with it:** Commit it to Git so everyone has the same versions

---

## 📖 Documentation Files

### 14. **`README.md`**

**What it is:** User guide for the plugin

**Contains:**
- Installation instructions
- How to build and run
- Step-by-step Figma setup
- Troubleshooting guide
- Project structure overview

**When you'll edit:**
- After adding new features
- Updating installation steps
- Adding troubleshooting tips

---

### 15. **`PRD_Figma_Variables_Automation.md`**

**What it is:** Product Requirements Document (your master plan)

**Contains:**
- Problem statement
- Product vision
- Phased delivery plan (Phase 0-7)
- Feature specifications
- Success metrics

**When you'll edit:**
- Planning new features
- Marking phases complete
- Updating requirements

---

### 16. **`GUIDE.md`** (This File)

**What it is:** Beginner's guide to the codebase

**Contains:**
- Explanation of every file
- What to edit vs. ignore
- Daily workflow tips
- File organization

**When you'll edit:** When onboarding new developers

---

## 🚫 What to Ignore?

### ✅ **COMPLETELY IGNORE (Auto-generated or stable):**

| File | Why Ignore |
|------|------------|
| `package-lock.json` | Auto-generated by npm |
| `src/globals.d.ts` | Technical TypeScript glue |
| `build-plugin.js` | Works perfectly as-is |
| `tsconfig.json` | Pre-configured correctly |
| `tsconfig.code.json` | Pre-configured correctly |
| `vite.config.ts` | Already optimized |
| `.gitignore` | Has everything you need |
| `dist/` folder | Auto-generated on build |
| `node_modules/` folder | Auto-generated on install |

### ⚠️ **RARELY EDIT:**

| File | Edit Only When... |
|------|-------------------|
| `src/ui/index.tsx` | Adding global React setup |
| `src/ui/index.html` | Changing title or adding fonts |
| `package.json` | Installing new libraries |
| `manifest.json` | Adding commands/permissions |

---

## 🚀 Daily Workflow

### **Where You'll Spend Your Time:**

#### **90% - Core Development:**
```
src/ui/App.tsx     ← Build UI components, add features
src/code.ts        ← Write Figma API logic
```

#### **5% - Configuration:**
```
manifest.json      ← Update plugin metadata
```

#### **5% - Documentation:**
```
README.md          ← Document features
PRD_Figma_Variables_Automation.md  ← Track progress
```

---

## 💡 Adding Your First Feature

### Example: Add a Button to List Variables

#### **Step 1: Edit UI (`src/ui/App.tsx`)**

```tsx
import React, { useState } from 'react';

const App: React.FC = () => {
  const [variables, setVariables] = useState<string[]>([]);

  const handleListVariables = () => {
    // Send message to plugin code
    window.parent.postMessage({ 
      pluginMessage: { type: 'list-variables' } 
    }, '*');
  };

  // Listen for messages from plugin code
  React.useEffect(() => {
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg.type === 'variables-list') {
        setVariables(msg.data);
      }
    };
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1>FigZig</h1>
      <button onClick={handleListVariables}>
        List Variables
      </button>
      <ul>
        {variables.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
      </ul>
    </div>
  );
};
```

#### **Step 2: Handle in Plugin Code (`src/code.ts`)**

```typescript
figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'list-variables') {
    // Get all variable collections
    const collections = figma.variables.getLocalVariableCollections();
    
    // Extract variable names
    const variableNames = collections.flatMap(collection => {
      return collection.variableIds.map(id => {
        const variable = figma.variables.getVariableById(id);
        return variable?.name || 'Unknown';
      });
    });
    
    // Send back to UI
    figma.ui.postMessage({
      type: 'variables-list',
      data: variableNames
    });
  }
};
```

#### **Step 3: Build and Test**

```bash
npm run build
```

Then reload the plugin in Figma and click the button!

---

## 🗂️ File Priority Cheat Sheet

```
🔥🔥🔥 EDIT DAILY:
├── src/ui/App.tsx
└── src/code.ts

🔥🔥 EDIT WEEKLY:
├── manifest.json
└── README.md

🔥 EDIT RARELY:
├── src/ui/index.tsx
├── src/ui/index.html
├── package.json
└── PRD_Figma_Variables_Automation.md

❄️ DON'T EDIT:
├── package-lock.json
├── src/globals.d.ts
├── build-plugin.js
├── tsconfig.json
├── tsconfig.code.json
├── vite.config.ts
└── .gitignore
```

---

## 🎯 Quick Reference

### **Build Commands:**
```bash
npm install          # Install dependencies
npm run build        # Build everything
npm run build:ui     # Build UI only
npm run build:code   # Build plugin code only
```

### **File Locations:**
```
UI Code:        src/ui/App.tsx
Plugin Logic:   src/code.ts
Config:         manifest.json
Built Output:   dist/code.js
```

### **Communication Flow:**
```
App.tsx (UI)  →  window.parent.postMessage()  →  code.ts (Plugin)
                                                      ↓
                                                  Figma API
                                                      ↓
App.tsx (UI)  ←  figma.ui.postMessage()  ←  code.ts (Plugin)
```

---

## 📚 Learning Resources

- **Figma Plugin API:** https://www.figma.com/plugin-docs/
- **React Documentation:** https://react.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Vite Guide:** https://vitejs.dev/guide/

---

## 🎉 You're Ready!

Focus on `src/ui/App.tsx` and `src/code.ts` - that's 90% of plugin development. Everything else is just infrastructure that's already set up for you!

Happy coding! 🚀
