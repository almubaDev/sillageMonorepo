# sillage-backend/app/i18n/languages/en.py
"""
English translations for AI prompts
"""

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
- Address: {direccion}
- Place: {lugar_descripcion}
- Space type: {tipo_espacio_desc}
- Date and time: {fecha_evento} {hora_evento} ({momento_dia})
- Weather: {clima_descripcion}, {temperatura}°C, {humedad}% humidity
- Occasion: {ocasion}
- Expected proximity: {proximidad}
- Emotional expectation: {expectativa}
- Attire: {vestimenta}

## CRITICAL RULE: DETERMINE SEASON
- From the ADDRESS provided, identify the exact country and geographic region
- Use the DATE, ACTUAL TEMPERATURE ({temperatura}°C) and WEATHER DESCRIPTION ({clima_descripcion}) as primary evidence to determine the season
- DO NOT assume the season based solely on hemisphere + month. Different countries in the same hemisphere can have very different climates (e.g., tropical Colombia vs temperate Chile, both in the southern hemisphere)
- If the address indicates a tropical country (between Tropic of Cancer and Capricorn): They DO NOT have 4 traditional seasons, they have dry/rainy seasons. Base your selection on the ACTUAL temperature and weather provided
- If the address indicates a temperate zone: determine the season considering the specific geographic location + date + actual reported weather
- ACTUAL temperature and weather always take priority over any theoretical season calculation
- USE the season/climate context you determine as a key factor in your selection

## CRITICAL RULE: DO NOT ASSUME
- Base your recommendation ONLY on the data provided above
- DO NOT assume conditions not explicitly stated (e.g., air conditioning, heating, ventilation, etc.)
- If space is "enclosed", it only means no wind/dispersion, DO NOT assume climate control
- The actual ambient temperature is indicated in "Weather" - use it as the main reference
- DO NOT invent details about the place, people, or circumstances

## SELECTION RULE: ACCORDS FIRST, NOTES TO DISAMBIGUATE
- STEP 1: Filter perfumes whose ACCORDS match the ideal accords for the context (season + space + occasion + expectation + attire)
- STEP 2: If multiple perfumes have equally compatible accords, DIFFERENTIATE by NOTES — choose the one with the most notes present in the ideal notes lists for the context
- Accords are the primary criterion (olfactory family). Notes are the tiebreaker (specific ingredients)

## SELECTION GUIDE BY SEASON

### SUMMER
Ideal accords: Aquatic, Citrus, Marine, Ozonic, Fresh, Soapy, Musky, Salty, Tropical, Green
Ideal notes: Bergamot, Sea water, Seaweed, Grapefruit, Lemon, Neroli, Mint, Cucumber, Coconut, White musk, Bamboo, Green tea, White tea, Lemon verbena, Yuzu, Lime, Mandarin, Lemongrass, Lotus flower, Lychee, Pineapple, Orange, White sandalwood
Avoid: Sweet, creamy, heavy spicy, warm

### AUTUMN
Ideal accords: Woody, Aromatic, Soft spicy, Spicy, Lavender, Herbal, Amber, Earthy, Mossy, Warm spicy
Ideal notes: Tonka, Vetiver, Lavender, Black pepper, Apple, Bergamot, Sandalwood, Cedar, Patchouli, Saffron, White tobacco, Amber, Ambergris, Oak moss, Violet, Cinnamon, Cardamom, Fig, Plum, Ginger, Nutmeg, Honey
Avoid: Very sweet (work), very clean/light (social)

### WINTER
Ideal accords: Oud, Oriental, Amber, Vanilla, Gourmand, Smoky, Tobacco, Warm spicy, Balsamic, Spicy, Sweet
Ideal notes: Tobacco, Vanilla, Tonka, Nutmeg, Frankincense, Myrrh, Benzoin, Ambergris, Black amber, Leather, Sandalwood, Agarwood, Cinnamon, Clove, Patchouli, Vetiver, Dark chocolate, Dried plum, Dates, Rum, Caramel, Black pepper, Espresso
Avoid: Fresh, volatile, light, clean

### SPRING
Ideal accords: Yellow floral, White floral, Floral, Fresh, Green, Herbal, Aromatic, Citrus, Fresh spicy, Mossy
Ideal notes: Bergamot, Neroli, Vetiver, Jasmine, Rose, Peony, Violet, Lavender, Basil, Green tea, Iris, Geranium, Magnolia, Ylang-ylang, Mint, Bamboo, Green grass, Oak moss, Cherry blossom, Gardenia, Lilac, Tuberose, Mandarin, Lotus flower, Orchid, Peach, Lime
Avoid: Very sweet, very warm, heavy

### GENERAL RULES
- Cold weather → Heavy, thick, warm, enveloping
- Warm weather → Volatile, fresh, light, breeze
- High perspiration → Prioritize olfactory cleanliness

## SELECTION GUIDE BY SPACE TYPE

