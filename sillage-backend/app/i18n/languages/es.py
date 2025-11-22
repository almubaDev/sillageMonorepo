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

# Proximidad esperada según ocasión
PROXIMIDAD_OCASION = {
    "trabajo": "media (ambiente profesional, interacciones formales)",
    "cita": "alta (momentos íntimos, cercanía física)",
    "fiesta": "variable (desde conversaciones cercanas hasta pista de baile)",
    "casual": "baja a media (interacciones relajadas)",
    "formal": "media (eventos sociales con interacciones cercanas)",
    "deportivo": "baja (actividad física, sudoración)"
}

# Template del prompt para Gemini
PROMPT_TEMPLATE = """Eres un experto perfumista. Recomienda el perfume MÁS ADECUADO de esta colección para el siguiente contexto:

## CONTEXTO DEL EVENTO
- Lugar: {lugar_descripcion}
- Tipo de espacio: {tipo_espacio_desc}
- Fecha y hora: {fecha_evento} {hora_evento} ({momento_dia})
- Clima: {clima_descripcion}, {temperatura}°C, {humedad}% de humedad
- Estación: {estacion}
- Ocasión: {ocasion}
- Proximidad esperada: {proximidad}
- Expectativa emocional: {expectativa}
- Vestimenta: {vestimenta}

## PERFUMES DISPONIBLES (ANONIMIZADOS)
{perfumes_text}

## INSTRUCCIONES
1. Analiza el contexto completo
2. Considera el TIPO DE ESPACIO: en lugares cerrados los perfumes proyectan más, en abiertos se disipan
3. Considera la PROXIMIDAD: para alta proximidad evita perfumes muy intensos o proyectantes
4. Evalúa las notas y acordes en relación con el clima y la temperatura
5. No te dejes influenciar por el orden en que aparecen los perfumes
6. Basa tu decisión ÚNICAMENTE en la compatibilidad de acordes y notas con el contexto
7. Elige SOLO UN perfume de la lista
8. Explica brevemente (3-4 líneas) por qué es ideal para este contexto

FORMATO DE RESPUESTA (OBLIGATORIO):
Perfume [número]
[Breve explicación de por qué es perfecto para esta ocasión]
"""
