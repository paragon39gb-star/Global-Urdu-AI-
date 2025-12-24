
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using a relative path 'sw.js' instead of '/sw.js' ensures the Service Worker 
    // is registered against the current origin, avoiding errors in proxied 
    // environments like Google AI Studio.
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Chat GRC SW Registered', reg.scope))
      .catch(err => console.log('Chat GRC SW Registration Failed', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
