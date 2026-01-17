
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  const errorMsg = "Fatal Error: Root element #root not found in the DOM.";
  console.error(errorMsg);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">${errorMsg}</div>`;
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("React Initialization Error:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; text-align: center;">
        <h2 style="color: #ef4444;">Application Failed to Load</h2>
        <p style="color: #64748b;">${err instanceof Error ? err.message : 'Unknown Error'}</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer;">Reload System</button>
      </div>
    `;
  }
}
