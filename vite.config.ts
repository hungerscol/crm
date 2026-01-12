
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Inyectamos la variable de entorno del sistema (Node.js) al código del cliente (Vite)
    // Esto evita el uso directo de process.env en el frontend, previniendo errores de compilación.
    'import.meta.env.VITE_API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html',
    },
  },
  server: {
    port: 3000,
  },
});
