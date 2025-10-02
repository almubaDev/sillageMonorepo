import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal, engine
from app.models.perfume import Perfume

async def load_perfumes():
    """Cargar perfumes de prueba en la base de datos"""
    
    perfumes_data = [
        {
            "nombre": "Aventus",
            "marca": "Creed",
            "perfumista": "Olivier Creed",
            "notas": ["piña", "bergamota", "manzana", "abedul", "pachuli", "vainilla"],
            "acordes": ["frutado", "amaderado", "cítrico"]
        },
        {
            "nombre": "Sauvage",
            "marca": "Dior",
            "perfumista": "François Demachy",
            "notas": ["bergamota", "pimienta", "lavanda", "ambroxan", "cedro"],
            "acordes": ["aromático", "fresco", "especiado"]
        },
        {
            "nombre": "Black Orchid",
            "marca": "Tom Ford",
            "perfumista": "Givaudan",
            "notas": ["trufa", "orquídea negra", "pachuli", "vainilla", "incienso"],
            "acordes": ["oriental", "dulce", "amaderado"]
        },
        {
            "nombre": "La Vie Est Belle",
            "marca": "Lancôme",
            "perfumista": "Olivier Polge",
            "notas": ["pera", "grosella negra", "iris", "jazmín", "praliné", "vainilla"],
            "acordes": ["dulce", "floral", "frutado"]
        },
        {
            "nombre": "Bleu de Chanel",
            "marca": "Chanel",
            "perfumista": "Jacques Polge",
            "notas": ["limón", "menta", "pomelo", "jengibre", "cedro", "sándalo"],
            "acordes": ["amaderado", "aromático", "cítrico"]
        }
    ]
    
    async with AsyncSessionLocal() as db:
        for perfume_data in perfumes_data:
            # Verificar si ya existe
            existing = await db.execute(
                select(Perfume).where(
                    Perfume.nombre == perfume_data["nombre"],
                    Perfume.marca == perfume_data["marca"]
                )
            )
            if not existing.scalar_one_or_none():
                new_perfume = Perfume(**perfume_data)
                db.add(new_perfume)
        
        await db.commit()
        print(f"✅ {len(perfumes_data)} perfumes de prueba cargados")

if __name__ == "__main__":
    from sqlalchemy import select
    asyncio.run(load_perfumes())