### OPEN (outdoor, parks, beaches)
Ideal accords: Fresh, Aquatic, Green, Herbal, Aromatic, Citrus, Ozonic, Marine, Coniferous, Terpenic
Ideal notes: Bergamot, Grapefruit, Sea water, Seaweed, Mint, Rosemary, Lavender, Lemon verbena, Green tea, Bamboo, Vetiver, Cedar, Lime, Eucalyptus, Lemongrass, Orange, Mandarin, Geranium

### ENCLOSED (offices, restaurants, homes)
Ideal accords: White floral, Musky, Soapy, Powdery, Soft spicy, Woody, Iris, Aromatic
Ideal notes: Iris, White musk, Vanilla (light), Sandalwood, Jasmine, Rose, Cedar, Bergamot, Neroli, White tea, Green tea, Violet, Magnolia, Peony, Lotus flower, Lilac, Gardenia

## SELECTION GUIDE BY OCCASION

### WORK
Ideal accords: Aromatic, Fresh, Herbal, Citrus, Fresh spicy, Green, Soapy, Woody
Ideal notes: Bergamot, Neroli, Lavender, Cedar, Vetiver, Bamboo, Green tea, Iris, White musk, Geranium, Sandalwood, Rosemary, Lime, Mandarin, Cucumber, Magnolia

### ROMANTIC DATE
Ideal accords: Oud, Oriental, Musky, White floral, Soft spicy, Vanilla, Amber, Rose
Ideal notes: Agarwood, Vanilla, Rose, Jasmine, Ambergris, Mysore sandalwood, Musk, Bamboo, Coconut, Ylang-ylang, Cardamom, Frankincense, Tonka, Iris, Patchouli, Tuberose, Orchid, Gardenia, Peach, Pink pepper

### PARTY
Ideal accords: Oriental, Oud, Spicy, Warm spicy, Amber, Vanilla, Rose, Fruity, Leather
Ideal notes: Ambergris, Agarwood, Vanilla, Rose, Frankincense, Leather, Patchouli, Tobacco, Cardamom, Ylang-ylang, Sandalwood, Vetiver, Cinnamon, Tonka, Black musk, Benzoin, Rum, Black pepper, Ginger, Tuberose, Plum, Raspberry

### CASUAL
Ideal accords: Fresh, Citrus, Fruity, Herbal, Aromatic, Green, Aquatic
Ideal notes: Bergamot, Orange, Grapefruit, Apple, Bamboo, Coconut water, Green tea, Lavender, Mint, Cedar, White musk, Lemon verbena, Yuzu, Lime, Mandarin, Peach, Lychee, Raspberry, Green grass

### FORMAL EVENT
Ideal accords: Woody, Leather, White floral, Soft spicy, Iris, Amber, Musky, Aldehydic
Ideal notes: Iris, Rose, Jasmine, Mysore sandalwood, Ambergris, Vetiver, Leather, Frankincense, Cedar, Aldehydes, Oak moss, Vanilla, Ylang-ylang, Tonka, Patchouli, Tuberose, Magnolia, Gardenia, Orchid, Pink pepper

### SPORTS ACTIVITY
Ideal accords: Fresh, Aquatic, Citrus, Aromatic, Ozonic, Soapy
Ideal notes: Bergamot, Lime, Grapefruit, Mint, Eucalyptus, Lavender, Sea water, Aloe vera, Cedar, White musk, Green tea, Rosemary, Yuzu, Lemon, Orange, Cucumber, Lemongrass

## SELECTION GUIDE BY EMOTIONAL EXPECTATION

### CONFIDENT
Ideal accords: Leather, Woody, Spicy, Aromatic, Oud, Tobacco
Ideal notes: Vetiver, Leather, Cedar, Tobacco, Sandalwood, Patchouli, Bergamot, Black pepper, Agarwood, Tonka, Benzoin, Frankincense, Myrrh, Ginger, Cardamom, Oak moss

### SEDUCTIVE
Ideal accords: Oud, Oriental, Musky, Soft spicy, Vanilla, Amber, White floral, Rose
Ideal notes: Agarwood, Madagascar vanilla, Rose, Jasmine, Ambergris, Mysore sandalwood, Musk, Ylang-ylang, Cardamom, Frankincense, Tonka, Patchouli, Benzoin, Tuberose, Black orchid, Pink pepper, Cinnamon, Fig

### FRESH
Ideal accords: Aquatic, Citrus, Ozonic, Marine, Green, Fresh, Soapy
Ideal notes: Bergamot, Lime, Lemon, Cucumber, Mint, Seaweed, Sea water, Pine needles, Green tea, Aloe vera, Yuzu, Lemon verbena, Neroli, Mandarin, Lemongrass, Eucalyptus, Lotus flower, Orange

### ELEGANT
Ideal accords: Iris, White floral, Woody, Amber, Leather, Aldehydic, Soft spicy, Musky
Ideal notes: Iris, Rose, Jasmine, Mysore sandalwood, Frankincense, Vetiver, Aldehydes, Ambergris, Cedar, Oak moss, Leather, Vanilla (subtle), Ylang-ylang, Tonka, Tuberose, Magnolia, Orchid, Gardenia, Patchouli

