# sillage-backend/app/i18n/loader.py
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

    def get_seasons(self, lang_code: str) -> Dict[int, str]:
        """Obtiene diccionario de estaciones para el idioma"""
        module = self.get_language_module(lang_code)
        return module.SEASONS

    def get_time_of_day(self, lang_code: str) -> Dict[str, str]:
        """Obtiene diccionario de momentos del día"""
        module = self.get_language_module(lang_code)
        return module.TIME_OF_DAY

    def get_perfume_labels(self, lang_code: str) -> Dict[str, str]:
        """Obtiene etiquetas de información de perfumes"""
        module = self.get_language_module(lang_code)
        return module.PERFUME_LABELS

    def get_prompt_template(self, lang_code: str) -> str:
        """Obtiene template del prompt"""
        module = self.get_language_module(lang_code)
        return module.PROMPT_TEMPLATE


# Instancia global del loader
language_loader = LanguageLoader()
