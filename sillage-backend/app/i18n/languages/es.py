# sillage-backend/app/i18n/languages/es.py
"""
Traducciones en español para prompts de IA
"""

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
- Dirección: {direccion}
- Lugar: {lugar_descripcion}
- Tipo de espacio: {tipo_espacio_desc}
- Fecha y hora: {fecha_evento} {hora_evento} ({momento_dia})
- Clima: {clima_descripcion}, {temperatura}°C, {humedad}% de humedad
- Ocasión: {ocasion}
- Proximidad esperada: {proximidad}
- Expectativa emocional: {expectativa}
- Vestimenta: {vestimenta}

## REGLA CRÍTICA: DETERMINAR ESTACIÓN DEL AÑO
- A partir de la dirección proporcionada, DETERMINA el país y la zona climática (tropical, templada norte, templada sur)
- Zonas tropicales (entre trópicos): NO tienen 4 estaciones tradicionales, tienen temporada seca/lluviosa. Basa tu selección en la temperatura y clima real proporcionados
- Zonas templadas: Determina la estación correcta según el hemisferio y la fecha exacta (considerando equinoccios ~20-21 de marzo/septiembre y solsticios ~20-21 de junio/diciembre)
- USA la estación que determines como factor clave en tu selección

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
1. PRIMERO: Determina la estación del año (o temporada climática) a partir de la dirección y fecha proporcionadas
2. SEGUNDO: Basándote en la temperatura ({temperatura}°C), la estación que determinaste, momento del día ({momento_dia}) y ocasión ({ocasion}), determina qué familias olfativas y notas son ideales según la GUÍA DE SELECCIÓN
3. TERCERO: Filtra mentalmente los perfumes de la lista que coincidan con esas características ideales
4. CUARTO: Del resultado filtrado, elige el perfume más compatible considerando:
   - Tipo de espacio (cerrado = mayor proyección, abierto = dispersión)
   - Proximidad esperada (alta = evitar muy intensos)
   - Vestimenta y expectativa emocional
5. NO te bases en reconocimiento de combinaciones de notas famosas
6. NO te dejes influenciar por el orden de aparición
7. Basa tu decisión ÚNICAMENTE en compatibilidad clima/contexto con acordes y notas

FORMATO DE RESPUESTA (OBLIGATORIO):
Perfume [número]
[Breve explicación de por qué es adecuado, mencionando: la estación que determinaste para ese lugar y fecha, clima ({temperatura}°C), momento del día ({momento_dia}), ocasión ({ocasion}). NO menciones condiciones asumidas como aire acondicionado, calefacción, etc.]
"""
