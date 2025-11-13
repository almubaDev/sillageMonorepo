# Sistema Multilenguaje Escalable - Informe Técnico

**Proyecto:** Sillage - Aplicación de Recomendación de Perfumes
**Versión:** 1.0
**Fecha:** Octubre 2025
**Autor:** Sistema implementado con arquitectura escalable y modular

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Frontend - React Native con i18next](#frontend---react-native-con-i18next)
4. [Backend - Python con Sistema Dinámico](#backend---python-con-sistema-dinámico)
5. [Integración Frontend-Backend](#integración-frontend-backend)
6. [Extensión: IA Multilenguaje](#extensión-ia-multilenguaje) ⚠️ (Opcional)
7. [Flujo Completo del Sistema](#flujo-completo-del-sistema)
8. [Guía de Implementación](#guía-de-implementación)
9. [Agregar Nuevos Idiomas](#agregar-nuevos-idiomas)
10. [Mejores Prácticas](#mejores-prácticas)
11. [Consideraciones de Performance](#consideraciones-de-performance)
12. [Troubleshooting](#troubleshooting)

---

## Resumen Ejecutivo

Este documento describe un **sistema completo de internacionalización (i18n)** implementado en una aplicación full-stack con React Native (frontend) y Python/FastAPI (backend).

### Características Principales

- ✅ **Escalable**: Agregar idiomas sin modificar código existente
- ✅ **Dinámico**: Detección automática de idiomas disponibles
- ✅ **Type-Safe**: Validación completa en frontend y backend
- ✅ **Persistente**: Guarda preferencias de usuario
- ✅ **Modular**: Componentes reutilizables y desacoplados
- ✅ **Extensible**: Fácil integración con IA y servicios externos

### Stack Tecnológico

**Frontend:**
- React Native + Expo
- react-i18next v13.x
- i18next v23.x
- AsyncStorage (persistencia)
- TypeScript

**Backend:**
- Python 3.11+
- FastAPI
- Pydantic (validación)
- Sistema de módulos dinámicos

### Idiomas Soportados (Ejemplo)

- Español (es) - Default
- Inglés (en)
- Francés (fr) - Extensible
- Cualquier idioma ISO 639-1

---

## Arquitectura General

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Selecciona idioma
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Native)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  i18next + react-i18next                             │   │
│  │  - Traducciones UI en JSON                           │   │
│  │  - Namespaces organizados                            │   │
│  │  - AsyncStorage para persistencia                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Request { idioma: "es" }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Python/FastAPI)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Sistema i18n Dinámico                               │   │
│  │  - Detección automática de idiomas                   │   │
│  │  - Carga dinámica de módulos                         │   │
│  │  - Validación con Pydantic                           │   │
│  │  - Cache de traducciones                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Separación de Responsabilidades**
   - Frontend: Traducciones de UI
   - Backend: Validación y lógica de negocio

2. **Configuración sobre Código**
   - Archivos de traducción en lugar de código hardcoded
   - Detección automática en lugar de listas manuales

3. **Convención sobre Configuración**
   - Estructura estándar de archivos
   - Nombres predecibles

4. **Fail-Safe**
   - Siempre hay un idioma por defecto
   - Fallback automático ante errores

---

## Frontend - React Native con i18next

### 1. Estructura de Archivos

```
src/i18n/
├── index.ts                      # Configuración principal
└── locales/                      # Traducciones por idioma
    ├── es/                       # Español
    │   ├── common.json           # Textos comunes
    │   ├── auth.json             # Autenticación
    │   ├── [namespace].json      # Otros namespaces
    │   └── ...
    └── en/                       # Inglés
        ├── common.json
        ├── auth.json
        └── ...
```

### 2. Instalación de Dependencias

```bash
npm install i18next react-i18next
npm install @react-native-async-storage/async-storage
npm install i18next-async-storage-plugin
```

**package.json:**
```json
{
  "dependencies": {
    "i18next": "^23.7.6",
    "react-i18next": "^13.5.0",
    "@react-native-async-storage/async-storage": "^1.19.5",
    "i18next-async-storage-plugin": "^2.4.0"
  }
}
```

### 3. Configuración de i18next

**src/i18n/index.ts:**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStoragePlugin from 'i18next-async-storage-plugin';

// Importar traducciones
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
// ... más imports

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
// ... más imports

// Estructura de recursos
const resources = {
  es: {
    common: esCommon,
    auth: esAuth,
    // ... más namespaces
  },
  en: {
    common: enCommon,
    auth: enAuth,
    // ... más namespaces
  }
};

// Inicialización
i18n
  .use(AsyncStoragePlugin)           // Persistencia
  .use(initReactI18next)              // React integration
  .init({
    resources,
    lng: 'es',                        // Idioma por defecto
    fallbackLng: 'es',                // Fallback
    ns: ['common', 'auth'],           // Namespaces disponibles
    defaultNS: 'common',              // Namespace por defecto
    interpolation: {
      escapeValue: false,             // React ya escapa
    },
  });

export default i18n;
```

### 4. Estructura de Archivos JSON

**Principio: Organización por Namespace**

Cada namespace agrupa traducciones relacionadas funcionalmente.

**Ejemplo: src/i18n/locales/es/auth.json**
```json
{
  "login": {
    "title": "Iniciar Sesión",
    "email": "Correo Electrónico",
    "password": "Contraseña",
    "submit": "Entrar",
    "errors": {
      "invalidEmail": "Email inválido",
      "invalidPassword": "Contraseña incorrecta"
    }
  },
  "register": {
    "title": "Registro",
    "name": "Nombre",
    "submit": "Registrarse"
  }
}
```

**Ejemplo: src/i18n/locales/en/auth.json**
```json
{
  "login": {
    "title": "Login",
    "email": "Email",
    "password": "Password",
    "submit": "Sign In",
    "errors": {
      "invalidEmail": "Invalid email",
      "invalidPassword": "Invalid password"
    }
  },
  "register": {
    "title": "Register",
    "name": "Name",
    "submit": "Sign Up"
  }
}
```

### 5. Uso en Componentes

**Importar el Hook:**
```typescript
import { useTranslation } from 'react-i18next';
```

**Uso Básico:**
```typescript
function LoginScreen() {
  const { t, i18n } = useTranslation('auth');

  return (
    <View>
      <Text>{t('login.title')}</Text>
      <TextInput placeholder={t('login.email')} />
      <TextInput placeholder={t('login.password')} />
      <Button title={t('login.submit')} />
    </View>
  );
}
```

**Cambiar Idioma:**
```typescript
// Cambiar a inglés
i18n.changeLanguage('en');

// Obtener idioma actual
const currentLang = i18n.language; // 'es' | 'en'
```

**Múltiples Namespaces:**
```typescript
function MiComponente() {
  const { t } = useTranslation(['common', 'auth']);

  return (
    <View>
      <Text>{t('common:loading')}</Text>
      <Text>{t('auth:login.title')}</Text>
    </View>
  );
}
```

### 6. Componente: Selector de Idioma

**src/components/LanguageSelector.tsx:**

```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  // Agregar más idiomas aquí
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <View style={styles.container}>
      {languages.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.option,
            i18n.language === lang.code && styles.active
          ]}
          onPress={() => handleLanguageChange(lang.code)}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text style={styles.name}>{lang.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  active: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  flag: {
    fontSize: 24,
  },
  name: {
    fontSize: 14,
  },
});
```

### 7. Hook Personalizado: useLanguageChange

Ejecuta efectos cuando cambia el idioma.

**src/hooks/useLanguageChange.ts:**

```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageChange(callback: () => void) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Ejecutar callback cuando cambia el idioma
    const handleLanguageChange = () => {
      callback();
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, callback]);
}
```

**Uso:**
```typescript
function MiComponente() {
  useLanguageChange(() => {
    console.log('Idioma cambiado!');
    // Recargar datos, actualizar UI, etc.
  });
}
```

### 8. Integración con React Navigation

**Actualizar títulos de navegación:**

```typescript
import { useTranslation } from 'react-i18next';
import { useLayoutEffect } from 'react';

function MiScreen({ navigation }) {
  const { t } = useTranslation('namespace');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('screenTitle'),
    });
  }, [navigation, t]);

  return <View>...</View>;
}
```

### 9. Formateo de Fechas y Números

**Fechas con date-fns:**

```bash
npm install date-fns
```

```typescript
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { i18n } = useTranslation();

  const locale = i18n.language === 'en' ? enUS : es;
  const formattedDate = format(new Date(), 'PPP', { locale });

  return <Text>{formattedDate}</Text>;
}
```

**Números:**

```typescript
const number = 1234.56;
const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
const formatted = number.toLocaleString(locale);
// es-ES: "1.234,56"
// en-US: "1,234.56"
```

### 10. Persistencia con AsyncStorage

El plugin `i18next-async-storage-plugin` se encarga automáticamente de:

1. Guardar el idioma cuando cambia
2. Restaurar el idioma al iniciar la app
3. Key de storage: `@language` (por defecto)

**Verificar el idioma guardado:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const savedLanguage = await AsyncStorage.getItem('@language');
console.log('Idioma guardado:', savedLanguage);
```

