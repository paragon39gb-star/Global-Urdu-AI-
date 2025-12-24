
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safe Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check for localhost or HTTPS (Vercel provides HTTPS by default)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';

    if (isSecure || isLocalhost) {
      // Register using a simple relative string path to avoid URL constructor issues
      navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => {
          console.log('Urdu AI: PWA Ready (Service Worker Registered)');
          // Check for updates automatically
          reg.update();
        })
        .catch(err => {
          console.warn('Urdu AI: PWA registration skipped (Offline mode may be limited).');
        });
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Critical Error: Root element not found.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
