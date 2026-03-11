import httpx
import random
import time as time_module
from datetime import date
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.coleccion import PerfumeColeccion
from app.i18n.loader import language_loader


def determine_season(latitud: float, fecha: date, idioma: str = "es") -> str:
    """
    Determina la estación del año basándose en la latitud y la fecha.
    - Zona tropical (entre -23.5° y 23.5°): no tiene estaciones tradicionales
    - Zona templada norte (> 23.5°): estaciones estándar
    - Zona templada sur (< -23.5°): estaciones invertidas
    """
    month = fecha.month
    day = fecha.day

    # Zona tropical: no hay estaciones tradicionales
    if -23.5 <= latitud <= 23.5:
        return "tropical (sin estaciones tradicionales)" if idioma == "es" else "tropical (no traditional seasons)"

    # Determinar estación astronómica por fecha
    # Primavera: 21 mar - 20 jun | Verano: 21 jun - 22 sep | Otoño: 23 sep - 20 dic | Invierno: 21 dic - 20 mar
    if (month == 3 and day >= 21) or (month in [4, 5]) or (month == 6 and day <= 20):
        northern_season = "primavera" if idioma == "es" else "spring"
        southern_season = "otoño" if idioma == "es" else "autumn"
    elif (month == 6 and day >= 21) or (month in [7, 8]) or (month == 9 and day <= 22):
        northern_season = "verano" if idioma == "es" else "summer"
        southern_season = "invierno" if idioma == "es" else "winter"
    elif (month == 9 and day >= 23) or (month in [10, 11]) or (month == 12 and day <= 20):
        northern_season = "otoño" if idioma == "es" else "autumn"
        southern_season = "primavera" if idioma == "es" else "spring"
    else:  # 21 dic - 20 mar
        northern_season = "invierno" if idioma == "es" else "winter"
        southern_season = "verano" if idioma == "es" else "summer"

    if latitud > 23.5:
        return northern_season
    else:
        return southern_season


def build_prompt(
    perfumes: List[PerfumeColeccion],
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
    clima_descripcion: str,
    latitud: float = None,
    longitud: float = None,
    idioma: str = "es"
) -> tuple[str, List[PerfumeColeccion]]:
    """
    Construir el prompt para Gemini en el idioma especificado.

    Los perfumes se anonimizan (Perfume 1, Perfume 2, etc.) para evitar
    sesgos por popularidad o reconocimiento de marca.

    Retorna:
        tuple: (prompt, perfumes_ordenados) donde perfumes_ordenados es la lista
               en el mismo orden que aparecen en el prompt para mapear la respuesta
    """

    # Cargar traducciones del idioma
    time_of_day_dict = language_loader.get_time_of_day(idioma)
    perfume_labels = language_loader.get_perfume_labels(idioma)
    prompt_template = language_loader.get_prompt_template(idioma)
    proximidad_dict = language_loader.get_proximidad_ocasion(idioma)

    # Determinar momento del día
    hora = hora_evento.hour
    if hora < 12:
        momento_dia = time_of_day_dict["morning"]
    elif hora < 19:
        momento_dia = time_of_day_dict["afternoon"]
    else:
        momento_dia = time_of_day_dict["night"]

    # Determinar proximidad esperada según ocasión
    proximidad = proximidad_dict.get(ocasion, "media")

    # Determinar estación del año por latitud + fecha
    estacion = determine_season(latitud or 0, fecha_evento, idioma)

    # Descripción del tipo de espacio
    if idioma == "es":
        tipo_espacio_desc = "Espacio cerrado (interior, aire acondicionado/calefacción)" if lugar_tipo == "cerrado" else "Espacio abierto (exterior, ventilación natural)"
    else:
        tipo_espacio_desc = "Enclosed space (indoor, air conditioning/heating)" if lugar_tipo == "cerrado" else "Open space (outdoor, natural ventilation)"

    # Mezclar perfumes aleatoriamente para evitar sesgos por orden
    perfumes_lista = list(perfumes)
    random.shuffle(perfumes_lista)

    # Log para debug (muestra info real del perfume)
    print("🧴 PERFUMES DISPONIBLES PARA LA RECOMENDACIÓN (ANONIMIZADOS EN PROMPT)")
    print("-" * 80)
    for idx, p in enumerate(perfumes_lista, 1):
        print(f"\nPerfume {idx} = {p.nombre} ({p.marca})")
        if p.acordes:
            print(f"   Acordes: {', '.join(p.acordes)}")
        if p.notas:
            print(f"   Notas: {', '.join(p.notas)}")
    print("-" * 80 + "\n")

    # Formatear lista de perfumes ANONIMIZADOS (solo acordes y notas)
    perfumes_text = "\n".join([
        f"- Perfume {idx}: "
        + (f"{perfume_labels['accords']}: {', '.join(p.acordes)}" if p.acordes else "")
        + (f"; {perfume_labels['notes']}: {', '.join(p.notas)}" if p.notas else "")
        for idx, p in enumerate(perfumes_lista, 1)
    ])

    # Construir prompt usando el template del idioma
    prompt = prompt_template.format(
        direccion=lugar_descripcion,
        lugar_nombre=lugar_nombre,
        lugar_descripcion=lugar_descripcion,
        tipo_espacio_desc=tipo_espacio_desc,
        fecha_evento=fecha_evento,
        hora_evento=hora_evento,
        momento_dia=momento_dia,
        clima_descripcion=clima_descripcion,
        temperatura=temperatura,
        humedad=humedad,
        ocasion=ocasion,
        proximidad=proximidad,
        expectativa=expectativa,
        vestimenta=vestimenta,
        latitud=latitud or 0,
        longitud=longitud or 0,
        estacion=estacion,
        perfumes_text=perfumes_text
    )

    return prompt, perfumes_lista


async def get_ai_recommendation(
    prompt: str,
    db: AsyncSession = None,
    user_id: int = None,
    recommendation_id: int = None
) -> str:
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

    start_time = time_module.time()
    success = True
    error_msg = None
    tokens_input = 0
    tokens_output = 0

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()

            data = response.json()

            # Extraer información de tokens del usageMetadata
            usage_metadata = data.get('usageMetadata', {})
            tokens_input = usage_metadata.get('promptTokenCount', 0)
            tokens_output = usage_metadata.get('candidatesTokenCount', 0)

            return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')

    except Exception as e:
        success = False
        error_msg = str(e)
        print(f"Error al llamar Gemini: {e}")
        return "No se pudo generar una recomendación en este momento."

    finally:
        # Registrar uso de API si tenemos sesión de DB
        if db:
            response_time_ms = int((time_module.time() - start_time) * 1000)
            try:
                from app.services.api_tracker import track_api_call
                await track_api_call(
                    db=db,
                    api_name='gemini',
                    endpoint=url,
                    tokens_input=tokens_input,
                    tokens_output=tokens_output,
                    response_time_ms=response_time_ms,
                    success=success,
                    error_message=error_msg,
                    user_id=user_id,
                    recommendation_id=recommendation_id
                )
            except Exception as track_error:
                print(f"Error al registrar uso de API Gemini: {track_error}")
