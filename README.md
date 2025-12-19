
# 🚀 Hungers CRM - Internal Sales Engine

CRM interno diseñado para **Hungers**, optimizado para la gestión de leads, pipeline de ventas y sincronización con GitHub.

## 🛠️ Tecnologías
- **Frontend:** React 19 + TypeScript + Tailwind CSS.
- **Gráficos:** Recharts.
- **IA:** Google Gemini API (`@google/genai`).
- **Sync:** GitHub REST API.

## 📦 Instalación Local
1. Clonar repositorio: `git clone https://github.com/hungerscol/CRM.git`
2. Instalar dependencias: `npm install`
3. Iniciar entorno dev: `npm run dev`

## 🌍 Despliegue en Vercel
1. Conecta este repositorio a tu cuenta de Vercel.
2. **Importante:** Añade la variable de entorno `API_KEY` en el panel de Vercel con tu llave de Google AI Studio.
3. Vercel detectará automáticamente el comando de build y publicará la app.

## 🔄 Sincronización GitHub
La base de datos se almacena en el archivo `deals.json` dentro de este repositorio. Para habilitar el auto-backup:
1. Genera un **Personal Access Token (PAT)** en GitHub con permisos `repo`.
2. Configúralo en la pestaña de **Perfil/Configuración** dentro del CRM.
3. Usa los botones **Push** o **Pull** para sincronizar.

---
*Propiedad de Hungers S.A.S - Uso Interno.*
