"""
Script para poblar la base de datos con perfumes populares iniciales
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.perfume import Perfume


PERFUMES_SEED_DATA = [
    {
        "nombre": "Sauvage",
        "marca": "Dior",
        "perfumista": "François Demachy",
        "notas": {
            "salida": ["Bergamota de Calabria", "Pimienta"],
            "corazon": ["Pimienta Sichuan", "Lavanda", "Pimienta Rosa", "Vetiver", "Pachulí", "Geranio", "Elemi"],
            "fondo": ["Ambroxan", "Cedro", "Labdanum"]
        },
        "acordes": ["Aromático", "Fresco", "Amaderado"],
        "is_private": False
    },
    {
        "nombre": "Acqua di Giò",
        "marca": "Armani",
        "perfumista": "Alberto Morillas",
        "notas": {
            "salida": ["Lima", "Limón", "Bergamota", "Jazmín", "Naranja", "Mandarina"],
            "corazon": ["Calone", "Jazmín", "Cassia", "Reseda", "Rosa", "Fresia", "Ciclamen", "Violeta", "Cilantro", "Nuez moscada", "Flor de melocotón", "Jacinto"],
            "fondo": ["Almizcle blanco", "Cedro", "Musgo de roble", "Pachulí", "Ámbar"]
        },
        "acordes": ["Acuático", "Aromático", "Cítrico"],
        "is_private": False
    },
    {
        "nombre": "Bleu de Chanel",
        "marca": "Chanel",
        "perfumista": "Jacques Polge",
        "notas": {
            "salida": ["Pomelo", "Limón", "Menta", "Pimienta rosa", "Bergamota", "Aldehídos", "Coriandro"],
            "corazon": ["Jengibre", "Nuez moscada", "Jazmín", "Notas metálicas"],
            "fondo": ["Incienso", "Vetiver", "Cedro", "Sándalo", "Pachulí", "Labdanum", "Almizcle blanco", "Ámbar"]
        },
        "acordes": ["Amaderado", "Aromático", "Fresco"],
        "is_private": False
    },
    {
        "nombre": "One Million",
        "marca": "Paco Rabanne",
        "perfumista": "Christophe Raynaud, Michel Girard, Christian Dussoulier",
        "notas": {
            "salida": ["Pomelo", "Menta", "Mandarina Roja"],
            "corazon": ["Pimienta Rosa", "Canela", "Especias", "Rosa"],
            "fondo": ["Ámbar", "Pachulí", "Acuerdo de cuero", "Madera de cachemira", "Musgo de roble", "Tonka"]
        },
        "acordes": ["Amaderado-Especiado", "Dulce", "Ámbar"],
        "is_private": False
    },
    {
        "nombre": "La Vie est Belle",
        "marca": "Lancôme",
        "perfumista": "Olivier Polge, Dominique Ropion, Anne Flipo",
        "notas": {
            "salida": ["Grosella negra", "Pera"],
            "corazon": ["Iris", "Jazmín", "Azahar"],
            "fondo": ["Praliné", "Vainilla", "Pachulí", "Tonka", "Café"]
        },
        "acordes": ["Gourmand", "Floral", "Dulce"],
        "is_private": False
    },
    {
        "nombre": "Flowerbomb",
        "marca": "Viktor & Rolf",
        "perfumista": "Olivier Polge, Carlos Benaim, Domitille Bertier",
        "notas": {
            "salida": ["Té", "Bergamota", "Osmanthus"],
            "corazon": ["Fresia", "Orquídea", "Rosa", "Jazmín Sambac"],
            "fondo": ["Almizcle", "Pachulí", "Ámbar"]
        },
        "acordes": ["Floral", "Ámbar", "Fresco"],
        "is_private": False
    },
    {
        "nombre": "Coco Mademoiselle",
        "marca": "Chanel",
        "perfumista": "Jacques Polge",
        "notas": {
            "salida": ["Naranja", "Mandarina", "Bergamota de Calabria", "Naranja Amarga"],
            "corazon": ["Lichi", "Jazmín", "Rosa"],
            "fondo": ["Pachulí", "Vetiver", "Vainilla", "Almizcle blanco", "Tonka", "Ylang-Ylang"]
        },
        "acordes": ["Oriental", "Floral", "Fresco"],
        "is_private": False
    },
    {
        "nombre": "212 VIP Men",
        "marca": "Carolina Herrera",
        "perfumista": "Lucas Sieuzac",
        "notas": {
            "salida": ["Pimienta", "Jengibre", "Caviar de Lima", "Vodka Helado"],
            "corazon": ["Vodka Congelado", "Gin y Menta", "Especias calientes"],
            "fondo": ["Pieles Preciosas", "Ámbar", "Madera de Rey"]
        },
        "acordes": ["Amaderado-Especiado", "Fresco", "Aromático"],
        "is_private": False
    },
    {
        "nombre": "Black Opium",
        "marca": "Yves Saint Laurent",
        "perfumista": "Nathalie Lorson, Marie Salamagne, Olivier Cresp, Honorine Blanc",
        "notas": {
            "salida": ["Pera", "Mandarina Rosa", "Naranja Amarga"],
            "corazon": ["Café", "Flor de Jazmín", "Almendra Amarga", "Regaliz"],
            "fondo": ["Vainilla", "Pachulí", "Cedro", "Almizcle Cachemira"]
        },
        "acordes": ["Gourmand", "Oriental", "Café"],
        "is_private": False
    },
    {
        "nombre": "Le Male",
        "marca": "Jean Paul Gaultier",
        "perfumista": "Francis Kurkdjian",
        "notas": {
            "salida": ["Lavanda", "Menta", "Cardamomo", "Bergamota", "Artemisia"],
            "corazon": ["Naranja Dulce", "Canela", "Comino"],
            "fondo": ["Vainilla", "Tonka", "Cedro", "Sándalo", "Ámbar", "Pachulí"]
        },
        "acordes": ["Oriental", "Amaderado", "Aromático"],
        "is_private": False
    }
]


async def seed_perfumes():
    """Poblar la base de datos con perfumes iniciales"""
    print("🌱 Iniciando seed de perfumes...")

    async with AsyncSessionLocal() as db:
        # Verificar cuántos perfumes ya existen
        result = await db.execute(select(Perfume))
        existing_count = len(result.scalars().all())

        if existing_count >= len(PERFUMES_SEED_DATA):
            print(f"✓ Ya existen {existing_count} perfumes en la base de datos")
            print("  No es necesario hacer seed")
            return

        added_count = 0
        skipped_count = 0

        for perfume_data in PERFUMES_SEED_DATA:
            # Verificar si ya existe
            stmt = select(Perfume).where(
                Perfume.nombre == perfume_data["nombre"],
                Perfume.marca == perfume_data["marca"]
            )
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                print(f"⏭️  Saltando '{perfume_data['nombre']}' de {perfume_data['marca']} (ya existe)")
                skipped_count += 1
                continue

            # Crear nuevo perfume
            perfume = Perfume(**perfume_data)
            db.add(perfume)
            added_count += 1
            print(f"✅ Agregado: '{perfume_data['nombre']}' - {perfume_data['marca']}")

        # Commit todos los cambios
        await db.commit()

        print(f"\n🎉 Seed completado:")
        print(f"   • Perfumes agregados: {added_count}")
        print(f"   • Perfumes existentes (saltados): {skipped_count}")
        print(f"   • Total en DB: {existing_count + added_count}")


if __name__ == "__main__":
    print("=" * 60)
    print("  SILLAGE - Seed de Perfumes Populares")
    print("=" * 60)
    print()

    try:
        asyncio.run(seed_perfumes())
        print("\n✅ Proceso completado exitosamente\n")
    except Exception as e:
        print(f"\n❌ Error durante el seed: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
