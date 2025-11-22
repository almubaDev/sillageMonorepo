import httpx
import time as time_module
from datetime import datetime, date, time
from typing import Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings


async def get_weather_data(
    lat: float,
    lon: float,
    fecha: date,
    hora: time,
    db: AsyncSession = None,
    user_id: int = None
) -> Optional[Dict]:
    """Obtener datos del clima para una ubicación y tiempo específicos"""

    api_key = settings.OPENWEATHER_API_KEY
    url = f"https://api.openweathermap.org/data/2.5/forecast"

    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "lang": "es"
    }

    start_time = time_module.time()
    success = True
    error_msg = None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Combinar fecha y hora objetivo
            dt_objetivo = datetime.combine(fecha, hora)

            # Buscar el bloque de tiempo más cercano
            bloques = data.get('list', [])
            if not bloques:
                return None

            mejor_bloque = min(
                bloques,
                key=lambda b: abs(
                    datetime.strptime(b['dt_txt'], "%Y-%m-%d %H:%M:%S") - dt_objetivo
                ).total_seconds()
            )

            return {
                'descripcion': mejor_bloque['weather'][0]['description'],
                'temperatura': mejor_bloque['main']['temp'],
                'humedad': mejor_bloque['main']['humidity']
            }

    except Exception as e:
        success = False
        error_msg = str(e)
        print(f"Error al consultar clima: {e}")
        # Valores por defecto si falla la API
        return {
            'descripcion': 'parcialmente nublado',
            'temperatura': 20.0,
            'humedad': 60.0
        }
    finally:
        # Registrar uso de API si tenemos sesión de DB
        if db:
            response_time_ms = int((time_module.time() - start_time) * 1000)
            try:
                from app.services.api_tracker import track_api_call
                await track_api_call(
                    db=db,
                    api_name='openweather',
                    endpoint=url,
                    response_time_ms=response_time_ms,
                    success=success,
                    error_message=error_msg,
                    user_id=user_id
                )
            except Exception as track_error:
                print(f"Error al registrar uso de API: {track_error}")