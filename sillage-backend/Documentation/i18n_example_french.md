# Ejemplo: Cómo agregar soporte para Francés

Este documento muestra paso a paso cómo agregar francés como nuevo idioma al sistema.

## Paso 1: Crear el archivo de traducción

Crea el archivo `app/i18n/languages/fr.py` con el siguiente contenido:

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

## Paso 2: ¡El backend ya está listo!

**No necesitas modificar ningún otro archivo en el backend.** El sistema:
- ✅ Detectará automáticamente `fr.py` en el directorio `languages/`
- ✅ Agregará "fr" a la lista de idiomas soportados
- ✅ Validará las peticiones con `idioma: "fr"`
- ✅ Usará el prompt en francés cuando se solicite

## Paso 3: Frontend - Agregar traducciones de UI

En el frontend, necesitas crear los archivos de traducción para la interfaz:

### 3.1: Crear archivos JSON de traducción

Crea la carpeta `sillage-mobile/src/i18n/locales/fr/` y agrega los archivos:

**`sillage-mobile/src/i18n/locales/fr/common.json`**
```json
{
  "appName": "Sillage",
  "loading": "Chargement...",
  "error": "Erreur",
  "success": "Succès",
  "cancel": "Annuler",
  "confirm": "Confirmer",
  "save": "Enregistrer",
  "delete": "Supprimer",
  "edit": "Modifier",
  "search": "Rechercher",
  "noResults": "Aucun résultat trouvé",
  "retry": "Réessayer"
}
```

**`sillage-mobile/src/i18n/locales/fr/auth.json`**
```json
{
  "login": {
    "title": "Connexion",
    "email": "Email",
    "password": "Mot de passe",
    "submit": "Se connecter",
    "noAccount": "Pas de compte?",
    "signUp": "S'inscrire"
  },
  "register": {
    "title": "Inscription",
    "name": "Nom",
    "email": "Email",
    "password": "Mot de passe",
    "submit": "S'inscrire",
    "hasAccount": "Déjà un compte?",
    "signIn": "Se connecter"
  }
}
```

(Continúa con los demás archivos: `collection.json`, `profile.json`, `history.json`, `recommend.json`, `result.json`, `components.json`)

### 3.2: Registrar el idioma en i18n

Edita `sillage-mobile/src/i18n/index.ts`:

```typescript
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frCollection from './locales/fr/collection.json';
import frProfile from './locales/fr/profile.json';
import frHistory from './locales/fr/history.json';
import frRecommend from './locales/fr/recommend.json';
import frResult from './locales/fr/result.json';
import frComponents from './locales/fr/components.json';

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

## Paso 4: Probar

### Backend
Envía una petición con `idioma: "fr"`:

```bash
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "fecha_evento": "2025-10-11",
    "hora_evento": "18:00",
    "latitud": -34.9011,
    "longitud": -56.1645,
    "lugar_nombre": "Restaurant",
    "lugar_tipo": "cerrado",
    "lugar_descripcion": "Dîner romantique",
    "ocasion": "Rendez-vous",
    "expectativa": "Élégant",
    "vestimenta": "Formel",
    "idioma": "fr"
  }'
```

La IA responderá en francés!

### Frontend
El selector de idioma automáticamente mostrará "Français" como opción. Cuando el usuario lo seleccione:
- ✅ Toda la UI cambiará a francés
- ✅ Las recomendaciones de IA vendrán en francés
- ✅ El idioma se guardará en AsyncStorage

## Resumen

Para agregar **cualquier nuevo idioma**:

1. **Backend**: Crear `app/i18n/languages/[codigo].py` con las 4 constantes requeridas
2. **Frontend**: Crear archivos JSON en `sillage-mobile/src/i18n/locales/[codigo]/`
3. **Frontend**: Registrar en `sillage-mobile/src/i18n/index.ts`
4. **¡Listo!** El sistema automáticamente soporta el nuevo idioma

**Archivos que NO necesitas modificar:**
- ❌ `app/schemas/recommendation.py` - Validación automática
- ❌ `app/services/gemini.py` - Carga dinámica
- ❌ `app/i18n/config.py` - Detección automática
- ❌ `app/i18n/loader.py` - Funciona con cualquier idioma
- ❌ Backend routes o endpoints - Sin cambios necesarios
