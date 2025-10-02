from app.core.database import Base
from app.models.user import User
from app.models.perfume import Perfume, perfume_collection
from app.models.recommendation import Recomendacion
from app.models.subscription import Suscripcion, HistorialPago

# Esto es importante para que Alembic detecte todos los modelos
__all__ = [
    "Base",
    "User", 
    "Perfume", 
    "perfume_collection",
    "Recomendacion", 
    "Suscripcion", 
    "HistorialPago"
]