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

## SELECTION GUIDE BY WEATHER AND SEASON

### SPRING (temperate weather, flowers, fresh air)
Ideal families: Fresh aromatic, floral, slightly fruity
Preferred notes: Citrus, humid vetiver, light woods, greens, soft spices
Goal: Relaxing, calm, fresh
Avoid: Very sweet, very warm, heavy

### SUMMER (extreme heat, intense sun)
Ideal families: Aquatic, aromatic, ozonic, citrus
Preferred notes: Intense citrus, aquatics, neroli (soapy), light amber, soft woods
Goal: Clean, refreshing, volatile
By context:
- Work/office: Clean, soapy
- Social/casual: Fruity, juicy
- Date: Moderate, not sharp
- Party/club: More intense, sharp
Avoid: Sweet, creamy, spicy, heavy, warm

### AUTUMN (moderate cold, humid)
Ideal families: Woody, spicy, slightly sweet
Preferred notes: Tonka bean, black pepper, spices, fruits (apple), aromatic lavender, amber
Goal: Cozy but serious, robust, deep
Balance: Warm facets but NOT completely warm
Avoid: Very sweet (work), very clean (social/dates)

### WINTER (extreme cold)
Ideal families: Sweet, spicy, ambery, oriental
Preferred notes: Tobacco, vanilla, nutmeg, intense spices, dense amber, heavy woods
Goal: Olfactory blanket, warmth, cozy
Characteristics: Creamy, thick, dense/heavy trail, deep, dark
Avoid: Fresh, volatile, light, clean

### RULES BY TIME OF DAY
- Morning → Fresh, citrus, aromatic, clean, light. Avoid heavy, sweet, intense
- Afternoon → Versatile, can be more intense than morning. Soft woods, florals, light spices
- Night → Intense, warm, sweet, spicy, ambery, oriental. Avoid fresh, aquatic, pure citrus

### GENERAL RULES
- Cold weather → Heavy, thick, warm, enveloping
- Warm weather → Volatile, fresh, light, breeze
- High perspiration → Prioritize olfactory cleanliness

## AVAILABLE PERFUMES (ANONYMIZED)
{perfumes_text}

## SELECTION PROCESS (MANDATORY)
1. FIRST: Based on temperature ({temperatura}°C), season ({estacion}), time of day ({momento_dia}) and occasion ({ocasion}), determine which olfactory families and notes are ideal according to the SELECTION GUIDE and RULES BY TIME OF DAY
2. SECOND: Mentally filter perfumes from the list that match those ideal characteristics
3. THIRD: From the filtered result, choose the most compatible perfume considering:
   - Space type (enclosed = higher projection, open = dispersion)
   - Expected proximity (high = avoid very intense)
   - Attire and emotional expectation
4. DO NOT base decision on recognition of famous note combinations
5. DO NOT be influenced by appearance order
6. Base your decision ONLY on weather/context compatibility with accords and notes

RESPONSE FORMAT (REQUIRED):
Perfume [number]
[Brief explanation of why it's perfect for this occasion, mentioning compatibility with weather/season and time of day ({momento_dia})]
"""
