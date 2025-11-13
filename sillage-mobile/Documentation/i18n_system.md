# Sistema de Internacionalización - Frontend

Este documento describe el sistema de internacionalización (i18n) implementado en la aplicación móvil Sillage.

## Tecnologías Utilizadas

- **react-i18next**: Framework de internacionalización para React
- **i18next**: Motor de internacionalización
- **AsyncStorage**: Persistencia del idioma seleccionado

## Estructura de Archivos

```
sillage-mobile/src/i18n/
├── index.ts                      # Configuración principal de i18next
├── locales/                      # Traducciones por idioma
│   ├── es/                       # Español
│   │   ├── common.json
│   │   ├── auth.json
│   │   ├── collection.json
│   │   ├── profile.json
│   │   ├── history.json
│   │   ├── recommend.json
│   │   ├── result.json
│   │   └── components.json
│   └── en/                       # Inglés
│       ├── common.json
│       ├── auth.json
│       ├── collection.json
│       ├── profile.json
│       ├── history.json
│       ├── recommend.json
│       ├── result.json
│       └── components.json
```

## Namespaces

Las traducciones están organizadas en **namespaces** por funcionalidad:

- **common**: Textos comunes (botones, mensajes generales)
- **auth**: Pantallas de autenticación (login, registro)
- **collection**: Gestión de colección de perfumes
- **profile**: Pantalla de perfil de usuario
- **history**: Historial de recomendaciones
- **recommend**: Wizard de recomendación (8 pasos)
- **result**: Pantalla de resultado de recomendación
- **components**: Componentes compartidos (modales, cards)

## Uso en Componentes

### Importar el Hook

```typescript
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { t, i18n } = useTranslation('namespace');

  return <Text>{t('clave')}</Text>;
}
```

### Cambiar Idioma

```typescript
// Cambiar a inglés
i18n.changeLanguage('en');

// Cambiar a español
i18n.changeLanguage('es');

// El idioma se guarda automáticamente en AsyncStorage
```

### Obtener Idioma Actual

```typescript
const currentLanguage = i18n.language; // 'es' o 'en'
```

## Componentes Especiales

### LanguageSelector

Selector visual de idioma con banderas y nombres localizados.

```typescript
import LanguageSelector from '@/components/LanguageSelector';

function ProfileScreen() {
  return <LanguageSelector />;
}
```

**Características:**
- Muestra bandera del país
- Nombre del idioma localizado
- Guarda la selección en AsyncStorage
- Actualiza toda la app instantáneamente

### Hook useLanguageChange

Hook personalizado para ejecutar acciones cuando cambia el idioma.

```typescript
import { useLanguageChange } from '@/hooks/useLanguageChange';

function MiComponente() {
  useLanguageChange(() => {
    // Esta función se ejecuta cada vez que cambia el idioma
    console.log('Idioma cambiado!');
  });
}
```

**Uso común:**
- Actualizar textos de ayuda
- Recargar datos del servidor
- Actualizar títulos de navegación

## Formateo de Fechas y Números

### Fechas

```typescript
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

const locale = i18n.language === 'en' ? enUS : es;
const formattedDate = format(new Date(), 'PPP', { locale });
```

### Números

```typescript
const number = 1234.56;
const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
const formatted = number.toLocaleString(locale);
```

## Cómo Agregar un Nuevo Idioma

### Paso 1: Crear Archivos de Traducción

Crea una nueva carpeta en `src/i18n/locales/` con el código ISO del idioma:

```
src/i18n/locales/fr/  (para francés)
```

Crea los 8 archivos JSON con las traducciones:
- `common.json`
- `auth.json`
- `collection.json`
- `profile.json`
- `history.json`
- `recommend.json`
- `result.json`
- `components.json`

### Paso 2: Registrar en index.ts

Edita `src/i18n/index.ts`:

```typescript
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
// ... importar los demás archivos

const resources = {
  es: { /* ... */ },
  en: { /* ... */ },
  fr: {
    common: frCommon,
    auth: frAuth,
    collection: frCollection,
    profile: frProfile,
    history: frHistory,
    recommend: frRecommend,
    result: frResult,
    components: frComponents,
  }
};
```

### Paso 3: Actualizar LanguageSelector (Opcional)

Si quieres agregar una opción visual al selector:

```typescript
// src/components/LanguageSelector.tsx
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // Nuevo
];
```

### Paso 4: ¡Listo!

El idioma estará disponible y funcionará automáticamente.

## Integración con Backend

El idioma seleccionado se envía automáticamente al backend en cada recomendación:

```typescript
const recommendationData = {
  // ... otros campos
  idioma: i18n.language, // 'es', 'en', 'fr', etc.
};
```

El backend usa este campo para:
- Generar prompts de IA en el idioma correcto
- Responder en el idioma del usuario

## Pantallas Traducidas

### Autenticación
- ✅ LoginScreen
- ✅ RegisterScreen

### Principales
- ✅ ProfileScreen (con selector de idioma)
- ✅ CollectionScreen (búsqueda, modales)
- ✅ HistoryScreen (estados vacíos)
- ✅ RecommendScreen (wizard completo de 8 pasos)
- ✅ RecommendationResultScreen

### Componentes
- ✅ LanguageSelector
- ✅ ConfirmModal
- ✅ HistoryCard
- ✅ PerfumeCard
- ✅ FormNavigation

### Características Especiales
- ✅ Google Maps en idioma dinámico (Step8Location.web.tsx)
- ✅ Formateo de fechas localizado
- ✅ Mensajes de error traducidos
- ✅ Estados de carga traducidos

## Configuración

### index.ts

```typescript
i18n
  .use(AsyncStoragePlugin)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',                    // Idioma por defecto
    fallbackLng: 'es',            // Idioma de respaldo
    ns: [                         // Namespaces disponibles
      'common',
      'auth',
      'collection',
      'profile',
      'history',
      'recommend',
      'result',
      'components'
    ],
    defaultNS: 'common',          // Namespace por defecto
    interpolation: {
      escapeValue: false,
    },
  });
```

## Mejores Prácticas

1. **Usa namespaces**: Organiza las traducciones por funcionalidad
2. **Keys descriptivas**: Usa nombres claros como `login.emailPlaceholder`
3. **Evita texto hardcoded**: Siempre usa `t()` para textos
4. **Consistencia**: Mantén la misma estructura en todos los idiomas
5. **Testing**: Prueba la app en todos los idiomas soportados

## Persistencia

El idioma seleccionado se guarda automáticamente en AsyncStorage con la key:
```
@language
```

Cuando la app inicia, se restaura automáticamente el último idioma seleccionado.

## Troubleshooting

### Las traducciones no aparecen
- Verifica que el namespace esté importado en `index.ts`
- Verifica que estés usando el namespace correcto en `useTranslation()`
- Revisa que la key exista en el archivo JSON

### El idioma no persiste
- Verifica que AsyncStoragePlugin esté configurado en `index.ts`
- Revisa los permisos de AsyncStorage en la app

### Los textos están en inglés por defecto
- Verifica el `fallbackLng` en la configuración
- Asegúrate de que los archivos JSON de español estén correctamente importados

## Recursos

- [react-i18next Docs](https://react.i18next.com/)
- [i18next Docs](https://www.i18next.com/)
- [date-fns Locales](https://date-fns.org/docs/Locale)