---

## Backend - Python con Sistema Dinámico

### 1. Estructura de Archivos

```
app/
├── i18n/
│   ├── __init__.py               # Módulo i18n
│   ├── config.py                 # Configuración y detección
│   ├── loader.py                 # Cargador dinámico
│   └── languages/                # Traducciones por idioma
│       ├── __init__.py
│       ├── es.py                 # Español
│       ├── en.py                 # Inglés
│       └── [codigo].py           # Nuevos idiomas
├── schemas/
│   └── [modelo].py               # Schemas con validación i18n
└── services/
    └── [servicio].py             # Servicios que usan i18n
```

### 2. Configuración Dinámica

**app/i18n/config.py:**

```python
"""
Configuración de idiomas soportados
Para agregar un nuevo idioma, simplemente crea su archivo en languages/
"""
import os
from pathlib import Path
from typing import Dict, List

# Directorio de traducciones
LANGUAGES_DIR = Path(__file__).parent / "languages"

def get_supported_languages() -> List[str]:
    """
    Obtiene la lista de idiomas soportados dinámicamente
    buscando archivos en el directorio languages/
    """
    if not LANGUAGES_DIR.exists():
        return ["es"]  # Español como fallback

    languages = []
    for file in LANGUAGES_DIR.glob("*.py"):
        if file.stem != "__init__":
            languages.append(file.stem)

    return languages if languages else ["es"]

def get_default_language() -> str:
    """Idioma por defecto"""
    return "es"

# Cache de idiomas soportados
SUPPORTED_LANGUAGES = get_supported_languages()
DEFAULT_LANGUAGE = get_default_language()
```

**Ventajas:**
- ✅ No necesitas modificar código para agregar idiomas
- ✅ Detección automática de archivos `.py` en `languages/`
- ✅ Fallback robusto al idioma por defecto

### 3. Cargador Dinámico

