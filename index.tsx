import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Hungers CRM: Nucleo cargado.");
  } catch (error) {
    console.error("Error crítico en el arranque:", error);
    container.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #fafafa; color: #18181b; text-align: center; font-family: sans-serif; padding: 20px;">
        <div>
          <h2 style="color: #000; font-weight: 900; margin-bottom: 10px; font-size: 24px; letter-spacing: -0.05em;">HUNGERS <span style="color: #88d43d;">CRM</span></h2>
          <p style="color: #71717a; font-size: 14px; margin-bottom: 20px;">Error de sistema al inicializar módulos internos.</p>
          <button onclick="location.reload()" style="background: #c1ff72; color: #000; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 900; cursor: pointer; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; shadow: 0 10px 15px -3px rgba(193, 255, 114, 0.3);">REINTENTAR ACCESO</button>
        </div>
      </div>
    `;
  }
}