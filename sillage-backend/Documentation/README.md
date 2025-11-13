# Documentación - Sillage Backend

Bienvenido a la documentación del backend de Sillage.

## Índice de Documentos

### 📋 Reportes Técnicos

- **[Reporte Técnico de Sillage](./sillage_technical_report.md)**
  - Arquitectura general del sistema
  - Stack tecnológico
  - Estructura de la base de datos
  - Flujo de la aplicación

### 🧪 Testing & Quality Assurance

**Estado**: ✅ 140 tests | 100% passing | 83.55% coverage

- **[Resumen Ejecutivo](./testing_summary.md)** 📊 NUEVO
  - Métricas clave y estado del proyecto
  - Coverage por módulo
  - Comparación con objetivos
  - Listo para producción

- **[Quick Start de Testing](./testing_quickstart.md)** 🚀 NUEVO
  - Setup en 5 minutos
  - Tu primer test
  - Comandos esenciales
  - Patrones comunes

- **[Guía Completa de Testing](./testing_guide.md)** 📚 NUEVO
  - 140 tests con 83.55% coverage
  - Catálogo completo de tests
  - Guía de ejecución y debugging
  - Estrategias de mocking
  - Best practices para desarrolladores

### 🌍 Sistema de Internacionalización

- **[Sistema i18n para Prompts de IA](./i18n_system.md)**
  - Descripción del sistema de traducciones
  - Estructura de archivos
  - Cómo funciona la detección automática
  - API y configuración

- **[Ejemplo: Agregar Francés](./i18n_example_french.md)**
  - Tutorial paso a paso
  - Código completo de ejemplo
  - Testing y validación

## Estructura del Proyecto

```
sillage-backend/
├── app/
│   ├── api/              # Endpoints REST
│   ├── core/             # Configuración
│   ├── db/               # Base de datos
│   ├── models/           # Modelos SQLAlchemy
│   ├── schemas/          # Schemas Pydantic
│   ├── services/         # Lógica de negocio
│   ├── i18n/             # Sistema de internacionalización
│   │   ├── config.py
│   │   ├── loader.py
│   │   └── languages/    # Traducciones por idioma
│   └── main.py           # Punto de entrada
├── Documentation/        # Esta carpeta
└── requirements.txt
```

## Idiomas Soportados

El sistema de internacionalización actualmente soporta:

- ✅ **Español (es)** - Idioma por defecto
- ✅ **Inglés (en)**
- ➕ **Agregar más** - Consulta la [documentación de i18n](./i18n_system.md)

## Agregar Nuevo Idioma

Para agregar un nuevo idioma al sistema:

1. Crea `app/i18n/languages/[codigo].py` con las traducciones
2. El sistema lo detectará automáticamente
3. ¡Listo! Sin modificar otros archivos

Ver [ejemplo completo con francés](./i18n_example_french.md).

## Recursos Adicionales

- **API Base**: `http://localhost:8000`
- **Documentación Interactiva**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Tecnologías Principales

- **FastAPI** - Framework web
- **SQLAlchemy** - ORM
- **Pydantic** - Validación de datos
- **Redis** - Cache y sesiones
- **PostgreSQL** - Base de datos
- **Google Gemini AI** - Recomendaciones inteligentes
- **OpenWeatherMap** - Datos meteorológicos

## Contacto

Para preguntas o contribuciones al sistema de documentación, por favor revisa los documentos específicos listados arriba.
