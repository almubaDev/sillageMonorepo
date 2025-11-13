# Documentación - Sillage Mobile

Bienvenido a la documentación del frontend móvil de Sillage.

## Índice de Documentos

### 🌍 Sistema de Internacionalización

- **[Sistema i18n del Frontend](./i18n_system.md)**
  - Tecnologías utilizadas (react-i18next, i18next)
  - Estructura de archivos y namespaces
  - Uso en componentes
  - Componentes especiales (LanguageSelector, useLanguageChange)
  - Formateo de fechas y números
  - Integración con backend

- **[Ejemplo: Agregar Francés](./i18n_example_french.md)**
  - Tutorial completo paso a paso
  - Archivos JSON de ejemplo para todos los namespaces
  - Código de configuración
  - Testing y validación

## Estructura del Proyecto

```
sillage-mobile/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── LanguageSelector.tsx
│   │   ├── ConfirmModal.tsx
│   │   └── ...
│   ├── hooks/                # Custom hooks
│   │   └── useLanguageChange.ts
│   ├── i18n/                 # Sistema de internacionalización
│   │   ├── index.ts
│   │   └── locales/          # Traducciones por idioma
│   │       ├── es/           # Español
│   │       └── en/           # Inglés
│   ├── screens/              # Pantallas principales
│   │   ├── Auth/
│   │   ├── Collection/
│   │   ├── History/
│   │   ├── Profile/
│   │   └── Recommend/
│   ├── services/             # Servicios API
│   └── navigation/           # Navegación
├── Documentation/            # Esta carpeta
├── App.tsx
└── package.json
```

## Pantallas de la Aplicación

### Autenticación
- **LoginScreen** - Inicio de sesión
- **RegisterScreen** - Registro de usuario

### Principales
- **ProfileScreen** - Perfil de usuario con selector de idioma
- **CollectionScreen** - Gestión de colección de perfumes
- **HistoryScreen** - Historial de recomendaciones
- **RecommendScreen** - Wizard de recomendación (8 pasos)
- **RecommendationResultScreen** - Resultado de recomendación

## Namespaces de Traducción

El sistema organiza las traducciones en 8 namespaces:

1. **common** - Textos comunes (botones, mensajes)
2. **auth** - Autenticación (login, registro)
3. **collection** - Gestión de perfumes
4. **profile** - Perfil de usuario
5. **history** - Historial
6. **recommend** - Wizard de recomendación
7. **result** - Resultado de recomendación
8. **components** - Componentes compartidos

## Idiomas Soportados

Actualmente la aplicación soporta:

- ✅ **Español (es)** - Idioma por defecto
- ✅ **Inglés (en)**
- ➕ **Agregar más** - Consulta la [documentación de i18n](./i18n_system.md)

## Agregar Nuevo Idioma

Para agregar un nuevo idioma:

1. **Frontend**: Crea archivos JSON en `src/i18n/locales/[codigo]/`
2. **Frontend**: Registra en `src/i18n/index.ts`
3. **Backend**: Crea `app/i18n/languages/[codigo].py`
4. ¡Listo! El sistema lo detectará automáticamente

Ver [ejemplo completo con francés](./i18n_example_french.md).

## Características Especiales

### ✨ Selector de Idioma Visual
Componente con banderas y nombres localizados de idiomas.

### 🔄 Cambio Dinámico
La app cambia de idioma instantáneamente sin recargar.

### 💾 Persistencia
El idioma seleccionado se guarda en AsyncStorage.

### 🌐 Google Maps Localizado
El mapa carga en el idioma seleccionado por el usuario.

### 🤖 IA en Múltiples Idiomas
Las recomendaciones de IA se generan en el idioma del usuario.

## Tecnologías Principales

- **React Native** - Framework móvil
- **Expo** - Tooling y desarrollo
- **TypeScript** - Tipado estático
- **react-i18next** - Internacionalización
- **React Navigation** - Navegación
- **AsyncStorage** - Persistencia local
- **date-fns** - Formateo de fechas

## Uso Básico de i18n

```typescript
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { t, i18n } = useTranslation('namespace');

  // Traducir texto
  const texto = t('clave');

  // Cambiar idioma
  i18n.changeLanguage('en');

  // Idioma actual
  const idioma = i18n.language;

  return <Text>{texto}</Text>;
}
```

## Mejores Prácticas

1. ✅ Usa namespaces para organizar traducciones
2. ✅ Keys descriptivas (ej: `login.emailPlaceholder`)
3. ✅ Evita texto hardcoded, siempre usa `t()`
4. ✅ Mantén consistencia entre idiomas
5. ✅ Prueba la app en todos los idiomas

## Testing

Para probar los idiomas:

1. Inicia la app
2. Ve a la pantalla de Perfil
3. Toca el selector de idioma
4. Selecciona un idioma diferente
5. Navega por la app para verificar las traducciones

## Recursos

- [react-i18next Docs](https://react.i18next.com/)
- [i18next Docs](https://www.i18next.com/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## Contacto

Para preguntas o contribuciones al sistema de documentación, por favor revisa los documentos específicos listados arriba.
