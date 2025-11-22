# sillage-backend/app/i18n/languages/es.py
"""
Traducciones en español para prompts de IA
"""

# Diccionario de estaciones (hemisferio sur)
SEASONS = {
    1: "verano", 2: "verano", 3: "otoño", 4: "otoño",
    5: "invierno", 6: "invierno", 7: "invierno",
    8: "primavera", 9: "primavera", 10: "primavera",
    11: "verano", 12: "verano"
}

# Momentos del día
TIME_OF_DAY = {
    "morning": "mañana",
    "afternoon": "tarde",
    "night": "noche"
}

# Etiquetas para información de perfumes
PERFUME_LABELS = {
    "perfumer": "perfumista",
    "accords": "acordes",
    "notes": "notas"
}

# Template del prompt para Gemini
PROMPT_TEMPLATE = """Eres un experto perfumista. Recomienda el perfume MÁS ADECUADO de esta colección para el siguiente contexto:

## CONTEXTO DEL EVENTO
- Lugar: {lugar_descripcion} ({lugar_tipo})
- Fecha y hora: {fecha_evento} {hora_evento} ({momento_dia})
- Clima: {clima_descripcion}, {temperatura}°C, {humedad}% de humedad
- Estación: {estacion}
- Ocasión: {ocasion}
- Expectativa: {expectativa}
- Vestimenta: {vestimenta}

## PERFUMES DISPONIBLES (ANONIMIZADOS)
{perfumes_text}

## INSTRUCCIONES
1. Analiza el contexto completo
2. Considera especialmente el clima, la hora y el tipo de lugar
3. Evalúa las notas y acordes de cada perfume en relación con el clima y la temperatura
4. No te dejes influenciar por el orden en que aparecen los perfumes
5. Basa tu decisión ÚNICAMENTE en la compatibilidad de acordes y notas con el contexto
6. Elige SOLO UN perfume de la lista
7. Explica brevemente (3-4 líneas) por qué es ideal para este contexto

FORMATO DE RESPUESTA (OBLIGATORIO):
Perfume [número]
[Breve explicación de por qué es perfecto para esta ocasión]
"""
