
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
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; background: #c1ff72; color: #1a3a1a; text-align: center; font-family: sans-serif; padding: 20px;">
        <div style="background: white; padding: 40px; border-radius: 40px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #1a3a1a; font-weight: 900; margin-bottom: 10px; font-size: 24px; letter-spacing: -0.05em; text-transform: uppercase;">HUNGERS</h2>
          <p style="color: #88d43d; font-size: 14px; margin-bottom: 20px; font-weight: 700;">ERROR DE SISTEMA AL INICIALIZAR MÓDULOS INTERNOS</p>
          <button onclick="location.reload()" style="background: #1a3a1a; color: #c1ff72; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 900; cursor: pointer; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em;">REINTENTAR ACCESO</button>
        </div>
      </div>
    `;
  }
}
