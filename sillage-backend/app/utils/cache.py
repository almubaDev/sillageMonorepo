import redis.asyncio as redis
import json
from typing import Optional, Any
from app.core.config import settings


class RedisCache:
    def __init__(self):
        self.redis = None
    
    async def connect(self):
        """Conectar a Redis"""
        self.redis = await redis.from_url(
            str(settings.REDIS_URL),
            encoding="utf-8",
            decode_responses=True
        )
    
    async def disconnect(self):
        """Desconectar de Redis"""
        if self.redis:
            await self.redis.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtener valor del cache"""
        if not self.redis:
            return None
        
        value = await self.redis.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        return None
    
    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Guardar valor en cache con TTL"""
        if not self.redis:
            return False
        
        if not isinstance(value, str):
            value = json.dumps(value)
        
        return await self.redis.set(key, value, ex=expire)
    
    async def delete(self, key: str) -> bool:
        """Eliminar valor del cache"""
        if not self.redis:
            return False
        
        return await self.redis.delete(key) > 0
    
    async def exists(self, key: str) -> bool:
        """Verificar si existe una clave"""
        if not self.redis:
            return False
        
        return await self.redis.exists(key) > 0


# Instancia global
cache = RedisCache()