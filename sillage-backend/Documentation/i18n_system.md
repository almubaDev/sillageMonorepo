# Sistema de Internacionalización para Prompts de IA

Este sistema permite agregar soporte para nuevos idiomas de forma completamente dinámica.

## Estructura

```
app/i18n/
├── __init__.py
├── config.py                 # Configuración y detección automática de idiomas
├── loader.py                 # Cargador dinámico de traducciones
├── languages/                # Directorio de traducciones
│   ├── __init__.py
│   ├── es.py                 # Español
│   ├── en.py                 # Inglés
│   └── [nuevo_idioma].py     # Tu nuevo idioma aquí
└── README.md                 # Este archivo
```

## Cómo agregar un nuevo idioma

### Paso 1: Crear archivo de traducción

Crea un nuevo archivo en `app/i18n/languages/` con el código ISO del idioma (ej: `fr.py` para francés, `pt.py` para portugués).

**Ejemplo para francés (`app/i18n/languages/fr.py`):**

```python
# sillage-backend/app/i18n/languages/fr.py
"""
Traductions en français pour les prompts IA
"""

# Dictionnaire des saisons (hémisphère sud)
SEASONS = {
    1: "été", 2: "été", 3: "automne", 4: "automne",
    5: "hiver", 6: "hiver", 7: "hiver",
    8: "printemps", 9: "printemps", 10: "printemps",
    11: "été", 12: "été"
}

# Moments de la journée
TIME_OF_DAY = {
    "morning": "matin",
    "afternoon": "après-midi",
    "night": "nuit"
}

# Étiquettes pour les informations de parfum
PERFUME_LABELS = {
    "perfumer": "parfumeur",
    "accords": "accords",
    "notes": "notes"
}

# Template du prompt pour Gemini
PROMPT_TEMPLATE = """Vous êtes un expert parfumeur. Recommandez le parfum LE PLUS APPROPRIÉ de cette collection pour le contexte suivant:

## CONTEXTE DE L'ÉVÉNEMENT
- Lieu: {lugar_nombre} ({lugar_tipo})
- Description: {lugar_descripcion}
- Date et heure: {fecha_evento} {hora_evento} ({momento_dia})
- Météo: {clima_descripcion}, {temperatura}°C, {humedad}% d'humidité
- Saison: {estacion}
- Occasion: {ocasion}
- Attente: {expectativa}
- Tenue: {vestimenta}

## PARFUMS DISPONIBLES
{perfumes_text}

## INSTRUCTIONS
1. Analysez le contexte complet
2. Considérez particulièrement la météo, l'heure et le type de lieu
3. Choisissez UN SEUL parfum de la liste
4. Votre réponse doit commencer par le nom exact du parfum recommandé
5. Expliquez brièvement (3-4 lignes) pourquoi il est idéal pour ce contexte

FORMAT DE RÉPONSE:
[Nom du parfum]
[Brève explication de pourquoi il est parfait pour cette occasion]
"""
```

### Paso 2: ¡Eso es todo!

El sistema detectará automáticamente el nuevo idioma. **No necesitas modificar ningún otro archivo.**

El sistema:
- ✅ Detecta automáticamente el archivo en `languages/`
- ✅ Actualiza la validación del schema dinámicamente
- ✅ Carga las traducciones cuando se solicita ese idioma
- ✅ Usa el idioma por defecto (español) si hay algún error

### Paso 3 (Frontend): Agregar al selector de idioma

Solo necesitas agregar el nuevo idioma a tu aplicación móvil:

1. Crear archivos de traducción en `sillage-mobile/src/i18n/locales/fr/` (siguiendo la estructura de `es/` o `en/`)
2. Registrar el idioma en `sillage-mobile/src/i18n/index.ts`
3. El LanguageSelector automáticamente mostrará el nuevo idioma

## Estructura requerida de cada archivo de idioma

Cada archivo de idioma **debe** contener estas 4 constantes:

```python
SEASONS = {
    # Diccionario con 12 meses (1-12) mapeados a las estaciones
    # Nota: Actualmente configurado para hemisferio sur
}

TIME_OF_DAY = {
    # Diccionario con 3 claves: "morning", "afternoon", "night"
    "morning": "...",
    "afternoon": "...",
    "night": "..."
}

PERFUME_LABELS = {
    # Diccionario con 3 claves: "perfumer", "accords", "notes"
    "perfumer": "...",
    "accords": "...",
    "notes": "..."
}

PROMPT_TEMPLATE = """
    # String con el template del prompt
    # Debe contener estos placeholders:
    # {lugar_nombre}, {lugar_tipo}, {lugar_descripcion}
    # {fecha_evento}, {hora_evento}, {momento_dia}
    # {clima_descripcion}, {temperatura}, {humedad}
    # {estacion}, {ocasion}, {expectativa}, {vestimenta}
    # {perfumes_text}
"""
```

## Idiomas actualmente soportados

El sistema detecta automáticamente los idiomas basándose en los archivos en `languages/`.

Para ver los idiomas soportados en tiempo real:
```python
from app.i18n.config import SUPPORTED_LANGUAGES
print(SUPPORTED_LANGUAGES)  # Ej: ['es', 'en', 'fr', 'pt']
```

## Configuración

- **Idioma por defecto**: Español (`es`)
- **Fallback**: Si se solicita un idioma no soportado, se usa el idioma por defecto
- **Validación**: El schema de Pydantic valida automáticamente contra `SUPPORTED_LANGUAGES`

## Testing

Para probar un nuevo idioma:

1. Crea el archivo de traducción (ej: `fr.py`)
2. Reinicia el backend (o espera el auto-reload)
3. Envía una petición con `idioma: "fr"`:

```json
{
  "fecha_evento": "2025-10-11",
  "hora_evento": "18:00",
  "latitud": -34.9011,
  "longitud": -56.1645,
  "lugar_nombre": "Restaurante",
  "lugar_tipo": "cerrado",
  "lugar_descripcion": "Cena romántica",
  "ocasion": "Cita",
  "expectativa": "Elegante",
  "vestimenta": "Formal",
  "idioma": "fr"
}
```

4. La IA responderá en francés usando el template de `fr.py`

## Ventajas de este sistema

- ✅ **Escalable**: Agregar idiomas sin modificar código
- ✅ **Mantenible**: Un archivo por idioma, fácil de localizar
- ✅ **Automático**: Detección y validación dinámica
- ✅ **Robusto**: Fallback al idioma por defecto ante errores
- ✅ **Type-safe**: Validación en Pydantic schema
