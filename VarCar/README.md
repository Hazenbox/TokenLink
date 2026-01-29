# Token Link - Figma Plugin

A Figma plugin built with TypeScript, React, and Vite for automating Figma Variables orchestration.

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK_START.md)** - Get coding in 5 minutes ⚡
- **[Complete Beginner's Guide](./docs/GUIDE.md)** - Understand every file 🎓
- **[Export & Import Guide](./docs/EXPORT_IMPORT_GUIDE.md)** - Round-trip workflows & backup 💾
- **[Figma Native Import](./docs/FIGMA_NATIVE_IMPORT.md)** - Import Figma's variable exports 📥
- **[Project Structure](./PROJECT_STRUCTURE.md)** - Visual file organization 📂
- **[Product Requirements (PRD)](./docs/PRD_Figma_Variables_Automation.md)** - Master plan 📋
- **[Documentation Hub](./docs/README.md)** - All docs organized 🗺️

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your computer:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - To check if installed, run in terminal: `node --version`

2. **npm** (comes with Node.js)
   - To check if installed, run in terminal: `npm --version`

3. **Figma Desktop App**
   - Download from: https://www.figma.com/downloads/
   - Plugin development requires the desktop app (not the browser version)

## 📁 Project Structure

```
Token Link/
├── manifest.json              # Figma plugin configuration
├── package.json               # npm dependencies and scripts
├── tsconfig.json              # TypeScript configuration for UI
├── tsconfig.code.json         # TypeScript configuration for plugin code
├── vite.config.ts             # Vite bundler configuration
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
├── src/
│   ├── code.ts                # Plugin main code (runs in Figma sandbox)
│   └── ui/
│       ├── index.html         # HTML entry point for React UI
│       ├── index.tsx          # React application entry point
│       └── App.tsx            # Main React component
└── dist/                      # Build output (auto-generated)
    ├── code.js                # Compiled plugin code
    └── ui/
        ├── index.html         # Built UI HTML file
        └── assets/            # Bundled JavaScript and assets
            └── index.js
```

## 🚀 Getting Started

### Step 1: Install Dependencies

Open your terminal (Terminal on Mac, Command Prompt or PowerShell on Windows) and navigate to the project folder:

```bash
cd /Users/upendranath.kaki/Desktop/Codes/FigZig
```

Install all required dependencies:

```bash
npm install
```

This will install:
- React and React DOM (for the UI)
- TypeScript (for type safety)
- Vite (for bundling the UI)
- Figma plugin type definitions
- Other development dependencies

### Step 2: Build the Plugin

Build both the plugin code and the UI:

```bash
npm run build
```

This command will:
1. Compile `src/code.ts` to `dist/code.js` using TypeScript
2. Bundle the React UI from `src/ui/` to `dist/ui/` using Vite

You should see output indicating successful compilation. The `dist/` folder will be created with all the necessary files.

### Step 3: Load the Plugin in Figma

1. **Open Figma Desktop App**
   - Launch the Figma desktop application on your computer

2. **Open any Figma file** (or create a new one)
   - You need to have a file open to load and test plugins

3. **Access the Plugins Menu**
   - On Mac: `Plugins` → `Development` → `Import plugin from manifest...`
   - On Windows: `Menu` → `Plugins` → `Development` → `Import plugin from manifest...`

4. **Select the manifest.json file**
   - Navigate to your project folder
   - Select the `manifest.json` file in the root directory
   - Click "Open"

5. **Figma will confirm the plugin is loaded**
   - You should see a success message
   - The plugin will appear in your Development plugins list

### Step 4: Run the Plugin

1. With your Figma file still open, go to:
   - `Plugins` → `Development` → `FigZig` → `Open FigZig`

2. A sidebar will appear on the right side of your Figma window

3. You should see the text: **"FigZig – Plugin Loaded"**
   - With a subtitle: "Ready to automate your Figma variables"

🎉 **Congratulations!** Your plugin is now running in Figma!

## 🛠️ Development Workflow

### Making Changes

When you make changes to the code, you need to rebuild the plugin:

```bash
npm run build
```

After rebuilding:
1. In Figma, close the plugin sidebar if it's open
2. Re-run the plugin from the menu: `Plugins` → `Development` → `FigZig`
3. Your changes will be reflected

### Development Mode (Watch Mode)

For faster development, you can use watch mode which automatically rebuilds when files change:

```bash
npm run dev
```

This will watch for changes in your source files and rebuild automatically. You still need to manually reload the plugin in Figma to see changes.

### Project Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build both plugin code and UI for production |
| `npm run build:code` | Build only the plugin code (code.ts → code.js) |
| `npm run build:ui` | Build only the React UI |
| `npm run dev` | Watch mode - rebuilds on file changes |

## 📝 How It Works

### Architecture

The plugin consists of two main parts:

1. **Plugin Code** (`src/code.ts`)
   - Runs in Figma's sandbox environment
   - Has access to the Figma API
   - Can manipulate the document
   - Shows the UI and communicates with it

2. **UI Code** (`src/ui/`)
   - React application that runs in an iframe
   - Displays the visual interface
   - Communicates with plugin code via `postMessage` API
   - Cannot directly access Figma API

```
┌─────────────────────────────────────┐
│         Figma Desktop App           │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Plugin Code │  │  UI Sidebar  │  │
│  │  (code.ts)  │◄─┤  (React UI)  │  │
│  │             │─►│              │  │
│  │ Figma API   │  │  User Input  │  │
│  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

### Communication Flow

1. User clicks the plugin menu item in Figma
2. Figma executes `code.ts` (plugin code)
3. Plugin code shows the UI using `figma.showUI(__html__)`
4. React UI loads and renders the sidebar
5. UI sends a "ready" message to plugin code
6. Plugin code and UI can now communicate bidirectionally

## 🔧 Troubleshooting

### Plugin doesn't appear in Figma

- Make sure you're using **Figma Desktop App** (not browser)
- Verify the `manifest.json` file was imported correctly
- Try reimporting: `Plugins` → `Development` → `Import plugin from manifest...`

### Build fails

- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors in the terminal output

### UI doesn't display or shows blank screen

- Check the browser console in Figma:
  - Right-click on the plugin UI → `Inspect`
  - Look for errors in the Console tab
- Verify the build completed successfully
- Ensure `dist/code.js` and `dist/ui/index.html` exist

### Changes don't appear after rebuilding

- Make sure you ran `npm run build` after making changes
- Close and reopen the plugin in Figma
- If still not working, try:
  1. Close Figma completely
  2. Reopen Figma and your file
  3. Re-import the plugin manifest

### Permission errors during npm install

If you see permission errors on Mac/Linux:
- Try using `sudo npm install` (not recommended)
- Better: Fix npm permissions following [official guide](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally)

## 📚 Next Steps

Now that you have a working plugin, you can:

1. **Customize the UI**: Edit `src/ui/App.tsx` to change the interface
2. **Add functionality**: Modify `src/code.ts` to interact with Figma's API
3. **Explore Figma API**: Check the [Figma Plugin API documentation](https://www.figma.com/plugin-docs/)
4. **Implement features**: Follow the PRD to build the Variable Orchestrator features

## 📖 Resources

- [Figma Plugin API Documentation](https://www.figma.com/plugin-docs/)
- [Figma Plugin Samples](https://www.figma.com/plugin-docs/samples/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the Figma plugin documentation
3. Check the browser console for errors (Right-click UI → Inspect)
4. Verify all dependencies are installed correctly

---

**Plugin Status**: ✅ Ready for Development

**Plugin Name**: FigZig

**Next Phase**: Implement Phase 0 (System Design & Schema Definition) from the PRD
