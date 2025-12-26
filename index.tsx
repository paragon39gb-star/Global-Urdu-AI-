
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Safe Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';

    if (isSecure || isLocalhost) {
      // Using relative path to avoid path-based 404 errors in various hosting environments
      navigator.serviceWorker.register('./sw.js')
        .then(() => {
          // Service Worker registered successfully
        })
        .catch(() => {
          // Silently fail to avoid cluttered console logs
        });
    }
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