**app/i18n/loader.py:**

```python
"""
Cargador dinámico de traducciones
"""
import importlib
from typing import Dict, Any
from app.i18n.config import SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE


class LanguageLoader:
    """Carga traducciones de forma dinámica"""

    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def get_language_module(self, lang_code: str):
        """
        Carga el módulo de idioma especificado
        Si no existe, retorna el idioma por defecto
        """
        # Si ya está en cache, retornarlo
        if lang_code in self._cache:
            return self._cache[lang_code]

        # Validar que el idioma esté soportado
        if lang_code not in SUPPORTED_LANGUAGES:
            lang_code = DEFAULT_LANGUAGE

        try:
            # Importar módulo dinámicamente
            module = importlib.import_module(f"app.i18n.languages.{lang_code}")
            self._cache[lang_code] = module
            return module
        except ImportError:
            # Fallback al idioma por defecto
            if lang_code != DEFAULT_LANGUAGE:
                return self.get_language_module(DEFAULT_LANGUAGE)
            raise

    def get_translations(self, lang_code: str, key: str) -> Any:
        """Obtiene una traducción específica del idioma"""
        module = self.get_language_module(lang_code)
        return getattr(module, key, None)


# Instancia global del loader
language_loader = LanguageLoader()
```

**Características:**
- ✅ Carga dinámica de módulos Python
- ✅ Cache para optimizar performance
- ✅ Fallback automático ante errores
- ✅ Validación de idiomas soportados

### 4. Estructura de Archivo de Idioma

Cada archivo de idioma es un módulo Python con constantes.

**app/i18n/languages/es.py:**

```python
# sillage-backend/app/i18n/languages/es.py
"""
Traducciones en español
"""

# Ejemplo: Diccionario de estaciones (hemisferio sur)
SEASONS = {
    1: "verano", 2: "verano", 3: "otoño", 4: "otoño",
    5: "invierno", 6: "invierno", 7: "invierno",
    8: "primavera", 9: "primavera", 10: "primavera",
    11: "verano", 12: "verano"
}

# Ejemplo: Momentos del día
TIME_OF_DAY = {
    "morning": "mañana",
    "afternoon": "tarde",
    "night": "noche"
}

# Ejemplo: Mensajes de validación
VALIDATION_MESSAGES = {
    "required": "Este campo es requerido",
    "invalid_email": "Email inválido",
    "min_length": "Mínimo {min} caracteres",
}

# Cualquier otra constante que necesites
ERROR_MESSAGES = {
    "not_found": "No encontrado",
    "unauthorized": "No autorizado",
}
```

**app/i18n/languages/en.py:**

```python
# sillage-backend/app/i18n/languages/en.py
"""
English translations
"""

SEASONS = {
    1: "summer", 2: "summer", 3: "autumn", 4: "autumn",
    5: "winter", 6: "winter", 7: "winter",
    8: "spring", 9: "spring", 10: "spring",
    11: "summer", 12: "summer"
}

TIME_OF_DAY = {
    "morning": "morning",
    "afternoon": "afternoon",
    "night": "night"
}

VALIDATION_MESSAGES = {
    "required": "This field is required",
    "invalid_email": "Invalid email",
    "min_length": "Minimum {min} characters",
}

ERROR_MESSAGES = {
    "not_found": "Not found",
    "unauthorized": "Unauthorized",
}
```

### 5. Validación con Pydantic

**app/schemas/example.py:**

```python
from typing import Optional
from pydantic import BaseModel, Field, validator
from app.i18n.config import SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE


class MyRequest(BaseModel):
    """Request con soporte de idioma"""
    name: str = Field(..., min_length=3, max_length=100)
    email: str
    idioma: Optional[str] = Field(default=DEFAULT_LANGUAGE)

    @validator('idioma')
    def validate_idioma(cls, v):
        """Valida que el idioma esté soportado dinámicamente"""
        if v and v not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f'Idioma no soportado. Idiomas disponibles: {", ".join(SUPPORTED_LANGUAGES)}'
            )
        return v or DEFAULT_LANGUAGE
```

**Ventajas:**
- ✅ Validación automática de idiomas
- ✅ Se actualiza dinámicamente al agregar idiomas
- ✅ Mensajes de error claros

### 6. Uso en Servicios

**app/services/example_service.py:**

```python
from app.i18n.loader import language_loader


def get_localized_message(message_key: str, lang_code: str = "es") -> str:
    """Obtiene un mensaje localizado"""

    # Cargar traducciones del idioma
    error_messages = language_loader.get_translations(lang_code, 'ERROR_MESSAGES')

    # Obtener mensaje específico
    message = error_messages.get(message_key, "Error desconocido")

    return message


# Ejemplo de uso
def my_function(idioma: str = "es"):
    try:
        # Lógica de negocio
        pass
    except Exception:
        error_msg = get_localized_message('not_found', idioma)
        raise HTTPException(status_code=404, detail=error_msg)
```

### 7. Endpoint Example

**app/api/example.py:**

```python
from fastapi import APIRouter, Depends
from app.schemas.example import MyRequest
from app.i18n.loader import language_loader

router = APIRouter()


@router.post("/example")
async def create_example(request: MyRequest):
    """Endpoint que soporta múltiples idiomas"""

    # El idioma ya fue validado por Pydantic
    lang_code = request.idioma

    # Cargar traducciones
    validation_messages = language_loader.get_translations(
        lang_code,
        'VALIDATION_MESSAGES'
    )

    # Usar traducciones en lógica de negocio
    if not request.name:
        return {
            "error": validation_messages['required']
        }

    # Resto de la lógica
    return {"message": "Success"}
```

