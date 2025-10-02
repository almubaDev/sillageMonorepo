import httpx
import random
from typing import List, Optional
from app.core.config import settings
from app.models.perfume import Perfume


def build_prompt(
    perfumes: List[Perfume],
    fecha_evento,
    hora_evento,
    lugar_nombre: str,
    lugar_tipo: str,
    lugar_descripcion: str,
    ocasion: str,
    expectativa: str,
    vestimenta: str,
    temperatura: float,
    humedad: float,
    clima_descripcion: str
) -> str:
    """Construir el prompt para Gemini"""
    
    # Determinar estación (hemisferio sur)
    mes = fecha_evento.month
    estaciones = {
        1: "verano", 2: "verano", 3: "otoño", 4: "otoño",
        5: "invierno", 6: "invierno", 7: "invierno",
        8: "primavera", 9: "primavera", 10: "primavera",
        11: "verano", 12: "verano"
    }
    estacion = estaciones.get(mes, "desconocida")
    
    # Determinar momento del día
    hora = hora_evento.hour
    momento_dia = "mañana" if hora < 12 else "tarde" if hora < 19 else "noche"
    
    # Mezclar perfumes aleatoriamente
    perfumes_lista = list(perfumes)
    random.shuffle(perfumes_lista)
    
    # Formatear lista de perfumes
    perfumes_text = "\n".join([
        f"- {p.nombre} ({p.marca})"
        + (f", perfumista: {p.perfumista}" if p.perfumista else "")
        + (f", acordes: {', '.join(p.acordes)}" if p.acordes else "")
        + (f", notas: {', '.join(p.notas[:5])}" if p.notas else "")
        for p in perfumes_lista
    ])
    
    prompt = f"""Eres un experto perfumista. Recomienda el perfume MÁS ADECUADO de esta colección para el siguiente contexto:

## CONTEXTO DEL EVENTO
- Lugar: {lugar_nombre} ({lugar_tipo})
- Descripción: {lugar_descripcion}
- Fecha y hora: {fecha_evento} {hora_evento} ({momento_dia})
- Clima: {clima_descripcion}, {temperatura}°C, {humedad}% humedad
- Estación: {estacion}
- Ocasión: {ocasion}
- Expectativa: {expectativa}
- Vestimenta: {vestimenta}

## PERFUMES DISPONIBLES
{perfumes_text}

## INSTRUCCIONES
1. Analiza el contexto completo
2. Considera especialmente el clima, la hora y el tipo de lugar
3. Elige UN SOLO perfume de la lista
4. Tu respuesta debe empezar con el nombre exacto del perfume recomendado
5. Explica brevemente (3-4 líneas) por qué es ideal para este contexto

FORMATO DE RESPUESTA:
[Nombre del perfume]
[Explicación breve de por qué es perfecto para esta ocasión]
"""
    
    return prompt


async def get_ai_recommendation(prompt: str) -> str:
    """Llamar a Gemini AI para obtener recomendación"""
    
    api_key = settings.GEMINI_API_KEY
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            
            data = response.json()
            return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
            
    except Exception as e:
        print(f"Error al llamar Gemini: {e}")
        return "No se pudo generar una recomendación en este momento."