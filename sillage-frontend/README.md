# Sillage Frontend

Base inicial para el nuevo frontend de Sillage utilizando Next.js 14, TypeScript, Tailwind CSS y TanStack Query.

## Requisitos

- Node.js 18.17 o superior
- npm 9 o superior (o el gestor de paquetes de tu preferencia)

## Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo en `http://localhost:3000`.
- `npm run build`: genera la versión optimizada para producción.
- `npm run start`: ejecuta la compilación de producción.
- `npm run lint`: ejecuta ESLint con la configuración de Next.js.
- `npm run typecheck`: verifica los tipos con TypeScript sin emitir archivos.

## Configuración

1. Copia `.env.example` a `.env.local` y ajusta las variables necesarias.
2. Instala dependencias con `npm install`.
3. Ejecuta `npm run dev` para iniciar el desarrollo.

## Integración con el backend

El helper `apiFetch` en `src/lib/api.ts` centraliza las peticiones a la API FastAPI (`http://localhost:8000/api/v1` por defecto).
Puedes ajustar la variable de entorno `NEXT_PUBLIC_API_BASE_URL` para apuntar a otros entornos.

## Próximos pasos sugeridos

- Crear el diseño de páginas principales (onboarding, dashboard, colección de perfumes, recomendaciones).
- Implementar autenticación basada en JWT almacenados de forma segura (cookies httpOnly o secure storage).
- Sincronizar el sistema de diseño emocional definido en `Documentation/sillage_style_guide.md`.
- Configurar Storybook o Ladle para documentar componentes reutilizables.
- Preparar la base compartida de hooks y utilidades para React Native / Expo.