---

## Integración Frontend-Backend

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│  1. Usuario selecciona idioma en LanguageSelector      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. i18n.changeLanguage('en')                           │
│     - Actualiza AsyncStorage                            │
│     - Dispara evento 'languageChanged'                  │
│     - Re-renderiza componentes con nuevas traducciones  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. Usuario hace acción (ej: crear recomendación)      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. Frontend envía request con campo idioma             │
│     POST /api/recommendations                           │
│     {                                                    │
│       "name": "...",                                     │
│       "idioma": "en"  ← Idioma actual del usuario       │
│     }                                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. Backend valida idioma con Pydantic                  │
│     - Verifica que esté en SUPPORTED_LANGUAGES          │
│     - Usa DEFAULT_LANGUAGE si es inválido              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  6. Backend procesa request                             │
│     - Carga traducciones con language_loader            │
│     - Genera respuestas localizadas                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  7. Backend retorna response                            │
│     {                                                    │
│       "message": "Success" (en inglés)                   │
│     }                                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  8. Frontend muestra respuesta                          │
│     - Usa traducciones de i18next para UI               │
│     - Muestra datos del backend ya localizados          │
└─────────────────────────────────────────────────────────┘
```

### Comunicación API

**Frontend: Service Layer**

```typescript
// src/services/api.ts
import i18n from '../i18n';

export async function createItem(data: any) {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      idioma: i18n.language, // Enviar idioma actual
    }),
  });

  return response.json();
}
```

**Backend: Schema + Validation**

```python
# app/schemas/item.py
from pydantic import BaseModel, validator
from app.i18n.config import SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE

class ItemCreate(BaseModel):
    name: str
    idioma: Optional[str] = Field(default=DEFAULT_LANGUAGE)

    @validator('idioma')
    def validate_idioma(cls, v):
        if v and v not in SUPPORTED_LANGUAGES:
            raise ValueError(f'Unsupported language')
        return v or DEFAULT_LANGUAGE
```

---

## Extensión: IA Multilenguaje

> ⚠️ **NOTA IMPORTANTE**: Esta sección es **opcional** y solo aplica si tu aplicación utiliza servicios de IA que generan texto en respuesta a prompts del usuario.

### Contexto

En aplicaciones que utilizan modelos de IA (como GPT, Gemini, Claude, etc.) para generar contenido, es importante que:

1. **Los prompts** se envíen en el idioma del usuario
2. **Las respuestas** de la IA estén en el idioma del usuario
3. **El contexto** (etiquetas, instrucciones) esté traducido

### Arquitectura IA Multilenguaje

```
┌────────────────────────────────────────────────────────┐
│  Usuario solicita recomendación en inglés             │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Frontend: { idioma: "en", ...datos }                  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Backend: Recibe request con idioma="en"               │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Cargar template de prompt en inglés                   │
│  - language_loader.get_translations('en', 'PROMPT')    │
│  - Incluye: etiquetas, instrucciones, formato          │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Construir prompt dinámico en inglés                   │
│  - Reemplazar variables con datos del usuario          │
│  - Usar etiquetas traducidas (labels)                  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Enviar prompt a API de IA (OpenAI, Gemini, etc.)     │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  IA responde en inglés (por contexto del prompt)      │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Backend retorna respuesta al frontend                 │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│  Frontend muestra respuesta en inglés                  │
└────────────────────────────────────────────────────────┘
```

### Implementación: Templates de Prompts

**app/i18n/languages/es.py:**

```python
"""
Traducciones en español - Incluye template de IA
"""

# Template del prompt para IA
PROMPT_TEMPLATE = """Eres un experto. Recomienda la mejor opción para el siguiente contexto:

## CONTEXTO
- Fecha: {fecha}
- Ubicación: {ubicacion}
- Preferencia: {preferencia}

## OPCIONES DISPONIBLES
{opciones_text}

## INSTRUCCIONES
1. Analiza el contexto completo
2. Elige UNA opción de la lista
3. Tu respuesta debe comenzar con el nombre de la opción
4. Explica brevemente (3-4 líneas) por qué es ideal

FORMATO DE RESPUESTA:
[Nombre de la opción]
[Explicación breve]
"""

# Etiquetas para construir el contexto
CONTEXT_LABELS = {
    "date": "Fecha",
    "location": "Ubicación",
    "preference": "Preferencia",
}
```

**app/i18n/languages/en.py:**

```python
"""
English translations - Includes AI template
"""

# AI prompt template
PROMPT_TEMPLATE = """You are an expert. Recommend the best option for the following context:

## CONTEXT
- Date: {fecha}
- Location: {ubicacion}
- Preference: {preferencia}

## AVAILABLE OPTIONS
{opciones_text}

## INSTRUCTIONS
1. Analyze the complete context
2. Choose ONE option from the list
3. Your response must start with the option name
4. Briefly explain (3-4 lines) why it's ideal

RESPONSE FORMAT:
[Option name]
[Brief explanation]
"""

# Labels for context building
CONTEXT_LABELS = {
    "date": "Date",
    "location": "Location",
    "preference": "Preference",
}
```

### Servicio de IA con i18n

**app/services/ai_service.py:**

```python
import httpx
from typing import List, Any
from app.i18n.loader import language_loader


