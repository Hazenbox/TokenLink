# Variable Orchestrator - Figma Plugin

A minimal Figma plugin scaffold built with TypeScript, React, and Vite.

## 📁 Folder Structure

```
FigZag/
├── manifest.json              # Figma plugin manifest
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript config for UI
├── tsconfig.code.json         # TypeScript config for plugin code
├── vite.config.ts             # Vite bundler configuration
├── .gitignore                 # Git ignore rules
├── scripts/
│   └── inject-html.js        # Build script to inject UI HTML
├── src/
│   ├── code.ts                # Main plugin code (runs in Figma)
│   └── ui/
│       ├── index.html         # HTML template for UI
│       ├── index.tsx          # React entry point
│       └── App.tsx            # Main React component
└── dist/                      # Build output (created after build)
    ├── manifest.json
    ├── ui.html
    ├── code.js
    └── assets/
```

## 🚀 Step-by-Step Setup Instructions

### Prerequisites

Before you begin, make sure you have:
1. **Node.js** installed (version 18 or higher)
   - Check if you have it: Open Terminal and type `node --version`
   - If not installed: Download from [nodejs.org](https://nodejs.org/)

2. **Figma Desktop App** installed
   - Download from [figma.com/downloads](https://www.figma.com/downloads/)
   - The plugin will NOT work in Figma web browser - you need the desktop app

### Step 1: Install Dependencies

1. Open **Terminal** (on Mac: Press `Cmd + Space`, type "Terminal", press Enter)

2. Navigate to your project folder:
   ```bash
   cd /Users/upendranath.kaki/Desktop/Codes/FigZag
   ```

3. Install all required packages:
   ```bash
   npm install
   ```
   
   This will download all dependencies listed in `package.json`. Wait for it to finish (may take 1-2 minutes).

### Step 2: Build the Plugin

Run the build command to compile TypeScript and bundle the React UI:

```bash
npm run build
```

This will:
- Compile `src/code.ts` → `dist/code.js`
- Build React UI → `dist/ui.html` and assets
- Copy `manifest.json` to `dist/`
- Inject the UI HTML into the plugin code

You should see output like:
```
✓ Built successfully
✓ Injected UI HTML into code.js
```

### Step 3: Load Plugin in Figma

1. **Open Figma Desktop App** (not the web browser)

2. **Create or open a file** in Figma

3. **Open Plugins Menu:**
   - Go to: `Menu` → `Plugins` → `Development` → `Import plugin from manifest...`
   - OR use shortcut: `Cmd + /` (Mac) or `Ctrl + /` (Windows), then type "Import plugin"

4. **Select the manifest file:**
   - Navigate to: `/Users/upendranath.kaki/Desktop/Codes/FigZag/dist/manifest.json`
   - Click "Open"

5. **Run the plugin:**
   - Go to: `Menu` → `Plugins` → `Development` → `Variable Orchestrator`
   - OR use shortcut: `Cmd + /` → type "Variable Orchestrator"

6. **You should see:**
   - A sidebar panel opens on the right
   - Text displays: **"Variable Orchestrator – Plugin Loaded"**

## 🔄 Development Workflow

### Watch Mode (Auto-rebuild on changes)

While developing, use watch mode to automatically rebuild when you make changes:

```bash
npm run dev
```

This runs two watchers:
- Watches `src/code.ts` and recompiles on changes
- Watches `src/ui/` and rebuilds UI on changes

**Important:** After each rebuild, you need to **reload the plugin in Figma**:
- Right-click the plugin panel → `Reload plugin`
- OR close and reopen the plugin

### Manual Build

To build once:

```bash
npm run build
```

## 📝 Making Changes

### To change the UI text:

Edit `src/ui/App.tsx`:
```tsx
// Change the message here
setMessage(msg.message); // or set a custom message
```

Then rebuild:
```bash
npm run build
```

### To change plugin behavior:

Edit `src/code.ts`:
```typescript
// Add your plugin logic here
figma.ui.postMessage({
  type: 'plugin-loaded',
  message: 'Your custom message',
});
```

Then rebuild and reload in Figma.

## 🐛 Troubleshooting

### "Cannot find module" errors

Run:
```bash
npm install
```

### Plugin doesn't appear in Figma

1. Make sure you're using **Figma Desktop App** (not browser)
2. Check that `dist/manifest.json` exists
3. Try: `Menu` → `Plugins` → `Development` → `Import plugin from manifest...` again

### "Plugin failed to load" error

1. Check Terminal for build errors
2. Make sure `dist/code.js` and `dist/ui.html` exist
3. Rebuild: `npm run build`

### Changes not showing

1. Rebuild: `npm run build`
2. Reload plugin in Figma (right-click panel → Reload)

### TypeScript errors

Check that all files compile:
```bash
npm run build:code
npm run build:ui
```

## 📚 Key Files Explained

- **`manifest.json`**: Tells Figma about your plugin (name, entry points)
- **`src/code.ts`**: Runs in Figma's sandbox, can access Figma API
- **`src/ui/App.tsx`**: React component that renders the sidebar UI
- **`vite.config.ts`**: Configures how Vite bundles your React UI
- **`tsconfig.code.json`**: TypeScript settings for plugin code
- **`tsconfig.json`**: TypeScript settings for React UI

## ✅ Success Checklist

- [ ] Node.js installed (`node --version` works)
- [ ] Dependencies installed (`npm install` completed)
- [ ] Build successful (`npm run build` completed)
- [ ] `dist/` folder contains: `manifest.json`, `code.js`, `ui.html`
- [ ] Plugin loaded in Figma Desktop App
- [ ] Sidebar shows: "Variable Orchestrator – Plugin Loaded"

## 🎯 Next Steps

Now that you have a working plugin, you can:
1. Add Figma Variables API calls in `src/code.ts`
2. Build React UI components in `src/ui/App.tsx`
3. Add state management (Zustand/Redux) for Phase 1
4. Implement the graph visualizer (React Flow)

---

**Need help?** Check the [Figma Plugin API docs](https://www.figma.com/plugin-docs/)
