# sillage-backend/app/i18n/languages/en.py
"""
English translations for AI prompts
"""

# Seasons dictionary (southern hemisphere)
SEASONS = {
    1: "summer", 2: "summer", 3: "autumn", 4: "autumn",
    5: "winter", 6: "winter", 7: "winter",
    8: "spring", 9: "spring", 10: "spring",
    11: "summer", 12: "summer"
}

# Time of day
TIME_OF_DAY = {
    "morning": "morning",
    "afternoon": "afternoon",
    "night": "night"
}

# Labels for perfume information
PERFUME_LABELS = {
    "perfumer": "perfumer",
    "accords": "accords",
    "notes": "notes"
}

# Expected proximity by occasion
PROXIMIDAD_OCASION = {
    "trabajo": "medium (professional environment, formal interactions)",
    "cita": "high (intimate moments, physical closeness)",
    "fiesta": "variable (from close conversations to dance floor)",
    "casual": "low to medium (relaxed interactions)",
    "formal": "medium (social events with close interactions)",
    "deportivo": "low (physical activity, sweating)"
}

# Gemini prompt template
PROMPT_TEMPLATE = """You are an expert perfumer. Recommend the MOST SUITABLE perfume from this collection for the following context:

## EVENT CONTEXT
- Place: {lugar_descripcion}
- Space type: {tipo_espacio_desc}
- Date and time: {fecha_evento} {hora_evento} ({momento_dia})
- Weather: {clima_descripcion}, {temperatura}°C, {humedad}% humidity
- Season: {estacion}
- Occasion: {ocasion}
- Expected proximity: {proximidad}
- Emotional expectation: {expectativa}
- Attire: {vestimenta}

## AVAILABLE PERFUMES (ANONYMIZED)
{perfumes_text}

## INSTRUCTIONS
1. Analyze the complete context
2. Consider the SPACE TYPE: in enclosed spaces perfumes project more, in open spaces they dissipate
3. Consider PROXIMITY: for high proximity avoid very intense or projecting perfumes
4. Evaluate notes and accords in relation to weather and temperature
5. Don't be influenced by the order in which perfumes appear
6. Base your decision ONLY on the compatibility of accords and notes with the context
7. Choose ONLY ONE perfume from the list
8. Briefly explain (3-4 lines) why it is ideal for this context

RESPONSE FORMAT (REQUIRED):
Perfume [number]
[Brief explanation of why it's perfect for this occasion]
"""