def build_ai_prompt(
    data: dict,
    options: List[Any],
    idioma: str = "es"
) -> str:
    """
    Construir prompt para IA en el idioma especificado
    """

    # Cargar template del idioma
    prompt_template = language_loader.get_translations(idioma, 'PROMPT_TEMPLATE')
    labels = language_loader.get_translations(idioma, 'CONTEXT_LABELS')

    # Formatear opciones con etiquetas traducidas
    opciones_text = "\n".join([
        f"- {opt.name}"
        for opt in options
    ])

    # Construir prompt usando template
    prompt = prompt_template.format(
        fecha=data['fecha'],
        ubicacion=data['ubicacion'],
        preferencia=data['preferencia'],
        opciones_text=opciones_text
    )

    return prompt


async def get_ai_recommendation(
    data: dict,
    options: List[Any],
    idioma: str = "es"
) -> str:
    """
    Obtener recomendación de IA en el idioma especificado
    """

    # Construir prompt en el idioma del usuario
    prompt = build_ai_prompt(data, options, idioma)

    # Llamar a API de IA (ejemplo con OpenAI)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        data = response.json()
        return data['choices'][0]['message']['content']
```

### Endpoint con IA

**app/api/recommendations.py:**

```python
from fastapi import APIRouter, Depends
from app.services.ai_service import get_ai_recommendation
from app.schemas.recommendation import RecommendationRequest

router = APIRouter()


@router.post("/recommendations")
async def create_recommendation(request: RecommendationRequest):
    """
    Crear recomendación usando IA
    La respuesta de la IA estará en el idioma del usuario
    """

    # Obtener opciones disponibles
    options = await get_available_options()

    # Generar recomendación con IA en el idioma del usuario
    ai_response = await get_ai_recommendation(
        data={
            'fecha': request.fecha,
            'ubicacion': request.ubicacion,
            'preferencia': request.preferencia,
        },
        options=options,
        idioma=request.idioma  # ← Idioma del usuario
    )

    return {
        "recommendation": ai_response,  # Respuesta en el idioma del usuario
        "language": request.idioma
    }
```

### Consideraciones para IA

1. **Contexto en el Prompt**: Asegúrate de que TODO el prompt esté en el idioma objetivo
2. **Instrucciones Claras**: Indica explícitamente al modelo que responda en ese idioma
3. **Formato Consistente**: Mantén la misma estructura en todos los idiomas
4. **Testing**: Prueba las respuestas en cada idioma para validar calidad

---

## Flujo Completo del Sistema

### Caso de Uso: Usuario Cambia de Español a Inglés

```
1. INICIO - Usuario en español
   ├─ UI muestra textos en español
   └─ AsyncStorage: { "@language": "es" }

2. Usuario toca LanguageSelector
   └─ Selecciona "English 🇺🇸"

3. Frontend - i18n.changeLanguage('en')
   ├─ AsyncStorage actualizado: { "@language": "en" }
   ├─ Evento 'languageChanged' disparado
   └─ Todos los componentes se re-renderizan con t('key')

4. Usuario navega por la app
   ├─ LoginScreen: t('auth:login.title') → "Login"
   ├─ CollectionScreen: t('collection:title') → "My Collection"
   └─ Todos los textos en inglés

5. Usuario crea una recomendación
   └─ POST /api/recommendations { idioma: "en", ...data }

6. Backend recibe request
   ├─ Pydantic valida: "en" ∈ SUPPORTED_LANGUAGES ✓
   └─ language_loader.get_language_module('en')

7. Backend procesa (si usa IA)
   ├─ Carga PROMPT_TEMPLATE en inglés
   ├─ Construye prompt: "You are an expert..."
   └─ IA responde en inglés

8. Backend retorna response
   └─ { "recommendation": "Based on...", "language": "en" }

9. Frontend muestra resultado
   ├─ t('result:title') → "Your Recommendation"
   └─ Muestra recomendación de IA en inglés

10. Usuario cierra app
    └─ AsyncStorage mantiene: { "@language": "en" }

11. Usuario reabre app
    ├─ i18next restaura idioma desde AsyncStorage
    └─ App inicia directamente en inglés
