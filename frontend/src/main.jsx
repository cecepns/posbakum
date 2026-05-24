import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // One-time cleanup: old SW cached index.html and broke Vite hashed assets after deploy
  const migrated = localStorage.getItem('sw-migrated-v3');
  if (!migrated) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    localStorage.setItem('sw-migrated-v3', '1');
  }

  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch {
    /* SW optional */
  }
}

if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    setupServiceWorker();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
