import re
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.perfume import Perfume
from app.models.recommendation import Recomendacion
from app.services.weather import get_weather_data
from app.services.gemini import build_prompt, get_ai_recommendation


def extract_perfume_by_number(ai_response: str, perfumes_ordenados: List[Perfume]) -> Optional[Perfume]:
    """
    Extraer el perfume recomendado de la respuesta de la IA usando el número asignado.

    La IA responde con "Perfume X" donde X es el número del perfume en la lista.
    """

    # Buscar patrón "Perfume X" o "Perfume [X]" en la respuesta
    # Soporta: "Perfume 3", "Perfume [3]", "**Perfume 3**", etc.
    pattern = r'[Pp]erfume\s*\[?(\d+)\]?'
    match = re.search(pattern, ai_response)

    if match:
        perfume_number = int(match.group(1))
        # El número es 1-indexed, convertir a 0-indexed
        index = perfume_number - 1

        if 0 <= index < len(perfumes_ordenados):
            selected = perfumes_ordenados[index]
            print(f"✅ Perfume seleccionado: Perfume {perfume_number} = {selected.nombre} ({selected.marca})")
            return selected
        else:
            print(f"⚠️ Número de perfume fuera de rango: {perfume_number} (total: {len(perfumes_ordenados)})")
    else:
        print(f"⚠️ No se encontró patrón 'Perfume X' en la respuesta")

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
    vestimenta: str,
    idioma: str = "es"
) -> Recomendacion:
    """Generar una recomendación completa"""

    print("\n" + "="*80)
    print("🤖 GENERANDO RECOMENDACIÓN - DATOS RECIBIDOS")
    print("="*80)
    print(f"👤 User ID: {user_id}")
    print(f"📅 Fecha evento: {fecha_evento}")
    print(f"🕐 Hora evento: {hora_evento}")
    print(f"📍 Coordenadas: ({latitud}, {longitud})")
    print(f"📍 Lugar nombre: {lugar_nombre}")
    print(f"🏢 Lugar tipo: {lugar_tipo}")
    print(f"📝 Lugar descripción: {lugar_descripcion}")
    print(f"🎉 Ocasión: {ocasion}")
    print(f"✨ Expectativa: {expectativa}")
    print(f"👔 Vestimenta: {vestimenta}")
    print(f"🌐 Idioma: {idioma}")
    print(f"🧴 Cantidad de perfumes disponibles: {len(perfumes)}")
    print("="*80 + "\n")

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

    print("🌤️  DATOS DEL CLIMA")
    print("-" * 80)
    print(f"Descripción: {weather_data['descripcion']}")
    print(f"Temperatura: {weather_data['temperatura']}°C")
    print(f"Humedad: {weather_data['humedad']}%")
    print("-" * 80 + "\n")

    # Construir prompt (retorna tupla: prompt, perfumes_ordenados)
    prompt, perfumes_ordenados = build_prompt(
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
        clima_descripcion=weather_data['descripcion'],
        idioma=idioma
    )

    print("📝 PROMPT COMPLETO ENVIADO A LA IA")
    print("-" * 80)
    print(prompt)
    print("-" * 80 + "\n")

    # Obtener recomendación de la IA
    ai_response = await get_ai_recommendation(prompt)

    print("🤖 RESPUESTA DE LA IA")
    print("-" * 80)
    print(ai_response)
    print("-" * 80 + "\n")

    # Extraer el perfume recomendado usando el número del perfume
    recommended_perfume = extract_perfume_by_number(ai_response, perfumes_ordenados)
    
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