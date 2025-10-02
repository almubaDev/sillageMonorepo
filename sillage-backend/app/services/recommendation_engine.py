import re
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.perfume import Perfume
from app.models.recommendation import Recomendacion
from app.services.weather import get_weather_data
from app.services.gemini import build_prompt, get_ai_recommendation


def extract_perfume_name(ai_response: str, perfumes: List[Perfume]) -> Optional[Perfume]:
    """Extraer el perfume recomendado de la respuesta de la IA"""
    
    # Intentar encontrar el nombre del perfume al inicio de la respuesta
    lines = ai_response.strip().split('\n')
    if not lines:
        return None
    
    first_line = lines[0].strip()
    
    # Limpiar el texto de posibles asteriscos o caracteres especiales
    first_line = re.sub(r'[\*\#\-\:]', '', first_line).strip()
    
    # Buscar coincidencia con los perfumes disponibles
    for perfume in perfumes:
        # Comparación flexible
        if perfume.nombre.lower() in first_line.lower():
            return perfume
        # También buscar sin espacios o guiones
        perfume_clean = perfume.nombre.replace(' ', '').replace('-', '').lower()
        first_clean = first_line.replace(' ', '').replace('-', '').lower()
        if perfume_clean in first_clean:
            return perfume
    
    # Si no encontramos en la primera línea, buscar en todo el texto
    for perfume in perfumes:
        if perfume.nombre.lower() in ai_response.lower():
            return perfume
    
    return None


async def generate_recommendation(
    db: AsyncSession,
    user_id: int,
    perfumes: List[Perfume],
    fecha_evento,
    hora_evento,
    latitud: float,
    longitud: float,
    lugar_nombre: str,
    lugar_tipo: str,
    lugar_descripcion: str,
    ocasion: str,
    expectativa: str,
    vestimenta: str
) -> Recomendacion:
    """Generar una recomendación completa"""
    
    # Obtener datos del clima
    weather_data = await get_weather_data(
        latitud, longitud, fecha_evento, hora_evento
    )
    
    if not weather_data:
        weather_data = {
            'descripcion': 'información no disponible',
            'temperatura': 20.0,
            'humedad': 60.0
        }
    
    # Construir prompt
    prompt = build_prompt(
        perfumes=perfumes,
        fecha_evento=fecha_evento,
        hora_evento=hora_evento,
        lugar_nombre=lugar_nombre,
        lugar_tipo=lugar_tipo,
        lugar_descripcion=lugar_descripcion,
        ocasion=ocasion,
        expectativa=expectativa,
        vestimenta=vestimenta,
        temperatura=weather_data['temperatura'],
        humedad=weather_data['humedad'],
        clima_descripcion=weather_data['descripcion']
    )
    
    # Obtener recomendación de la IA
    ai_response = await get_ai_recommendation(prompt)
    
    # Extraer el perfume recomendado
    recommended_perfume = extract_perfume_name(ai_response, perfumes)
    
    # Crear el registro de recomendación
    recommendation = Recomendacion(
        user_id=user_id,
        fecha_evento=fecha_evento,
        hora_evento=hora_evento,
        latitud=latitud,
        longitud=longitud,
        lugar_nombre=lugar_nombre,
        lugar_tipo=lugar_tipo,
        lugar_descripcion=lugar_descripcion,
        ocasion=ocasion,
        expectativa=expectativa,
        vestimenta=vestimenta,
        clima_descripcion=weather_data['descripcion'],
        temperatura=weather_data['temperatura'],
        humedad=weather_data['humedad'],
        prompt=prompt,
        respuesta_ia=ai_response,
        perfume_recomendado_id=recommended_perfume.id if recommended_perfume else None,
        explicacion=f"Recomendación: {recommended_perfume.nombre if recommended_perfume else 'No se pudo determinar'}"
    )
    
    db.add(recommendation)
    await db.commit()
    await db.refresh(recommendation)
    
    return recommendation