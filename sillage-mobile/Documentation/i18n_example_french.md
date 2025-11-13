# Ejemplo: Agregar Francés al Frontend

Este documento muestra paso a paso cómo agregar soporte para francés en la aplicación móvil.

## Paso 1: Crear Estructura de Archivos

Crea la carpeta `src/i18n/locales/fr/` con los siguientes archivos:

### 1.1 common.json

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
  "retry": "Réessayer",
  "close": "Fermer",
  "back": "Retour",
  "next": "Suivant",
  "finish": "Terminer"
}
```

### 1.2 auth.json

```json
{
  "login": {
    "title": "Connexion",
    "email": "Email",
    "password": "Mot de passe",
    "submit": "Se connecter",
    "noAccount": "Pas de compte?",
    "signUp": "S'inscrire",
    "errors": {
      "invalidEmail": "Email invalide",
      "invalidPassword": "Mot de passe invalide",
      "loginFailed": "Échec de la connexion"
    }
  },
  "register": {
    "title": "Inscription",
    "name": "Nom",
    "email": "Email",
    "password": "Mot de passe",
    "confirmPassword": "Confirmer le mot de passe",
    "submit": "S'inscrire",
    "hasAccount": "Déjà un compte?",
    "signIn": "Se connecter",
    "errors": {
      "invalidName": "Nom invalide",
      "invalidEmail": "Email invalide",
      "invalidPassword": "Le mot de passe doit contenir au moins 6 caractères",
      "passwordMismatch": "Les mots de passe ne correspondent pas",
      "registerFailed": "Échec de l'inscription"
    }
  }
}
```

### 1.3 collection.json

```json
{
  "title": "Ma Collection",
  "searchPlaceholder": "Rechercher un parfum...",
  "addPerfume": "Ajouter un parfum",
  "empty": {
    "title": "Aucun parfum",
    "message": "Ajoutez vos premiers parfumes à votre collection"
  },
  "createModal": {
    "title": "Nouveau Parfum",
    "name": "Nom du parfum",
    "brand": "Marque",
    "perfumer": "Parfumeur",
    "notes": "Notes (séparées par des virgules)",
    "accords": "Accords (séparés par des virgules)",
    "submit": "Créer",
    "cancel": "Annuler",
    "success": "Parfum créé avec succès",
    "errors": {
      "nameRequired": "Le nom est requis",
      "brandRequired": "La marque est requise",
      "createFailed": "Échec de la création du parfum"
    }
  },
  "deleteModal": {
    "title": "Supprimer le parfum",
    "message": "Êtes-vous sûr de vouloir supprimer ce parfum? Cette action ne peut pas être annulée.",
    "confirm": "Supprimer",
    "cancel": "Annuler",
    "success": "Parfum supprimé",
    "error": "Échec de la suppression"
  }
}
```

### 1.4 profile.json

```json
{
  "title": "Profil",
  "language": "Langue",
  "logout": "Déconnexion",
  "logoutConfirm": {
    "title": "Déconnexion",
    "message": "Êtes-vous sûr de vouloir vous déconnecter?",
    "confirm": "Déconnexion",
    "cancel": "Annuler"
  }
}
```

### 1.5 history.json

```json
{
  "title": "Historique",
  "loading": "Chargement de l'historique...",
  "error": "Erreur lors du chargement de l'historique",
  "empty": {
    "title": "Aucune recommandation",
    "message": "Vous n'avez pas encore de recommandations"
  },
  "card": {
    "noPerfume": "Aucun parfum assigné",
    "viewDetails": "Voir les détails"
  }
}
```

### 1.6 recommend.json

```json
{
  "title": "Nouvelle Recommandation",
  "navigation": {
    "back": "Retour",
    "next": "Suivant",
    "finish": "Terminer"
  },
  "step1": {
    "title": "Sélectionner la Date",
    "subtitle": "Quand aura lieu l'événement?",
    "selectDate": "Sélectionner une date",
    "today": "Aujourd'hui",
    "error": "Veuillez sélectionner une date valide"
  },
  "step2": {
    "title": "Sélectionner l'Heure",
    "subtitle": "À quelle heure aura lieu l'événement?",
    "selectTime": "Sélectionner une heure",
    "error": "Veuillez sélectionner une heure valide"
  },
  "step3": {
    "title": "Type de Lieu",
    "subtitle": "L'événement aura-t-il lieu à l'intérieur ou à l'extérieur?",
    "indoor": "Intérieur",
    "outdoor": "Extérieur",
    "error": "Veuillez sélectionner un type de lieu"
  },
  "step4": {
    "title": "Occasion",
    "subtitle": "Quelle est l'occasion?",
    "placeholder": "Ex: Dîner romantique, réunion d'affaires...",
    "error": "Veuillez décrire l'occasion"
  },
  "step5": {
    "title": "Attente",
    "subtitle": "Quelle impression voulez-vous donner?",
    "placeholder": "Ex: Élégant, décontracté, professionnel...",
    "error": "Veuillez décrire votre attente"
  },
  "step6": {
    "title": "Tenue",
    "subtitle": "Comment allez-vous vous habiller?",
    "placeholder": "Ex: Costume, robe décontractée, sportif...",
    "error": "Veuillez décrire votre tenue"
  },
  "step7": {
    "title": "Résumé",
    "subtitle": "Vérifiez les informations",
    "date": "Date",
    "time": "Heure",
    "placeType": "Type de lieu",
    "occasion": "Occasion",
    "expectation": "Attente",
    "clothing": "Tenue",
    "location": "Lieu"
  },
  "step8": {
    "title": "Sélectionner le Lieu",
    "subtitle": "Où aura lieu l'événement?",
    "searchPlaceholder": "Rechercher un lieu...",
    "gettingLocation": "Obtention de votre position...",
    "errors": {
      "locationPermission": "Permission de localisation refusée",
      "locationUnavailable": "Position non disponible",
      "locationTimeout": "Délai de localisation dépassé",
      "searchFailed": "Échec de la recherche"
    }
  },
  "loading": {
    "title": "Génération de la recommandation",
    "message": "L'IA analyse votre contexte...",
    "wait": "Cela peut prendre quelques secondes"
  },
  "errors": {
    "createFailed": "Échec de la création de la recommandation",
    "noPerfumes": "Vous n'avez pas de parfums dans votre collection"
  }
}
```

### 1.7 result.json

```json
{
  "title": "Votre Recommandation",
  "recommended": "Parfum Recommandé",
  "explanation": "Pourquoi ce parfum?",
  "eventDetails": "Détails de l'Événement",
  "date": "Date",
  "time": "Heure",
  "place": "Lieu",
  "placeType": "Type",
  "occasion": "Occasion",
  "expectation": "Attente",
  "clothing": "Tenue",
  "weather": "Météo",
  "actions": {
    "newRecommendation": "Nouvelle Recommandation",
    "viewHistory": "Voir l'Historique"
  },
  "loading": "Chargement de la recommandation...",
  "error": "Erreur lors du chargement"
}
```

### 1.8 components.json

```json
{
  "confirmModal": {
    "defaultTitle": "Confirmer",
    "defaultMessage": "Êtes-vous sûr?",
    "confirm": "Confirmer",
    "cancel": "Annuler"
  },
  "languageSelector": {
    "title": "Sélectionner la Langue",
    "spanish": "Espagnol",
    "english": "Anglais",
    "french": "Français"
  }
}
```

## Paso 2: Registrar en index.ts

Edita `src/i18n/index.ts` y agrega las importaciones y el recurso:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStoragePlugin from 'i18next-async-storage-plugin';

// Español
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
// ... otros imports de español

// Inglés
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
// ... otros imports de inglés

// Francés - NUEVO
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frCollection from './locales/fr/collection.json';
import frProfile from './locales/fr/profile.json';
import frHistory from './locales/fr/history.json';
import frRecommend from './locales/fr/recommend.json';
import frResult from './locales/fr/result.json';
import frComponents from './locales/fr/components.json';

const resources = {
  es: {
    common: esCommon,
    auth: esAuth,
    collection: esCollection,
    profile: esProfile,
    history: esHistory,
    recommend: esRecommend,
    result: esResult,
    components: esComponents,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    collection: enCollection,
    profile: enProfile,
    history: enHistory,
    recommend: enRecommend,
    result: enResult,
    components: enComponents,
  },
  fr: { // NUEVO
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

i18n
  .use(AsyncStoragePlugin)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    ns: ['common', 'auth', 'collection', 'profile', 'history', 'recommend', 'result', 'components'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

## Paso 3: Actualizar LanguageSelector (Opcional)

Si quieres agregar francés visualmente al selector, edita `src/components/LanguageSelector.tsx`:

```typescript
const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' }, // NUEVO
];
```

## Paso 4: Backend - Crear Traducción de Prompts

Crea el archivo `sillage-backend/app/i18n/languages/fr.py`:

```python
# sillage-backend/app/i18n/languages/fr.py
"""
Traductions en français pour les prompts IA
"""