```

---

## Guía de Implementación

### Checklist: Implementar Sistema Multilenguaje

#### Fase 1: Setup Frontend

- [ ] Instalar dependencias
  ```bash
  npm install i18next react-i18next
  npm install @react-native-async-storage/async-storage
  npm install i18next-async-storage-plugin
  ```

- [ ] Crear estructura de carpetas
  ```
  src/i18n/
  ├── index.ts
  └── locales/
      ├── es/
      │   └── common.json
      └── en/
          └── common.json
  ```

- [ ] Configurar i18next (`src/i18n/index.ts`)
  - Importar traducciones
  - Definir resources
  - Configurar plugins (AsyncStorage, initReactI18next)
  - Definir idioma por defecto y fallback

- [ ] Crear archivos JSON de traducción
  - Definir namespaces (common, auth, etc.)
  - Crear estructura consistente entre idiomas
  - Usar keys descriptivas

- [ ] Importar i18n en App.tsx
  ```typescript
  import './src/i18n';
  ```

- [ ] Envolver app con I18nextProvider (si es necesario)

#### Fase 2: Componentes Frontend

- [ ] Crear LanguageSelector component
  - Lista de idiomas disponibles
  - Indicador de idioma actual
  - Función para cambiar idioma

- [ ] Crear hook useLanguageChange (opcional)
  - Escuchar evento 'languageChanged'
  - Ejecutar callbacks

- [ ] Actualizar componentes existentes
  - Reemplazar texto hardcoded con `t('key')`
  - Importar `useTranslation` hook
  - Especificar namespace correcto

#### Fase 3: Setup Backend

- [ ] Crear estructura de carpetas
  ```
  app/i18n/
  ├── __init__.py
  ├── config.py
  ├── loader.py
  └── languages/
      ├── __init__.py
      ├── es.py
      └── en.py
  ```

- [ ] Implementar config.py
  - Función `get_supported_languages()`
  - Función `get_default_language()`
  - Exportar constantes

- [ ] Implementar loader.py
  - Clase `LanguageLoader` con cache
  - Método `get_language_module()`
  - Método `get_translations()`
  - Instancia global `language_loader`

- [ ] Crear archivos de idioma
  - Definir constantes necesarias
  - Mantener estructura consistente

#### Fase 4: Validación Backend

- [ ] Actualizar Pydantic schemas
  - Agregar campo `idioma: Optional[str]`
  - Importar `SUPPORTED_LANGUAGES`, `DEFAULT_LANGUAGE`
  - Crear validator para campo `idioma`

- [ ] Actualizar servicios
  - Aceptar parámetro `idioma`
  - Usar `language_loader` para obtener traducciones
  - Generar mensajes localizados

- [ ] Actualizar endpoints
  - Aceptar `idioma` en request body
  - Pasar `idioma` a servicios
  - Retornar respuestas localizadas

#### Fase 5: Integración

- [ ] Frontend: Enviar idioma en requests
  ```typescript
  { ...data, idioma: i18n.language }
  ```

- [ ] Backend: Validar y usar idioma
  ```python
  def my_service(data: Request):
      lang = data.idioma
      translations = language_loader.get_translations(lang, 'KEY')
  ```

- [ ] Testing end-to-end
  - Cambiar idioma en frontend
  - Verificar UI actualizada
  - Hacer request a backend
  - Verificar respuesta localizada

#### Fase 6: IA (Opcional)

- [ ] Definir templates de prompts en archivos de idioma
- [ ] Crear función `build_ai_prompt(data, idioma)`
- [ ] Actualizar servicio de IA para aceptar `idioma`
- [ ] Testing de respuestas de IA en cada idioma

#### Fase 7: Pulido

- [ ] Formateo de fechas localizado
- [ ] Formateo de números localizado
- [ ] Títulos de navegación dinámicos
- [ ] Mensajes de error localizados
- [ ] Estados de carga localizados

#### Fase 8: Documentación

- [ ] Crear documentación técnica
- [ ] Documentar cómo agregar idiomas
- [ ] Crear ejemplos prácticos
- [ ] Documentar estructura de archivos

---

## Agregar Nuevos Idiomas

### Proceso Simplificado

Para agregar un nuevo idioma (ejemplo: francés `fr`):

#### 1. Frontend

**Crear archivos JSON:**
```
src/i18n/locales/fr/
├── common.json
├── auth.json
└── [otros namespaces].json
```

**Registrar en index.ts:**
```typescript
import frCommon from './locales/fr/common.json';
// ... otros imports

const resources = {
  es: { /* ... */ },
  en: { /* ... */ },
  fr: {
    common: frCommon,
    // ... otros namespaces
  }
};
```

**Actualizar LanguageSelector (opcional):**
```typescript
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // NUEVO
];
```

#### 2. Backend

**Crear archivo de idioma:**
```python
# app/i18n/languages/fr.py
"""
Traductions en français
"""

# Definir todas las constantes necesarias
SEASONS = { ... }
TIME_OF_DAY = { ... }
VALIDATION_MESSAGES = { ... }

# Si usas IA:
PROMPT_TEMPLATE = """..."""
```

**¡Eso es todo!** El sistema detectará automáticamente `fr.py` y lo agregará a `SUPPORTED_LANGUAGES`.

#### 3. Verificar

```bash
# Backend: Verificar idiomas soportados
python -c "from app.i18n.config import SUPPORTED_LANGUAGES; print(SUPPORTED_LANGUAGES)"
# Output: ['es', 'en', 'fr']

# Frontend: Cambiar idioma en la app y verificar
```

### Template de Archivo de Idioma

**Frontend: locales/[codigo]/common.json**
```json
{
  "appName": "App Name",
  "loading": "Loading...",
  "error": "Error",
  "success": "Success",
  "cancel": "Cancel",
  "confirm": "Confirm",
  "save": "Save",
  "delete": "Delete",
  "edit": "Edit",
  "search": "Search",
  "noResults": "No results found",
  "retry": "Retry"
}
```

**Backend: languages/[codigo].py**
```python
"""
Traducciones en [idioma]
"""

# Constantes requeridas (ajustar según tu app)
SEASONS = {
    1: "season1", 2: "season2", 3: "season3", 4: "season4",
    5: "season5", 6: "season6", 7: "season7", 8: "season8",
    9: "season9", 10: "season10", 11: "season11", 12: "season12"
}

TIME_OF_DAY = {
    "morning": "morning_translation",
    "afternoon": "afternoon_translation",
    "night": "night_translation"
}

VALIDATION_MESSAGES = {
    "required": "Required field",
    "invalid_email": "Invalid email",
}

ERROR_MESSAGES = {
    "not_found": "Not found",
    "unauthorized": "Unauthorized",
}

