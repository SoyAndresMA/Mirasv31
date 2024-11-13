// Ruta del fichero: /frontend/src/index.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { GlobalStateProvider } from './core/state/GlobalContext';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('No root element found in document');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <GlobalStateProvider>
      <App />
    </GlobalStateProvider>
  </React.StrictMode>
);

// Manejo de errores no capturados
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Uncaught error:', { message, source, lineno, colno, error });
  // Aquí podríamos enviar el error a un servicio de monitoreo
};

// Manejo de rechazos de promesas no capturados
window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Aquí podríamos enviar el error a un servicio de monitoreo
};