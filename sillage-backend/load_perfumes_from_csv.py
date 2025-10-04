import asyncio
import ast
import csv
import re
from pathlib import Path
from typing import Iterable, Optional, Tuple

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.perfume import Perfume


def _clean_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned or cleaned.lower() in {"nan", "unknown"}:
        return None
    return cleaned


def _parse_list(value: Optional[str]) -> Optional[list[str]]:
    if value is None:
        return None

    raw = value.strip()
    if not raw or raw.lower() == "nan":
        return None

    # Reemplazar valores `nan` sin comillas para que `literal_eval` pueda procesarlos.
    normalised = re.sub(r"\\bnan\\b", "None", raw, flags=re.IGNORECASE)

    try:
        parsed = ast.literal_eval(normalised)
    except (ValueError, SyntaxError):
        return None

    if isinstance(parsed, str):
        parsed = [parsed]
    elif not isinstance(parsed, Iterable):
        return None

    cleaned_items = []
    for item in parsed:
        if item is None:
            continue
        text = str(item).strip()
        if not text or text.lower() == "nan":
            continue
        cleaned_items.append(text)

    return cleaned_items or None


async def _load_existing_pairs() -> set[Tuple[str, str]]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Perfume.nombre, Perfume.marca))
        return {(nombre.lower(), marca.lower()) for nombre, marca in result.fetchall()}


async def load_perfumes_from_csv(csv_path: Path) -> Tuple[int, int]:
    if not csv_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo CSV en {csv_path}")

    existing_pairs = await _load_existing_pairs()
    added = 0
    skipped = 0

    async with AsyncSessionLocal() as session:
        with csv_path.open("r", encoding="utf-8", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                nombre = _clean_text(row.get("Perfume"))
                marca = _clean_text(row.get("Brand"))
                perfumista = _clean_text(row.get("Perfumer1"))
                notas = _parse_list(row.get("Notas"))
                acordes = _parse_list(row.get("Acordes"))

                if not nombre or not marca:
                    skipped += 1
                    continue

                key = (nombre.lower(), marca.lower())
                if key in existing_pairs:
                    skipped += 1
                    continue

                perfume = Perfume(
                    nombre=nombre,
                    marca=marca,
                    perfumista=perfumista,
                    notas=notas,
                    acordes=acordes,
                )
                session.add(perfume)
                existing_pairs.add(key)
                added += 1

        await session.commit()

    return added, skipped


async def _async_main(csv_path: Path) -> None:
    added, skipped = await load_perfumes_from_csv(csv_path)
    print(f"✅ Perfumes agregados: {added}")
    print(f"ℹ️ Registros omitidos (duplicados o incompletos): {skipped}")


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(
        description="Cargar perfumes desde un archivo CSV a la base de datos"
    )
    parser.add_argument(
        "csv_path",
        nargs="?",
        default=Path(__file__).resolve().parent / "perfumes_db2.csv",
        type=Path,
        help="Ruta al archivo CSV (por defecto: perfumes_db2.csv en la carpeta del backend)",
    )

    args = parser.parse_args()

    asyncio.run(_async_main(args.csv_path))


if __name__ == "__main__":
    main()
