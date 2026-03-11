"""
Normalizador de notas y acordes.
Traduce términos en inglés a español antes de guardar en BD.
La BD siempre almacena en español como fuente de verdad.
"""
from typing import List, Optional

from app.i18n.acordes_es_en import ACORDES_ES_EN
from app.i18n.notas_es_en import NOTAS_ES_EN

# Mapeos inversos: inglés → español
_ACORDES_EN_ES = {v.lower(): k for k, v in ACORDES_ES_EN.items()}
_NOTAS_EN_ES = {v.lower(): k for k, v in NOTAS_ES_EN.items()}


def normalize_acorde(acorde: str) -> str:
    """Normaliza un acorde a español. Si ya está en español o no se encuentra, se devuelve tal cual."""
    # Si ya existe como clave en español, devolverlo tal cual
    if acorde in ACORDES_ES_EN:
        return acorde
    # Buscar en mapeo inverso (inglés → español), case-insensitive
    result = _ACORDES_EN_ES.get(acorde.lower())
    return result if result else acorde


def normalize_nota(nota: str) -> str:
    """Normaliza una nota a español. Si ya está en español o no se encuentra, se devuelve tal cual."""
    if nota in NOTAS_ES_EN:
        return nota
    result = _NOTAS_EN_ES.get(nota.lower())
    return result if result else nota


def normalize_acordes(acordes: Optional[List[str]]) -> Optional[List[str]]:
    """Normaliza una lista de acordes a español."""
    if not acordes:
        return acordes
    return [normalize_acorde(a) for a in acordes]


def normalize_notas(notas: Optional[List[str]]) -> Optional[List[str]]:
    """Normaliza una lista de notas a español."""
    if not notas:
        return notas
    return [normalize_nota(n) for n in notas]
