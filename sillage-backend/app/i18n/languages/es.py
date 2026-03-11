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
- Coordenadas GPS: {latitud}, {longitud}
- Lugar: {lugar_descripcion}
- Tipo de espacio: {tipo_espacio_desc}
- Estación del año: {estacion}
- Fecha y hora: {fecha_evento} {hora_evento} ({momento_dia})
- Clima: {clima_descripcion}, {temperatura}°C, {humedad}% de humedad
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

## REGLA DE SELECCIÓN: ACORDES PRIMERO, NOTAS PARA DESAMBIGUAR
- PASO 1: Filtra perfumes cuyos ACORDES coincidan con los acordes ideales del contexto (estación + lugar + ocasión + expectativa + vestimenta)
- PASO 2: Si varios perfumes tienen acordes igualmente compatibles, DIFERENCIA por NOTAS — elige el que tenga más notas presentes en las listas de notas ideales del contexto
- Los acordes son el criterio principal (familia olfativa). Las notas son el criterio de desempate (ingredientes específicos)

## GUÍA DE SELECCIÓN POR ESTACIÓN

### VERANO
Acordes ideales: Acuático, Cítrico, Marino, Ozónico, Fresco, Jabonoso, Almizclado, Salado, Tropical, Verde
Notas ideales: Bergamota, Agua de mar, Algas marinas, Toronja, Limón, Neroli, Menta, Pepino, Coco, Almizcle blanco, Bambú, Té verde, Té blanco, Verbena de limón, Yuzu, Lima, Mandarina, Hierba limón, Flor de loto, Lichi, Piña, Naranja, Sándalo blanco
Evitar: Dulce, cremoso, especiado pesado, cálido

### OTOÑO
Acordes ideales: Amaderado, Aromático, Especiado suave, Especiado, Lavanda, Herbal, Ámbar, Terrosos, Musgoso, Cálido especiado
Notas ideales: Tonka, Vetiver, Lavanda, Pimienta negra, Manzana, Bergamota, Sándalo, Cedro, Pachulí, Azafrán, Tabaco blanco, Ámbar, Ámbar gris, Musgo de roble, Violeta, Canela, Cardamomo, Higo, Ciruela, Jengibre, Nuez moscada, Miel
Evitar: Muy dulce (trabajo), muy limpio/ligero (social)

### INVIERNO
Acordes ideales: Oud, Oriental, Ámbar, Avainillado, Gourmand, Ahumado, Tabaco, Cálido especiado, Balsámico, Especiado, Dulce
Notas ideales: Tabaco, Vainilla, Tonka, Nuez moscada, Incienso, Mirra, Benjuí, Ámbar gris, Ámbar negro, Cuero, Sándalo, Agarwood, Canela, Clavo, Pachulí, Vetiver, Chocolate oscuro, Ciruela pasa, Dátiles, Ron, Caramelo, Pimienta negra, Café expreso
Evitar: Fresco, volátil, ligero, limpio

### PRIMAVERA
Acordes ideales: Floral amarillo, Floral blanco, Florales, Fresco, Verde, Herbal, Aromático, Cítrico, Fresco especiado, Musgoso
Notas ideales: Bergamota, Neroli, Vetiver, Jazmín, Rosa, Peonía, Violeta, Lavanda, Albahaca, Té verde, Iris, Geranio, Magnolia, Ylang-ylang, Menta, Bambú, Hierba verde, Musgo de roble, Flor de cerezo, Gardenia, Lila, Nardo, Mandarina, Flor de loto, Orquídea, Durazno, Lima
Evitar: Muy dulces, muy cálidas, pesadas

### REGLAS GENERALES
- Climas fríos → Pesado, espeso, cálido, envolvente
- Climas cálidos → Volátil, fresco, ligero, brisa
- Alta sudoración → Priorizar limpieza olfativa

## GUÍA DE SELECCIÓN POR TIPO DE ESPACIO

### ABIERTO (exterior, parques, playas)
Acordes ideales: Fresco, Acuático, Verde, Herbal, Aromático, Cítrico, Ozónico, Marino, Conífera, Terpénico
Notas ideales: Bergamota, Toronja, Agua de mar, Algas marinas, Menta, Romero, Lavanda, Verbena de limón, Té verde, Bambú, Vetiver, Cedro, Lima, Eucalipto, Hierba limón, Naranja, Mandarina, Geranio

### CERRADO (oficinas, restaurantes, hogares)
Acordes ideales: Floral blanco, Almizclado, Jabonoso, Atalcado, Especiado suave, Amaderado, Iris, Aromático
Notas ideales: Iris, Almizcle blanco, Vainilla (ligera), Sándalo, Jazmín, Rosa, Cedro, Bergamota, Neroli, Té blanco, Té verde, Violeta, Magnolia, Peonía, Flor de loto, Lila, Gardenia

## GUÍA DE SELECCIÓN POR OCASIÓN