# Si usas IA:
PROMPT_TEMPLATE = """
Your AI prompt template in this language...
"""
```

---

## Mejores Prácticas

### 1. Organización de Traducciones

#### ✅ Buenas Prácticas

- **Namespaces por funcionalidad**: Agrupa traducciones relacionadas
  ```
  auth/ → login, register
  profile/ → settings, preferences
  ```

- **Keys descriptivas**: Usa nombres claros
  ```json
  "login.emailPlaceholder": "Email"  // ✅ Claro
  "le": "Email"  // ❌ Poco claro
  ```

- **Estructura consistente**: Misma jerarquía en todos los idiomas
  ```json
  // es/auth.json
  {
    "login": { "title": "Iniciar Sesión" }
  }

  // en/auth.json
  {
    "login": { "title": "Login" }
  }
  ```

- **Valores por defecto**: Siempre define fallbackLng
  ```typescript
  i18n.init({
    fallbackLng: 'es',  // ✅ Siempre tener fallback
  });
  ```

#### ❌ Evitar

- Texto hardcoded en componentes
- Keys inconsistentes entre idiomas
- Traducciones incompletas
- Copiar-pegar sin contextualizar

### 2. Naming Conventions

#### Keys de Traducción

```
[screen/feature].[element].[attribute]

Ejemplos:
- login.title
- login.emailPlaceholder
- login.submitButton
- login.errors.invalidEmail
- collection.searchPlaceholder
- collection.empty.title
- collection.empty.message
```

#### Archivos de Idioma (Backend)

```python
# Usar UPPER_SNAKE_CASE para constantes
SEASONS = { ... }
TIME_OF_DAY = { ... }
VALIDATION_MESSAGES = { ... }
PROMPT_TEMPLATE = """..."""

# Evitar camelCase o lowercase
seasons = { ... }  # ❌
promptTemplate = """..."""  # ❌
```

### 3. Performance

#### Frontend

- **Lazy loading de namespaces** (para apps grandes):
  ```typescript
  i18n.init({
    ns: ['common'],  // Solo cargar común al inicio
    defaultNS: 'common',
  });

  // Cargar bajo demanda
  const { t } = useTranslation(['common', 'auth']);
  ```

- **Evitar re-renders innecesarios**:
  ```typescript
  // ✅ Usar useCallback para funciones
  const handleChange = useCallback(() => {
    i18n.changeLanguage(lang);
  }, [lang]);
  ```

#### Backend

- **Cache de módulos**: El `LanguageLoader` ya implementa cache
  ```python
  # Primera llamada: carga y cachea
  module = language_loader.get_language_module('es')

  # Llamadas siguientes: retorna del cache
  module = language_loader.get_language_module('es')  # Instantáneo
  ```

- **Evitar cargas repetidas**:
  ```python
  # ❌ Malo: Carga en cada request
  def my_function():
      translations = language_loader.get_translations('es', 'KEY')

  # ✅ Mejor: Carga una vez al inicio del módulo
  TRANSLATIONS_ES = language_loader.get_translations('es', 'KEY')

  def my_function():
      return TRANSLATIONS_ES['some_key']
  ```

### 4. Testing

#### Frontend

```typescript
// tests/i18n.test.ts
import i18n from '../src/i18n';

describe('i18n', () => {
  it('should change language', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should translate correctly', () => {
    const translation = i18n.t('common:appName');
    expect(translation).toBe('Sillage');
  });

  it('should fallback to default language', async () => {
    await i18n.changeLanguage('invalid');
    expect(i18n.language).toBe('es');  // fallbackLng
  });
});
```

#### Backend

```python
# tests/test_i18n.py
from app.i18n.config import SUPPORTED_LANGUAGES
from app.i18n.loader import language_loader

def test_supported_languages():
    assert 'es' in SUPPORTED_LANGUAGES
    assert 'en' in SUPPORTED_LANGUAGES

def test_language_loader():
    module = language_loader.get_language_module('es')
    assert hasattr(module, 'SEASONS')
    assert hasattr(module, 'TIME_OF_DAY')

def test_invalid_language_fallback():
    module = language_loader.get_language_module('invalid')
    # Debe retornar módulo por defecto (es)
    assert module is not None
```

### 5. Mantenimiento

#### Checklist de Traducción

Cuando agregues un nuevo feature:

- [ ] Agregar keys a TODOS los archivos JSON de idiomas
- [ ] Usar keys descriptivas
- [ ] Mantener estructura consistente
- [ ] Testing en todos los idiomas
- [ ] Actualizar documentación si es necesario

#### Auditoría de Traducciones

Script para encontrar keys faltantes:

```typescript
// scripts/audit-translations.ts
import esCommon from '../src/i18n/locales/es/common.json';
import enCommon from '../src/i18n/locales/en/common.json';

function flattenKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      keys = keys.concat(flattenKeys(obj[key], `${prefix}${key}.`));
    } else {
      keys.push(`${prefix}${key}`);
    }
  }
  return keys;
}

const esKeys = flattenKeys(esCommon);
const enKeys = flattenKeys(enCommon);

const missingInEn = esKeys.filter(k => !enKeys.includes(k));
const missingInEs = enKeys.filter(k => !esKeys.includes(k));

