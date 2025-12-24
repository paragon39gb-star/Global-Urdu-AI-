
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA with enhanced safety checks
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if we are in a valid origin and secure context for Service Workers
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';

    if (isSecure || isLocalhost) {
      // Using a simple relative path is the most robust way to avoid origin/URL issues
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('Urdu AI SW Registered successfully', reg.scope);
          reg.update();
        })
        .catch(err => {
          // Log only in dev or as a warning to prevent app crashing
          console.warn('Urdu AI SW Registration bypassed:', err.message);
        });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Critical Error: Root element not found in DOM.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