SEASONS = {
    1: "été", 2: "été", 3: "automne", 4: "automne",
    5: "hiver", 6: "hiver", 7: "hiver",
    8: "printemps", 9: "printemps", 10: "printemps",
    11: "été", 12: "été"
}

TIME_OF_DAY = {
    "morning": "matin",
    "afternoon": "après-midi",
    "night": "nuit"
}

PERFUME_LABELS = {
    "perfumer": "parfumeur",
    "accords": "accords",
    "notes": "notes"
}

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

## Paso 5: ¡Probar!

1. Reinicia la aplicación
2. Ve a Perfil
3. Selecciona "Français" en el selector de idioma
4. Toda la app debería cambiar a francés
5. Crea una recomendación - la IA responderá en francés

## Resultado

✅ Toda la interfaz en francés
✅ Prompts de IA en francés
✅ Respuestas de IA en francés
✅ Fechas formateadas en francés
✅ Idioma persistente entre sesiones

## Resumen de Archivos Creados

**Frontend:**
- `src/i18n/locales/fr/common.json`
- `src/i18n/locales/fr/auth.json`
- `src/i18n/locales/fr/collection.json`
- `src/i18n/locales/fr/profile.json`
- `src/i18n/locales/fr/history.json`
- `src/i18n/locales/fr/recommend.json`
- `src/i18n/locales/fr/result.json`
- `src/i18n/locales/fr/components.json`

**Backend:**
- `app/i18n/languages/fr.py`

**Archivos Modificados:**
- `src/i18n/index.ts` (registrar recursos)
- `src/components/LanguageSelector.tsx` (opcional)

¡Eso es todo! El sistema está completamente escalable y agregar más idiomas sigue el mismo patrón.
