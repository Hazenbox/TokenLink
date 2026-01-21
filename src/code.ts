// This file runs in the Figma plugin sandbox (not in the UI iframe)

// Show the plugin UI
figma.showUI(__html__, {
  width: 400,
  height: 600,
  title: 'Variable Orchestrator',
});

// Handle messages from the UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};

// Notify UI that plugin is loaded
figma.ui.postMessage({
  type: 'plugin-loaded',
  message: 'Variable Orchestrator – Plugin Loaded',
});
