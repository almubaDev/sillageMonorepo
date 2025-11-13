# Sillage - Sistema de Recomendación Inteligente de Perfumes

Sistema full-stack de recomendación de perfumes con IA (Google Gemini) que sugiere fragancias basándose en contexto (clima, ocasión, lugar, vestimenta).

## 🏗️ Estructura del Proyecto

El proyecto está organizado en tres aplicaciones principales:

```
newSillage/
├── sillage-backend/     # API FastAPI con Python
├── sillage-mobile/      # App React Native con Expo
└── sillage-admin/       # Panel administrativo Next.js
```

## 📚 Documentación

Cada aplicación tiene su propia carpeta de documentación:

### Backend (FastAPI + Python)
📁 **[sillage-backend/Documentation/](sillage-backend/Documentation/)**

- [README.md](sillage-backend/Documentation/README.md) - Guía principal del backend
- [ADMIN_SYSTEM.md](sillage-backend/Documentation/ADMIN_SYSTEM.md) - Sistema administrativo y permisos
- [INFORME_AVANCE.md](sillage-backend/Documentation/INFORME_AVANCE.md) - Informe general del proyecto
- [testing_guide.md](sillage-backend/Documentation/testing_guide.md) - Guía de testing del backend
- [i18n_system.md](sillage-backend/Documentation/i18n_system.md) - Sistema de internacionalización
- [SISTEMA_MULTILENGUAJE_COMPLETO.md](sillage-backend/Documentation/SISTEMA_MULTILENGUAJE_COMPLETO.md) - Documentación completa de i18n
- [sillage_technical_report.md](sillage-backend/Documentation/sillage_technical_report.md) - Reporte técnico

### Mobile (React Native + Expo)
📁 **[sillage-mobile/Documentation/](sillage-mobile/Documentation/)**

- [README.md](sillage-mobile/Documentation/README.md) - Guía principal de la app móvil
- [TESTING_REPORT.md](sillage-mobile/Documentation/TESTING_REPORT.md) - Reporte de testing mobile
- [TESTING_SUCCESS_FINAL.md](sillage-mobile/Documentation/TESTING_SUCCESS_FINAL.md) - Tests completados exitosamente
- [i18n_system.md](sillage-mobile/Documentation/i18n_system.md) - Sistema i18n del mobile
- [i18n_example_french.md](sillage-mobile/Documentation/i18n_example_french.md) - Ejemplo de traducción al francés

### Admin Panel (Next.js)
📁 **[sillage-admin/Documentation/](sillage-admin/Documentation/)**

- [ADMIN_PANEL_COMPLETE.md](sillage-admin/Documentation/ADMIN_PANEL_COMPLETE.md) - Panel admin completado
- [README_ADMIN.md](sillage-admin/Documentation/README_ADMIN.md) - Guía del panel administrativo
- [SISTEMA_COMPLETADO.md](sillage-admin/Documentation/SISTEMA_COMPLETADO.md) - Sistema administrativo completo

## 🚀 Inicio Rápido

### Backend
```bash
cd sillage-backend
source venv/bin/activate  # o venv\Scripts\activate en Windows
uvicorn app.main:app --reload
```
**Puerto:** http://localhost:8000

### Mobile
```bash
cd sillage-mobile
npm install
npm start
```

### Admin Panel
```bash
cd sillage-admin
npm install
npm run dev
```
**Puerto:** http://localhost:3001

## 🔑 Características Principales

- ✅ Recomendaciones de perfumes con IA (Google Gemini)
- ✅ Sistema de autenticación y permisos
- ✅ Soporte multilenguaje (ES, EN, FR, PT, IT, DE)
- ✅ Panel administrativo completo
- ✅ Gestión de colecciones de perfumes
- ✅ Sistema de suscripciones
- ✅ Historial de recomendaciones
- ✅ Integración con API del clima

## 🛠️ Stack Tecnológico

**Backend:**
- FastAPI (Python 3.13)
- PostgreSQL
- SQLAlchemy 2.0 (Async)
- Google Gemini AI
- JWT Authentication

**Mobile:**
- React Native
- Expo SDK 52
- TypeScript
- React Navigation
- i18next

**Admin:**
- Next.js 14
- TypeScript
- TailwindCSS
- React Query

## 📝 Licencia

Proyecto privado - Todos los derechos reservados