console.log('Missing in EN:', missingInEn);
console.log('Missing in ES:', missingInEs);
```

---

## Consideraciones de Performance

### Tamaño del Bundle

**Frontend:**

- Archivos JSON son pequeños (<50KB por idioma típicamente)
- i18next tree-shaking elimina código no usado
- Considera lazy loading para apps muy grandes

**Bundle Size Estimado:**
```
i18next: ~60KB
react-i18next: ~20KB
Traducciones (8 namespaces × 2 idiomas): ~30KB
Total: ~110KB (aceptable para la mayoría de apps)
```

### Tiempo de Carga

**Frontend:**
- Inicial: ~100ms (cargar i18next + traducciones)
- Cambio de idioma: ~50ms (actualizar AsyncStorage + re-render)

**Backend:**
- Primera carga de módulo: ~10ms
- Desde cache: <1ms
- Validación Pydantic: <1ms

### Optimizaciones

1. **Precargar idioma por defecto**
   ```typescript
   // App.tsx
   import './src/i18n';  // Carga inmediata
   ```

2. **Cache en backend**
   ```python
   # Ya implementado en LanguageLoader
   self._cache: Dict[str, Any] = {}
   ```

3. **Memoización en componentes**
   ```typescript
   const translation = useMemo(() => t('key'), [t]);
   ```

4. **Batch updates**
   ```typescript
   // Evitar múltiples changeLanguage en secuencia
   i18n.changeLanguage('en');  // Un solo cambio
   ```

---

## Troubleshooting

### Problemas Comunes

#### 1. Traducciones no aparecen

**Síntoma:** Componente muestra la key en lugar de la traducción

**Causas posibles:**
- Namespace no importado en `index.ts`
- Namespace incorrecto en `useTranslation()`
- Key no existe en el archivo JSON

**Solución:**
```typescript
// Verificar namespace
const { t } = useTranslation('auth');  // Debe coincidir

// Verificar key
t('login.title')  // Debe existir en auth.json

// Verificar import en index.ts
import authEs from './locales/es/auth.json';
// ...
resources: {
  es: { auth: authEs }  // Debe estar registrado
}
```

#### 2. Idioma no persiste

**Síntoma:** Al reabrir la app, vuelve al idioma por defecto

**Causa:** AsyncStoragePlugin no configurado correctamente

**Solución:**
```typescript
import AsyncStoragePlugin from 'i18next-async-storage-plugin';

i18n
  .use(AsyncStoragePlugin)  // ✅ Debe estar antes de init
  .use(initReactI18next)
  .init({ ... });
```

#### 3. Backend rechaza idioma válido

**Síntoma:** Error 422 "Idioma no soportado" para un idioma que existe

**Causa:** Archivo de idioma no detectado correctamente

**Solución:**
```bash
# Verificar que el archivo existe
ls app/i18n/languages/fr.py

# Verificar que no tiene __pycache__
rm -rf app/i18n/languages/__pycache__

# Verificar detección
python -c "from app.i18n.config import SUPPORTED_LANGUAGES; print(SUPPORTED_LANGUAGES)"
```

#### 4. IA responde en idioma incorrecto

**Síntoma:** Usuario solicita en inglés, IA responde en español

**Causa:** Prompt no está completamente en el idioma objetivo

**Solución:**
```python
# Verificar que el template está en el idioma correcto
prompt_template = language_loader.get_translations(idioma, 'PROMPT_TEMPLATE')

# Verificar que TODAS las etiquetas están traducidas
labels = language_loader.get_translations(idioma, 'CONTEXT_LABELS')

# Usar las etiquetas traducidas en el prompt
prompt = f"{labels['date']}: {fecha}"  # ✅
prompt = f"Fecha: {fecha}"  # ❌ Hardcoded en español
```

#### 5. Cambio de idioma lento

**Síntoma:** Delay notable al cambiar idioma

**Causa:** Re-renders innecesarios o cálculos pesados

**Solución:**
```typescript
// Usar React.memo para componentes pesados
export default React.memo(MyComponent);

// Usar useCallback para funciones
const handleChange = useCallback(() => {
  i18n.changeLanguage(lang);
}, [lang]);

// Verificar que no hay loops infinitos
useEffect(() => {
  // ...
}, [i18n.language]);  // ✅ Dependencia específica
```

---

## Conclusiones

### Resumen del Sistema

Este sistema de internacionalización ofrece:

1. **Escalabilidad**: Agregar idiomas sin modificar código
2. **Modularidad**: Frontend y backend independientes
3. **Type-Safety**: Validación completa en ambos lados
4. **Performance**: Cache y optimizaciones integradas
5. **Extensibilidad**: Fácil integración con servicios externos (IA, APIs, etc.)

### Ventajas Clave

- ✅ **Un solo archivo por idioma** en backend
- ✅ **Detección automática** de idiomas disponibles
- ✅ **Sin modificar código** para agregar idiomas
- ✅ **Validación dinámica** en Pydantic
- ✅ **Persistencia** de preferencias de usuario
- ✅ **Fallbacks robustos** ante errores
- ✅ **Compatible con IA** (opcional)

### Aplicabilidad

Este sistema puede replicarse en:

- ✅ Aplicaciones web (React, Vue, Angular)
- ✅ Aplicaciones móviles (React Native, Flutter)
- ✅ APIs REST (FastAPI, Django, Flask)
- ✅ Aplicaciones con IA (prompts multilenguaje)
- ✅ Aplicaciones sin IA (solo UI/backend)

### Próximos Pasos

1. Implementar el sistema en tu aplicación
2. Agregar idiomas según tu audiencia
3. Monitorear uso y performance
4. Iterar y mejorar basado en feedback

---

## Recursos Adicionales

### Frontend

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [date-fns Locales](https://date-fns.org/docs/Locale)

### Backend

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Validators](https://docs.pydantic.dev/latest/usage/validators/)
- [Python importlib](https://docs.python.org/3/library/importlib.html)

### Standards

- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [BCP 47 Language Tags](https://tools.ietf.org/html/bcp47)
- [CLDR (Common Locale Data Repository)](http://cldr.unicode.org/)

---

**Fin del Informe**

Para más información específica del proyecto Sillage:
- Backend: `/sillage-backend/Documentation/`
- Frontend: `/sillage-mobile/Documentation/`
