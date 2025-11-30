import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// Importar traducciones
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esCollection from './locales/es/collection.json';
import esProfile from './locales/es/profile.json';
import esHistory from './locales/es/history.json';
import esRecommend from './locales/es/recommend.json';
import esResult from './locales/es/result.json';
import esComponents from './locales/es/components.json';
import esPayments from './locales/es/payments.json';
import esAdmin from './locales/es/admin.json';
import esLanding from './locales/es/landing.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enCollection from './locales/en/collection.json';
import enProfile from './locales/en/profile.json';
import enHistory from './locales/en/history.json';
import enRecommend from './locales/en/recommend.json';
import enResult from './locales/en/result.json';
import enComponents from './locales/en/components.json';
import enPayments from './locales/en/payments.json';
import enAdmin from './locales/en/admin.json';
import enLanding from './locales/en/landing.json';

const LANGUAGE_KEY = '@sillage_language';

// Recursos de traducción
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
    payments: esPayments,
    admin: esAdmin,
    landing: esLanding,
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
    payments: enPayments,
    admin: enAdmin,
    landing: enLanding,
  },
};

// Detectar idioma del dispositivo
const getDeviceLanguage = (): string => {
  try {
    // En web, puede ser undefined o null
    const deviceLocale = Localization.locale || Localization.locales?.[0] || navigator?.language || 'es-ES';

    // Extraer código de idioma (ej: 'es-MX' -> 'es')
    const languageCode = typeof deviceLocale === 'string'
      ? deviceLocale.split('-')[0].toLowerCase()
      : 'es';

    // Si el idioma está soportado, usarlo; sino, español por defecto
    return ['es', 'en'].includes(languageCode) ? languageCode : 'es';
  } catch (error) {
    // console.log('Error detecting device language, using default (es):', error);
    return 'es';
  }
};

// Obtener idioma guardado o detectar del dispositivo
const getInitialLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    // console.log('Error loading saved language:', error);
  }

  return getDeviceLanguage();
};

// Inicializar i18next
const initI18n = async () => {
  const initialLanguage = await getInitialLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: initialLanguage,
      fallbackLng: 'es',
      defaultNS: 'common',
      ns: ['common', 'auth', 'collection', 'profile', 'history', 'recommend', 'result', 'components', 'payments', 'admin', 'landing'],
      interpolation: {
        escapeValue: false, // React ya hace escape
      },
      react: {
        useSuspense: false,
      },
    });

  // console.log(`🌍 i18n initialized with language: ${initialLanguage}`);
};

// Cambiar idioma y guardar preferencia
export const changeLanguage = async (languageCode: string) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    // console.log(`🌍 Language changed to: ${languageCode}`);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Obtener idioma actual
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

// Exportar la inicialización
export { initI18n };
export default i18n;
