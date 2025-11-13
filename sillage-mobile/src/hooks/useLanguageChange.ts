import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook para forzar re-render cuando cambia el idioma
 * Útil para componentes que necesitan actualizar estado basado en traducciones
 */
export const useLanguageChange = (callback?: () => void) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
      if (callback) {
        callback();
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, callback]);

  return language;
};
