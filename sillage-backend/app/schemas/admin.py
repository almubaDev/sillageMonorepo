from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


# ============= ROLE SCHEMAS =============

class RoleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    permissions: List[str] = Field(default_factory=list)


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=255)
    permissions: Optional[List[str]] = None


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= USER ADMIN SCHEMAS =============

class UserAdminUpdate(BaseModel):
    """Schema para actualizar usuarios desde el admin"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_superuser: Optional[bool] = None
    suscrito: Optional[bool] = None
    consultas_restantes: Optional[int] = Field(None, ge=0)
    role_ids: Optional[List[int]] = None  # IDs de roles a asignar


class UserAdminResponse(BaseModel):
    """Schema de respuesta para usuarios en admin"""
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    is_active: bool
    is_verified: bool
    is_admin: bool
    is_superuser: bool
    suscrito: bool
    consultas_restantes: int
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    roles: List[RoleResponse] = []

    class Config:
        from_attributes = True


class UserListFilter(BaseModel):
    """Filtros para listar usuarios"""
    search: Optional[str] = None  # Buscar por email, nombre o apellido
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_superuser: Optional[bool] = None
    suscrito: Optional[bool] = None
    role_id: Optional[int] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)
    order_by: str = Field("created_at", pattern="^(created_at|email|last_login)$")
    order_dir: str = Field("desc", pattern="^(asc|desc)$")


# ============= PERFUME ADMIN SCHEMAS =============

class PerfumeAdminCreate(BaseModel):
    """Schema para crear perfumes desde el admin - usa campos del modelo base"""
    nombre: str = Field(..., min_length=1, max_length=200)
    marca: str = Field(..., min_length=1, max_length=100)
    perfumista: Optional[str] = Field(None, max_length=100)
    notas: Optional[Dict[str, List[str]] | List[str]] = Field(default=None, description="Puede ser dict con keys o lista simple")
    acordes: Optional[List[str]] = Field(default=None, description="Lista de acordes")
    is_private: bool = Field(default=False, description="Si es privado, solo el creador puede verlo")


class PerfumeAdminUpdate(BaseModel):
    """Schema para actualizar perfumes desde el admin - usa campos del modelo base"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    marca: Optional[str] = Field(None, min_length=1, max_length=100)
    perfumista: Optional[str] = Field(None, max_length=100)
    notas: Optional[Dict[str, List[str]] | List[str]] = None
    acordes: Optional[List[str]] = None
    is_private: Optional[bool] = None


class PerfumeBulkImport(BaseModel):
    """Schema para importar perfumes en lote"""
    perfumes: List[PerfumeAdminCreate] = Field(..., min_length=1, max_length=100)


class PerfumeBulkImportResponse(BaseModel):
    """Respuesta de importación en lote"""
    success_count: int
    error_count: int
    errors: List[Dict[str, Any]] = Field(default_factory=list)
    created_ids: List[int] = Field(default_factory=list)


# ============= CONSULTATION GIFT SCHEMAS =============

class GiftConsultationsRequest(BaseModel):
    """Schema para regalar consultas a un usuario"""
    quantity: int = Field(..., ge=1, le=1000, description="Cantidad de consultas a regalar")
    reason: Optional[str] = Field(None, max_length=500, description="Motivo del regalo")


class GiftConsultationsResponse(BaseModel):
    """Respuesta al regalar consultas"""
    id: int
    user_id: int
    admin_id: int
    quantity: int
    reason: Optional[str]
    created_at: datetime
    new_total: int  # Total de consultas del usuario después del regalo

    class Config:
        from_attributes = True


# ============= DASHBOARD SCHEMAS =============

class DashboardStats(BaseModel):
    """Estadísticas del dashboard"""
    total_users: int
    active_users: int
    subscribed_users: int
    total_perfumes: int
    total_recommendations: int
    total_consultations_gifted: int
    new_users_this_month: int
    new_subscriptions_this_month: int


class UserGrowthData(BaseModel):
    """Datos de crecimiento de usuarios por mes"""
    month: str
    total_users: int
    new_users: int
    subscribed_users: int


class RecommendationStats(BaseModel):
    """Estadísticas de recomendaciones"""
    total: int
    by_gender: Dict[str, int]
    by_season: Dict[str, int]
    average_per_user: float


class DashboardCharts(BaseModel):
    """Datos para gráficos del dashboard"""
    user_growth: List[UserGrowthData]
    recommendation_stats: RecommendationStats
    subscription_rate: float  # Porcentaje de usuarios suscritos


# ============= ADMIN LOG SCHEMAS =============

class AdminLogResponse(BaseModel):
    """Respuesta de log administrativo"""
    id: int
    admin_id: Optional[int]
    admin_email: Optional[str]  # Email del admin que realizó la acción
    action: str
    resource: str
    resource_id: Optional[int]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminLogFilter(BaseModel):
    """Filtros para logs administrativos"""
    admin_id: Optional[int] = None
    action: Optional[str] = None
    resource: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(50, ge=1, le=100)


# ============= PAGINATION SCHEMAS =============

class PaginatedResponse(BaseModel):
    """Schema genérico para respuestas paginadas"""
    total: int
    skip: int
    limit: int
    items: List[Any]

    class Config:
        from_attributes = True