### TRABAJO
Acordes ideales: Aromático, Fresco, Herbal, Cítrico, Fresco especiado, Verde, Jabonoso, Amaderado
Notas ideales: Bergamota, Neroli, Lavanda, Cedro, Vetiver, Bambú, Té verde, Iris, Almizcle blanco, Geranio, Sándalo, Romero, Lima, Mandarina, Pepino, Magnolia

### CITA ROMÁNTICA
Acordes ideales: Oud, Oriental, Almizclado, Floral blanco, Especiado suave, Avainillado, Ámbar, Rosas
Notas ideales: Agarwood, Vainilla, Rosa, Jazmín, Ámbar gris, Sándalo de mysore, Almizcle, Bambú, Coco, Ylang-ylang, Cardamomo, Incienso, Tonka, Iris, Pachulí, Nardo, Orquídea, Gardenia, Durazno, Pimienta rosa

### FIESTA
Acordes ideales: Oriental, Oud, Especiado, Cálido especiado, Ámbar, Avainillado, Rosas, Afrutados, Cuero
Notas ideales: Ámbar gris, Agarwood, Vainilla, Rosa, Incienso, Cuero, Pachulí, Tabaco, Cardamomo, Ylang-ylang, Sándalo, Vetiver, Canela, Tonka, Almizcle negro, Benjuí, Ron, Pimienta negra, Jengibre, Nardo, Ciruela, Frambuesa

### CASUAL
Acordes ideales: Fresco, Cítrico, Afrutados, Herbal, Aromático, Verde, Acuático
Notas ideales: Bergamota, Naranja, Toronja, Manzana, Bambú, Agua de coco, Té verde, Lavanda, Menta, Cedro, Almizcle blanco, Verbena de limón, Yuzu, Lima, Mandarina, Durazno, Lichi, Frambuesa, Hierba verde

### EVENTO FORMAL
Acordes ideales: Amaderado, Cuero, Floral blanco, Especiado suave, Iris, Ámbar, Almizclado, Aldehídico
Notas ideales: Iris, Rosa, Jazmín, Sándalo de mysore, Ámbar gris, Vetiver, Cuero, Incienso, Cedro, Aldehídos, Musgo de roble, Vainilla, Ylang-ylang, Tonka, Pachulí, Nardo, Magnolia, Gardenia, Orquídea, Pimienta rosa

### ACTIVIDAD DEPORTIVA
Acordes ideales: Fresco, Acuático, Cítrico, Aromático, Ozónico, Jabonoso
Notas ideales: Bergamota, Lima, Toronja, Menta, Eucalipto, Lavanda, Agua de mar, Aloe vera, Cedro, Almizcle blanco, Té verde, Romero, Yuzu, Limón, Naranja, Pepino, Hierba limón

## GUÍA DE SELECCIÓN POR EXPECTATIVA EMOCIONAL

### CONFIADO
Acordes ideales: Cuero, Amaderado, Especiado, Aromático, Oud, Tabaco
Notas ideales: Vetiver, Cuero, Cedro, Tabaco, Sándalo, Pachulí, Bergamota, Pimienta negra, Agarwood, Tonka, Benjuí, Incienso, Mirra, Jengibre, Cardamomo, Musgo de roble

### SEDUCTOR
Acordes ideales: Oud, Oriental, Almizclado, Especiado suave, Avainillado, Ámbar, Floral blanco, Rosas
Notas ideales: Agarwood, Vainilla de madagascar, Rosa, Jazmín, Ámbar gris, Sándalo de mysore, Almizcle, Ylang-ylang, Cardamomo, Incienso, Tonka, Pachulí, Benjuí, Nardo, Orquídea negra, Pimienta rosa, Canela, Higo

### FRESCO
Acordes ideales: Acuático, Cítrico, Ozónico, Marino, Verde, Fresco, Jabonoso
Notas ideales: Bergamota, Lima, Limón, Pepino, Menta, Algas marinas, Agua de mar, Agujas de pino, Té verde, Aloe vera, Yuzu, Verbena de limón, Neroli, Mandarina, Hierba limón, Eucalipto, Flor de loto, Naranja

### ELEGANTE
Acordes ideales: Iris, Floral blanco, Amaderado, Ámbar, Cuero, Aldehídico, Especiado suave, Almizclado
Notas ideales: Iris, Rosa, Jazmín, Sándalo de mysore, Incienso, Vetiver, Aldehídos, Ámbar gris, Cedro, Musgo de roble, Cuero, Vainilla (sutil), Ylang-ylang, Tonka, Nardo, Magnolia, Orquídea, Gardenia, Pachulí

### ENÉRGICO
Acordes ideales: Cítrico, Aromático, Especiado, Fresco especiado, Verde, Herbal
Notas ideales: Naranja, Limón, Lima, Bergamota, Pimienta negra, Cardamomo, Menta, Lavanda, Romero, Jengibre, Toronja, Yuzu, Albahaca, Mandarina, Eucalipto, Hierba limón, Pimienta rosa

