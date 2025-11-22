import httpx
import random
from typing import List
from app.core.config import settings
from app.models.perfume import Perfume
from app.i18n.loader import language_loader


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
    clima_descripcion: str,
    idioma: str = "es"
) -> tuple[str, List[Perfume]]:
    """
    Construir el prompt para Gemini en el idioma especificado.

    Los perfumes se anonimizan (Perfume 1, Perfume 2, etc.) para evitar
    sesgos por popularidad o reconocimiento de marca.

    Retorna:
        tuple: (prompt, perfumes_ordenados) donde perfumes_ordenados es la lista
               en el mismo orden que aparecen en el prompt para mapear la respuesta
    """

    # Cargar traducciones del idioma
    seasons = language_loader.get_seasons(idioma)
    time_of_day_dict = language_loader.get_time_of_day(idioma)
    perfume_labels = language_loader.get_perfume_labels(idioma)
    prompt_template = language_loader.get_prompt_template(idioma)
    proximidad_dict = language_loader.get_proximidad_ocasion(idioma)

    # Determinar estación (hemisferio sur)
    mes = fecha_evento.month
    estacion = seasons.get(mes, "desconocida")

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
        lugar_nombre=lugar_nombre,
        lugar_descripcion=lugar_descripcion,
        tipo_espacio_desc=tipo_espacio_desc,
        fecha_evento=fecha_evento,
        hora_evento=hora_evento,
        momento_dia=momento_dia,
        clima_descripcion=clima_descripcion,
        temperatura=temperatura,
        humedad=humedad,
        estacion=estacion,
        ocasion=ocasion,
        proximidad=proximidad,
        expectativa=expectativa,
        vestimenta=vestimenta,
        perfumes_text=perfumes_text
    )

    return prompt, perfumes_lista


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