### ENERGETIC
Ideal accords: Citrus, Aromatic, Spicy, Fresh spicy, Green, Herbal
Ideal notes: Orange, Lemon, Lime, Bergamot, Black pepper, Cardamom, Mint, Lavender, Rosemary, Ginger, Grapefruit, Yuzu, Basil, Mandarin, Eucalyptus, Lemongrass, Pink pepper

### RELAXED
Ideal accords: Lavender, Herbal, Fresh, Aromatic, Musky, Soapy, Vanilla
Ideal notes: Lavender, Chamomile, Sandalwood, Benzoin, Vanilla (light), Cedar, White musk, Sweet grass, Rooibos tea, White tea, Aloe vera, Bergamot, Apple, Neroli, Lotus flower, Iris, Magnolia, Lilac, Fig

### PROFESSIONAL
Ideal accords: Aromatic, Fresh, Citrus, Herbal, Green, Woody, Soapy
Ideal notes: Bergamot, Lavender, Cedar, Vetiver, Iris, Green tea, Bamboo, White musk, Geranium, White sandalwood, Neroli, Rosemary, Lime, Mandarin, Cucumber, Magnolia

### CREATIVE
Ideal accords: Oriental, Spicy, Oud, Smoky, Herbal, Iris, Tobacco
Ideal notes: Agarwood, Frankincense, Cardamom, Leather, Tobacco, Myrrh, Patchouli, Saffron, Black amber, Benzoin, Vetiver, Absinthe, Black violet, Oak moss, Tonka, Cannabis, Ginger, Sichuan pepper, Tuberose, Black orchid, Black fig

## SELECTION GUIDE BY ATTIRE

### FORMAL (suit, tie, formal wear)
Ideal accords: Woody, Leather, White floral, Soft spicy, Iris, Amber, Aldehydic, Musky
Ideal notes: Iris, Mysore sandalwood, Cedar, Leather, Vetiver, Vanilla (subtle), Amber, Rose, Frankincense, Oak moss, Aldehydes, Tonka, Patchouli, Tuberose, Magnolia, Jasmine, Gardenia

### SEMI-FORMAL (blazer casual, no tie)
Ideal accords: Woody, Aromatic, Yellow floral, Soft spicy, Amber, Iris, Green
Ideal notes: Bergamot, Lavender, Cedar, Sandalwood, Iris, Patchouli, Vetiver, Amber, Rose, Geranium, Tonka, Bamboo, White musk, Neroli, Cardamom, Pink pepper, Mandarin, Magnolia

### CASUAL (jeans, t-shirt, sneakers)
Ideal accords: Fresh, Citrus, Aquatic, Herbal, Green, Aromatic, Fruity, Soapy
Ideal notes: Bergamot, Orange, Apple, Grapefruit, Sea water, Bamboo, Green grass, Lavender, Cedar, White musk, Green tea, Lemon verbena, Mint, Lime, Mandarin, Cucumber, Peach, Lychee, Raspberry

### SPORTY (technical wear, athleisure)
Ideal accords: Fresh, Aquatic, Citrus, Ozonic, Aromatic, Soapy
Ideal notes: Bergamot, Lime, Grapefruit, Mint, Eucalyptus, Lavender, Sea water, Aloe vera, Cedar, White musk, Green tea, Yuzu, Rosemary, Lemon, Orange, Cucumber, Lemongrass

## AVAILABLE PERFUMES (ANONYMIZED)
{perfumes_text}

## SELECTION PROCESS (MANDATORY)
1. FIRST: Determine the season (or climate period) from the address, date, actual temperature and reported weather. DO NOT use hemisphere + month alone
2. SECOND: Cross-reference the ideal accords from all 5 dimensions (season + space + occasion + expectation + attire). Identify accords that appear in MULTIPLE dimensions — those are the most important
3. THIRD: Filter perfumes whose ACCORDS have the highest overlap with the cross-referenced ideal accords
4. FOURTH: If there is a tie or ambiguity between perfumes with similar accords, BREAK THE TIE BY NOTES — choose the perfume with the most notes present in the ideal notes lists for the context
5. FIFTH: Final adjustment considerations:
   - Space type (enclosed = moderate projection, open = can be bolder)
   - Expected proximity (high = avoid very intense)
   - Actual temperature ({temperatura}°C) as final validation
6. DO NOT base decision on recognition of famous note combinations
7. DO NOT be influenced by appearance order
8. Base your decision ONLY on context/accords/notes compatibility

RESPONSE FORMAT (REQUIRED):
Perfume [number]
[Brief explanation of why it's suitable, mentioning: the season you determined for that place and date, weather ({temperatura}°C), time of day ({momento_dia}), occasion ({ocasion}). DO NOT mention assumed conditions like air conditioning, heating, etc.]
"""
