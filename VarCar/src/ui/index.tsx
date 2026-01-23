import React from 'react';
import { createRoot } from 'react-dom/client';
import { ColorApp } from './ColorApp';

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Create React root and render the app
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ColorApp />
  </React.StrictMode>
);

// Notify the plugin code that UI is ready
window.parent.postMessage({ pluginMessage: { type: 'ready' } }, '*');
