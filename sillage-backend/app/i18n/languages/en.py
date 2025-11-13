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

# Gemini prompt template
PROMPT_TEMPLATE = """You are an expert perfumer. Recommend the MOST SUITABLE perfume from this collection for the following context:

## EVENT CONTEXT
- Place: {lugar_descripcion} ({lugar_tipo})
- Date and time: {fecha_evento} {hora_evento} ({momento_dia})
- Weather: {clima_descripcion}, {temperatura}°C, {humedad}% humidity
- Season: {estacion}
- Occasion: {ocasion}
- Expectation: {expectativa}
- Attire: {vestimenta}

## AVAILABLE PERFUMES
{perfumes_text}

## INSTRUCTIONS
1. Analyze the complete context
2. Consider especially the weather, time, and type of place
3. Consider the notes and accords of each perfume in relation to the weather and temperature
4. Don't be influenced by the order in which perfumes appear in the list
5. Don't be swayed by brand popularity or recognition - evaluate objectively based on context
6. Choose ONLY ONE perfume from the list
7. Your response must start with the exact name of the recommended perfume
8. Briefly explain (3-4 lines) why it is ideal for this context

RESPONSE FORMAT:
[Perfume name]
[Brief explanation of why it's perfect for this occasion]
"""