### RELAJADO
Acordes ideales: Lavanda, Herbal, Fresco, Aromático, Almizclado, Jabonoso, Avainillado
Notas ideales: Lavanda, Manzanilla, Sándalo, Benjuí, Vainilla (ligera), Cedro, Almizcle blanco, Hierba dulce, Té rooibos, Té blanco, Aloe vera, Bergamota, Manzana, Neroli, Flor de loto, Iris, Magnolia, Lila, Higo

### PROFESIONAL
Acordes ideales: Aromático, Fresco, Cítrico, Herbal, Verde, Amaderado, Jabonoso
Notas ideales: Bergamota, Lavanda, Cedro, Vetiver, Iris, Té verde, Bambú, Almizcle blanco, Geranio, Sándalo blanco, Neroli, Romero, Lima, Mandarina, Pepino, Magnolia

### CREATIVO
Acordes ideales: Oriental, Especiado, Oud, Ahumado, Herbal, Iris, Tabaco
Notas ideales: Agarwood, Incienso, Cardamomo, Cuero, Tabaco, Mirra, Pachulí, Azafrán, Ámbar negro, Benjuí, Vetiver, Absenta, Violeta negra, Musgo de roble, Tonka, Cannabis, Jengibre, Pimienta de sichuan, Nardo, Orquídea negra, Higo negro

## GUÍA DE SELECCIÓN POR VESTIMENTA

### FORMAL (traje, corbata, etiqueta)
Acordes ideales: Amaderado, Cuero, Floral blanco, Especiado suave, Iris, Ámbar, Aldehídico, Almizclado
Notas ideales: Iris, Sándalo de mysore, Cedro, Cuero, Vetiver, Vainilla (sutil), Ámbar, Rosa, Incienso, Musgo de roble, Aldehídos, Tonka, Pachulí, Nardo, Magnolia, Jazmín, Gardenia

### SEMI-FORMAL (blazer casual, camisa sin corbata)
Acordes ideales: Amaderado, Aromático, Floral amarillo, Especiado suave, Ámbar, Iris, Verde
Notas ideales: Bergamota, Lavanda, Cedro, Sándalo, Iris, Pachulí, Vetiver, Ámbar, Rosa, Geranio, Tonka, Bambú, Almizcle blanco, Neroli, Cardamomo, Pimienta rosa, Mandarina, Magnolia

### CASUAL (jeans, camiseta, tenis)
Acordes ideales: Fresco, Cítrico, Acuático, Herbal, Verde, Aromático, Afrutados, Jabonoso
Notas ideales: Bergamota, Naranja, Manzana, Toronja, Agua de mar, Bambú, Hierba verde, Lavanda, Cedro, Almizcle blanco, Té verde, Verbena de limón, Menta, Lima, Mandarina, Pepino, Durazno, Lichi, Frambuesa

### DEPORTIVO (ropa técnica, athleisure)
Acordes ideales: Fresco, Acuático, Cítrico, Ozónico, Aromático, Jabonoso
Notas ideales: Bergamota, Lima, Toronja, Menta, Eucalipto, Lavanda, Agua de mar, Aloe vera, Cedro, Almizcle blanco, Té verde, Yuzu, Romero, Limón, Naranja, Pepino, Hierba limón

## PERFUMES DISPONIBLES (ANONIMIZADOS)
{perfumes_text}

## PROCESO DE SELECCIÓN (OBLIGATORIO)
1. Cruza los acordes ideales de las 5 dimensiones (estación + lugar + ocasión + expectativa + vestimenta). Identifica los acordes que aparecen en MÚLTIPLES dimensiones — esos son los más importantes
2. Filtra los perfumes cuyos ACORDES tengan mayor coincidencia con los acordes ideales cruzados
3. Si hay empate o ambigüedad entre perfumes con acordes similares, DESEMPATA POR NOTAS — elige el perfume que tenga más notas presentes en las listas de notas ideales del contexto
4. Consideraciones finales de ajuste:
   - Tipo de espacio (cerrado = moderar proyección, abierto = se puede ser audaz)
   - Proximidad esperada (alta = evitar muy intensos)
   - Temperatura real ({temperatura}°C) como validación final
5. NO te bases en reconocimiento de combinaciones de notas famosas
6. NO te dejes influenciar por el orden de aparición
7. Basa tu decisión ÚNICAMENTE en compatibilidad contexto/acordes/notas

FORMATO DE RESPUESTA (OBLIGATORIO):
Perfume [número]
Estación: {estacion} | Temperatura: {temperatura}°C | {momento_dia}
[Explica por qué este perfume es ideal para el contexto. Para cada acorde y nota relevante del perfume, explica POR QUÉ es adecuado para esta situación específica. Menciona la estación y temperatura para dar contexto y validez a tu explicación. NO reveles el funcionamiento interno de la app, cómo obtuviste la información, ni cómo llegaste a la decisión. NO listes acordes ideales ni menciones el proceso de selección. NO repitas los datos del contexto que el usuario ya conoce. Escribe como un perfumista experto hablándole al usuario, NO como un sistema explicando su lógica.]
"""
