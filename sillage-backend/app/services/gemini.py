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
) -> str:
    """
    Construir el prompt para Gemini en el idioma especificado

    El sistema carga dinámicamente las traducciones desde app/i18n/languages/
    Para agregar un nuevo idioma, solo necesitas crear un archivo nuevo (ej: fr.py)
    con la misma estructura que es.py o en.py
    """

    # Cargar traducciones del idioma
    seasons = language_loader.get_seasons(idioma)
    time_of_day_dict = language_loader.get_time_of_day(idioma)
    perfume_labels = language_loader.get_perfume_labels(idioma)
    prompt_template = language_loader.get_prompt_template(idioma)

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

    # Mezclar perfumes aleatoriamente
    perfumes_lista = list(perfumes)
    random.shuffle(perfumes_lista)

    print("🧴 PERFUMES DISPONIBLES PARA LA RECOMENDACIÓN")
    print("-" * 80)
    for idx, p in enumerate(perfumes_lista, 1):
        print(f"\n{idx}. {p.nombre} ({p.marca})")
        if p.perfumista:
            print(f"   Perfumista: {p.perfumista}")
        if p.acordes:
            print(f"   Acordes ({len(p.acordes)}): {', '.join(p.acordes)}")
        else:
            print(f"   Acordes: ❌ NO DISPONIBLE")
        if p.notas:
            print(f"   Notas ({len(p.notas)}): {', '.join(p.notas)}")
        else:
            print(f"   Notas: ❌ NO DISPONIBLE")
    print("-" * 80 + "\n")

    # Formatear lista de perfumes usando las etiquetas traducidas
    perfumes_text = "\n".join([
        f"- {p.nombre} ({p.marca})"
        + (f", {perfume_labels['perfumer']}: {p.perfumista}" if p.perfumista else "")
        + (f", {perfume_labels['accords']}: {', '.join(p.acordes)}" if p.acordes else "")
        + (f", {perfume_labels['notes']}: {', '.join(p.notas)}" if p.notas else "")
        for p in perfumes_lista
    ])

    # Construir prompt usando el template del idioma
    prompt = prompt_template.format(
        lugar_nombre=lugar_nombre,
        lugar_tipo=lugar_tipo,
        lugar_descripcion=lugar_descripcion,
        fecha_evento=fecha_evento,
        hora_evento=hora_evento,
        momento_dia=momento_dia,
        clima_descripcion=clima_descripcion,
        temperatura=temperatura,
        humedad=humedad,
        estacion=estacion,
        ocasion=ocasion,
        expectativa=expectativa,
        vestimenta=vestimenta,
        perfumes_text=perfumes_text
    )

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
