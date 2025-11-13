# sillage-backend/app/i18n/config.py
"""
Configuración de idiomas soportados
Para agregar un nuevo idioma, simplemente crea su archivo de traducción en languages/
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
