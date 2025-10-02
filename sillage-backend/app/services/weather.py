import httpx
from datetime import datetime, date, time
from typing import Optional, Dict
from app.core.config import settings


async def get_weather_data(
    lat: float, 
    lon: float, 
    fecha: date, 
    hora: time
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
        print(f"Error al consultar clima: {e}")
        # Valores por defecto si falla la API
        return {
            'descripcion': 'parcialmente nublado',
            'temperatura': 20.0,
            'humedad': 60.0
        }