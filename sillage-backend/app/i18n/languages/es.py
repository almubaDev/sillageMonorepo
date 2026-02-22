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

## REGLA CRÍTICA: NO HACER SUPOSICIONES
- Basa tu recomendación ÚNICAMENTE en los datos proporcionados arriba
- NO asumas condiciones que no están explícitamente indicadas (ej: aire acondicionado, calefacción, ventilación, etc.)
- Si el espacio es "cerrado", solo significa que no hay viento/dispersión, NO asumas climatización
- La temperatura real del ambiente es la indicada en "Clima" - úsala como referencia principal
- NO inventes detalles sobre el lugar, las personas, o las circunstancias

## GUÍA DE SELECCIÓN POR CLIMA Y ESTACIÓN

### PRIMAVERA (clima templado, flores, aire fresco)
Familias ideales: Frescas aromáticas, florales, ligeramente frutales
Notas preferidas: Cítricos, vetiver húmedo, maderas ligeras, verdes, especias suaves
Objetivo: Relajante, calmado, fresco
Evitar: Muy dulces, muy cálidas, pesadas

### VERANO (calor extremo, sol intenso)
Familias ideales: Acuáticas, aromáticas, ozónicas, cítricas
Notas preferidas: Cítricos intensos, acuáticas, neroli (jabonoso), ámbar ligero, maderas suaves
Objetivo: Limpio, refrescante, volátil
Por contexto:
- Trabajo/oficina: Limpio, jabonoso
- Social/casual: Frutal, jugoso
- Cita: Moderado, no punzante
- Fiesta/club: Más intenso, punzante
Evitar: Dulce, cremoso, especiado, pesado, cálido

### OTOÑO (frío moderado, húmedo)
Familias ideales: Amaderadas, especiadas, ligeramente dulces
Notas preferidas: Haba tonka, pimienta negra, especias, frutas (manzana), lavanda aromática, ámbar
Objetivo: Acogedor pero serio, robusto, profundo
Balance: Facetas cálidas pero NO completamente cálido
Evitar: Muy dulce (trabajo), muy limpio (social/citas)

### INVIERNO (frío extremo)
Familias ideales: Dulces, especiadas, ambaradas, orientales
Notas preferidas: Tabaco, vainilla, nuez moscada, especias intensas, ámbar denso, maderas pesadas
Objetivo: Cobija olfativa, calor, acogedor
Características: Cremoso, espeso, rastro denso/pesado, profundo, oscuro
Evitar: Fresco, volátil, ligero, limpio

### REGLAS GENERALES
- Climas fríos → Pesado, espeso, cálido, envolvente
- Climas cálidos → Volátil, fresco, ligero, brisa
- Alta sudoración → Priorizar limpieza olfativa

## PERFUMES DISPONIBLES (ANONIMIZADOS)
{perfumes_text}

## PROCESO DE SELECCIÓN (OBLIGATORIO)
1. PRIMERO: Basándote en la temperatura ({temperatura}°C), estación ({estacion}), momento del día ({momento_dia}) y ocasión ({ocasion}), determina qué familias olfativas y notas son ideales según la GUÍA DE SELECCIÓN y las REGLAS POR MOMENTO DEL DÍA
2. SEGUNDO: Filtra mentalmente los perfumes de la lista que coincidan con esas características ideales
3. TERCERO: Del resultado filtrado, elige el perfume más compatible considerando:
   - Tipo de espacio (cerrado = mayor proyección, abierto = dispersión)
   - Proximidad esperada (alta = evitar muy intensos)
   - Vestimenta y expectativa emocional
4. NO te bases en reconocimiento de combinaciones de notas famosas
5. NO te dejes influenciar por el orden de aparición
6. Basa tu decisión ÚNICAMENTE en compatibilidad clima/contexto con acordes y notas

FORMATO DE RESPUESTA (OBLIGATORIO):
Perfume [número]
[Breve explicación de por qué es adecuado, mencionando SOLO datos proporcionados: clima ({temperatura}°C), estación ({estacion}), momento del día ({momento_dia}), ocasión ({ocasion}). NO menciones condiciones asumidas como aire acondicionado, calefacción, etc.]
"""
