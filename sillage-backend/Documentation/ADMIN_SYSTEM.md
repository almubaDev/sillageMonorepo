# Sistema Administrativo Sillage

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Crear un Superusuario](#crear-un-superusuario)
5. [Sistema de Permisos](#sistema-de-permisos)
6. [Endpoints de API](#endpoints-de-api)
7. [Ejemplos de Uso](#ejemplos-de-uso)
8. [Seguridad](#seguridad)

---

## Introducción

El Sistema Administrativo de Sillage proporciona un conjunto completo de herramientas para gestionar usuarios, perfumes, consultas y monitorear el sistema. Está inspirado en Django Admin pero construido específicamente para FastAPI.

### Características Principales

- ✅ **Gestión de Usuarios**: CRUD completo, activación/desactivación, asignación de roles
- ✅ **Gestión de Perfumes**: Crear, editar, eliminar y importación masiva
- ✅ **Sistema de Roles y Permisos**: Control granular de acceso
- ✅ **Regalos de Consultas**: Otorgar consultas gratis a usuarios
- ✅ **Dashboard con Estadísticas**: Métricas en tiempo real del sistema
- ✅ **Logs de Auditoría**: Registro completo de acciones administrativas
- ✅ **API RESTful**: Todos los endpoints documentados con OpenAPI/Swagger

---

## Arquitectura

### Componentes del Sistema

```
sillage-backend/
├── app/
│   ├── models/
│   │   ├── role.py                 # Modelos de Role, AdminLog, GiftedConsultation
│   │   └── user.py                 # Usuario con is_admin, is_superuser
│   ├── schemas/
│   │   └── admin.py                # Esquemas Pydantic para admin
│   ├── core/
│   │   └── permissions.py          # Sistema de permisos
│   └── api/
│       └── v1/
│           └── endpoints/
│               └── admin/
│                   ├── users.py             # Gestión de usuarios
│                   ├── perfumes.py          # Gestión de perfumes
│                   ├── consultations.py     # Regalos de consultas
│                   └── dashboard.py         # Dashboard y estadísticas
└── scripts/
    └── create_superuser.py         # Script para crear superusuarios
```

### Base de Datos

#### Nuevas Tablas

**roles**
- `id`: Integer, Primary Key
- `name`: String(50), Unique
- `description`: String(255)
- `permissions`: JSON (lista de permisos)
- `created_at`, `updated_at`: DateTime

**user_roles** (tabla de asociación)
- `user_id`: Integer, Foreign Key → users.id
- `role_id`: Integer, Foreign Key → roles.id
- `created_at`: DateTime

**admin_logs**
- `id`: Integer, Primary Key
- `admin_id`: Integer, Foreign Key → users.id
- `action`: String(100) (CREATE, UPDATE, DELETE, etc.)
- `resource`: String(50) (users, perfumes, etc.)
- `resource_id`: Integer
- `details`: JSON
- `ip_address`: String(45)
- `created_at`: DateTime

**gifted_consultations**
- `id`: Integer, Primary Key
- `user_id`: Integer, Foreign Key → users.id
- `admin_id`: Integer, Foreign Key → users.id
- `quantity`: Integer
- `reason`: String(500)
- `created_at`: DateTime

#### Campos Agregados a Usuarios

- `is_admin`: Boolean (para administradores regulares)
- Campo `is_superuser` ya existía

---

## Instalación y Configuración

### 1. Aplicar Migraciones

Primero, aplica las migraciones de base de datos:

```bash
cd sillage-backend

# Si tienes venv activado
alembic upgrade head

# En Windows sin venv
python -m alembic upgrade head
```

### 2. Verificar Instalación

Inicia el servidor:

```bash
uvicorn app.main:app --reload
```

Verifica que los roles se inicializaron correctamente en los logs:
```
✓ Default roles initialized
```

### 3. Acceder a la Documentación

Visita: `http://localhost:8000/docs`

Deberías ver las nuevas secciones:
- Admin - Users
- Admin - Perfumes
- Admin - Consultations
- Admin - Dashboard

---

## Crear un Superusuario

### Método 1: Script Interactivo (Recomendado)

```bash
cd sillage-backend
python scripts/create_superuser.py
```

El script te guiará paso a paso:

```
🔐  CREAR SUPERUSUARIO PARA SILLAGE ADMIN

📧 Email: admin@sillage.com
👤 Nombre: Admin
👤 Apellido: Principal
🔑 Password: ********
🔑 Confirmar password: ********

¿Confirmar creación? (s/n): s

✅ SUPERUSUARIO CREADO EXITOSAMENTE
```

### Método 2: Directamente en la Base de Datos

Si necesitas crear un superusuario directamente:

```python
from app.core.security import get_password_hash
from app.models.user import User
from app.models.role import Role
from app.core.database import AsyncSessionLocal
from sqlalchemy import select

async def create_superuser_manual():
    async with AsyncSessionLocal() as db:
        # Crear usuario
        user = User(
            email="admin@sillage.com",
            first_name="Admin",
            last_name="Principal",
            hashed_password=get_password_hash("tu_password_seguro"),
            is_active=True,
            is_verified=True,
            is_admin=True,
            is_superuser=True
        )
        db.add(user)
        await db.flush()

        # Asignar rol superadmin
        stmt = select(Role).where(Role.name == "superadmin")
        result = await db.execute(stmt)
        superadmin_role = result.scalar_one()
        user.roles.append(superadmin_role)

        await db.commit()
        print(f"✅ Superusuario creado: {user.email}")
```

---

## Sistema de Permisos

### Roles Predeterminados

El sistema viene con 3 roles predefinidos:

#### 1. **superadmin** (Acceso Completo)
Permisos:
- `users.*` (todos)
- `perfumes.*` (todos)
- `subscriptions.*` (todos)
- `consultations.*` (todos)
- `roles.*` (todos)
- `dashboard.*` (todos)
- `logs.read`

#### 2. **admin** (Administrador Regular)
Permisos:
- `users.read`, `users.write`
- `perfumes.read`, `perfumes.write`
- `subscriptions.read`
- `consultations.gift`, `consultations.read`
- `dashboard.view`, `dashboard.stats`

#### 3. **moderator** (Solo Lectura)
Permisos:
- `users.read`
- `perfumes.read`
- `subscriptions.read`
- `consultations.read`
- `dashboard.view`
- `logs.read`

### Lista Completa de Permisos

```python
# Usuarios
Permission.USERS_READ = "users.read"
Permission.USERS_WRITE = "users.write"
Permission.USERS_DELETE = "users.delete"

# Perfumes
Permission.PERFUMES_READ = "perfumes.read"
Permission.PERFUMES_WRITE = "perfumes.write"
Permission.PERFUMES_DELETE = "perfumes.delete"

# Suscripciones
Permission.SUBSCRIPTIONS_READ = "subscriptions.read"
Permission.SUBSCRIPTIONS_WRITE = "subscriptions.write"

# Consultas
Permission.CONSULTATIONS_GIFT = "consultations.gift"
Permission.CONSULTATIONS_READ = "consultations.read"

# Roles
Permission.ROLES_READ = "roles.read"
Permission.ROLES_WRITE = "roles.write"

# Dashboard
Permission.DASHBOARD_VIEW = "dashboard.view"
Permission.DASHBOARD_STATS = "dashboard.stats"

# Logs
Permission.LOGS_READ = "logs.read"
```

### Proteger Endpoints

Existen varias formas de proteger endpoints:

#### 1. Verificar Permiso Específico

```python
from app.core.permissions import Permission, require_permission

@router.get("/users", dependencies=[Depends(require_permission(Permission.USERS_READ))])
async def list_users():
    # Solo accesible con permiso USERS_READ
    pass
```

#### 2. Verificar que es Admin

```python
from app.core.permissions import require_admin

@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_stats():
    # Accesible para cualquier admin o superuser
    pass
```

#### 3. Verificar que es Superuser

```python
from app.core.permissions import require_superuser

@router.delete("/user/{id}", dependencies=[Depends(require_superuser)])
async def delete_user_permanently():
    # Solo superusuarios
    pass
```

---

## Endpoints de API

### Autenticación

Todos los endpoints admin requieren autenticación JWT. Primero, obtén un token:

```bash
POST /api/v1/auth/login
{
  "email": "admin@sillage.com",
  "password": "tu_password"
}

# Respuesta
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

Usa el token en todas las peticiones admin:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Gestión de Usuarios

#### Listar Usuarios
```bash
GET /api/v1/admin/users?search=juan&is_active=true&skip=0&limit=50

# Filtros disponibles:
- search: Buscar por email, nombre o apellido
- is_active: true/false
- is_admin: true/false
- is_superuser: true/false
- suscrito: true/false
- role_id: ID del rol
- order_by: created_at | email | last_login
- order_dir: asc | desc
```

#### Obtener Detalle de Usuario
```bash
GET /api/v1/admin/users/{user_id}
```

#### Actualizar Usuario
```bash
PATCH /api/v1/admin/users/{user_id}
{
  "email": "nuevo@email.com",
  "first_name": "Nuevo",
  "last_name": "Nombre",
  "is_active": true,
  "is_admin": true,
  "suscrito": true,
  "consultas_restantes": 10,
  "role_ids": [1, 2]  // Solo superusuarios
}
```

#### Desactivar Usuario
```bash
DELETE /api/v1/admin/users/{user_id}
# Soft delete - solo desactiva el usuario
```

### Gestión de Perfumes

#### Listar Perfumes
```bash
GET /api/v1/admin/perfumes?search=dior&skip=0&limit=50
```

#### Obtener Perfume
```bash
GET /api/v1/admin/perfumes/{perfume_id}
```

#### Crear Perfume
```bash
POST /api/v1/admin/perfumes
{
  "name": "Sauvage",
  "brand": "Dior",
  "notes": ["bergamota", "pimienta", "ambroxan"],
  "notes_top": ["bergamota", "pimienta"],
  "notes_middle": ["lavanda"],
  "notes_base": ["ambroxan", "cedro"],
  "gender": "masculino",
  "concentration": "eau de toilette",
  "description": "Una fragancia fresca y especiada",
  "season": "all",
  "occasion": "casual",
  "longevity": 8,
  "sillage": 7,
  "price_range": "alto"
}
```

#### Importación Masiva
```bash
POST /api/v1/admin/perfumes/bulk
{
  "perfumes": [
    { /* perfume 1 */ },
    { /* perfume 2 */ },
    { /* ... hasta 100 perfumes */ }
  ]
}

# Respuesta
{
  "success_count": 95,
  "error_count": 5,
  "errors": [
    {
      "index": 3,
      "name": "Perfume X",
      "brand": "Marca Y",
      "error": "Ya existe"
    }
  ],
  "created_ids": [101, 102, 103, ...]
}
```

#### Actualizar Perfume
```bash
PUT /api/v1/admin/perfumes/{perfume_id}
{
  "name": "Nuevo Nombre",
  "longevity": 9
}
```

#### Eliminar Perfume
```bash
DELETE /api/v1/admin/perfumes/{perfume_id}
# Hard delete - elimina permanentemente
```

### Regalos de Consultas

#### Regalar Consultas
```bash
POST /api/v1/admin/consultations/gift/{user_id}
{
  "quantity": 5,
  "reason": "Premio por ser usuario activo"
}

# Respuesta
{
  "id": 1,
  "user_id": 123,
  "admin_id": 1,
  "quantity": 5,
  "reason": "Premio por ser usuario activo",
  "created_at": "2025-10-16T12:00:00Z",
  "new_total": 15  // Total de consultas del usuario después del regalo
}
```

#### Historial de Regalos
```bash
GET /api/v1/admin/consultations/gifted?user_id=123&skip=0&limit=50
```

#### Estadísticas de Consultas
```bash
GET /api/v1/admin/consultations/stats

# Respuesta
{
  "total_consultations_gifted": 450,
  "unique_recipients": 89,
  "admins_who_gifted": 3,
  "total_gift_records": 127,
  "average_per_gift": 3.54
}
```

### Dashboard

#### Estadísticas Generales
```bash
GET /api/v1/admin/dashboard/stats

# Respuesta
{
  "total_users": 1250,
  "active_users": 1100,
  "subscribed_users": 350,
  "total_perfumes": 450,
  "total_recommendations": 5600,
  "total_consultations_gifted": 450,
  "new_users_this_month": 89,
  "new_subscriptions_this_month": 25
}
```

#### Datos para Gráficos
```bash
GET /api/v1/admin/dashboard/charts?months=12

# Respuesta
{
  "user_growth": [
    {
      "month": "2024-11",
      "total_users": 1000,
      "new_users": 50,
      "subscribed_users": 300
    },
    // ... más meses
  ],
  "recommendation_stats": {
    "total": 5600,
    "by_gender": {
      "masculino": 2500,
      "femenino": 2800,
      "unisex": 300
    },
    "by_season": {
      "primavera": 1200,
      "verano": 1500,
      "otoño": 1400,
      "invierno": 1500
    },
    "average_per_user": 4.48
  },
  "subscription_rate": 28.00
}
```

#### Actividad Reciente
```bash
GET /api/v1/admin/dashboard/recent-activity?limit=10

# Respuesta
{
  "recent_users": [ /* últimos usuarios registrados */ ],
  "recent_recommendations": [ /* últimas recomendaciones */ ],
  "recent_gifts": [ /* últimos regalos de consultas */ ]
}
```

---

## Ejemplos de Uso

### Caso 1: Crear Perfumes Masivamente

```python
import requests
import json

# 1. Autenticar
login_response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={
        "email": "admin@sillage.com",
        "password": "tu_password"
    }
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Preparar perfumes
perfumes = [
    {
        "name": "Sauvage",
        "brand": "Dior",
        "notes": ["bergamota", "pimienta", "ambroxan"],
        "notes_top": ["bergamota"],
        "notes_middle": ["lavanda"],
        "notes_base": ["ambroxan"],
        "gender": "masculino",
        "concentration": "eau de toilette",
        "season": "all",
        "longevity": 8,
        "sillage": 7,
        "price_range": "alto"
    },
    # ... más perfumes
]

# 3. Importar
response = requests.post(
    "http://localhost:8000/api/v1/admin/perfumes/bulk",
    headers=headers,
    json={"perfumes": perfumes}
)

print(f"✅ Creados: {response.json()['success_count']}")
print(f"❌ Errores: {response.json()['error_count']}")
```

### Caso 2: Regalar Consultas a Usuarios Activos

```python
# 1. Obtener usuarios suscritos
users_response = requests.get(
    "http://localhost:8000/api/v1/admin/users?suscrito=true&limit=100",
    headers=headers
)
users = users_response.json()["items"]

# 2. Regalar 3 consultas a cada uno
for user in users:
    requests.post(
        f"http://localhost:8000/api/v1/admin/consultations/gift/{user['id']}",
        headers=headers,
        json={
            "quantity": 3,
            "reason": "Regalo por ser usuario suscrito"
        }
    )
    print(f"✅ Regaladas 3 consultas a {user['email']}")
```

### Caso 3: Monitorear Sistema

```python
# Obtener estadísticas
stats = requests.get(
    "http://localhost:8000/api/v1/admin/dashboard/stats",
    headers=headers
).json()

print(f"👥 Total Usuarios: {stats['total_users']}")
print(f"💳 Suscritos: {stats['subscribed_users']}")
print(f"📈 Tasa de Suscripción: {stats['subscribed_users'] / stats['total_users'] * 100:.2f}%")
print(f"🎁 Consultas Regaladas: {stats['total_consultations_gifted']}")
```

---

## Seguridad

### Mejores Prácticas

1. **Contraseñas Fuertes**
   - Mínimo 8 caracteres
   - Combinar mayúsculas, minúsculas, números y símbolos
   - Usar un gestor de contraseñas

2. **Principio de Privilegio Mínimo**
   - No hagas a todos superusuarios
   - Usa roles según la función (admin, moderator)
   - Revisa permisos regularmente

3. **Monitoreo**
   - Revisa `admin_logs` regularmente
   - Busca actividad sospechosa
   - Implementa alertas para acciones críticas

4. **Tokens JWT**
   - Los tokens expiran (configurado en settings)
   - No compartas tokens
   - Rota `SECRET_KEY` periódicamente

5. **Auditoría**
   ```python
   # Consultar logs de un admin específico
   logs = await db.execute(
       select(AdminLog)
       .where(AdminLog.admin_id == admin_id)
       .order_by(AdminLog.created_at.desc())
   )
   ```

### Restricciones Implementadas

- ✅ Superusuarios no pueden ser modificados por admins regulares
- ✅ Admins no pueden quitarse sus propios privilegios
- ✅ Admins no pueden auto-eliminarse
- ✅ Solo superusuarios pueden asignar roles
- ✅ Todas las acciones se registran con IP
- ✅ Soft delete para usuarios (desactivación, no eliminación)

---

## Troubleshooting

### Error: "Could not initialize roles"

**Solución**: Las tablas no existen. Ejecuta las migraciones:
```bash
alembic upgrade head
```

### Error: "403 Forbidden - No permission"

**Solución**: Tu usuario no tiene el permiso requerido. Verifica:
1. ¿Eres admin? (`is_admin=True` o `is_superuser=True`)
2. ¿Tienes el rol correcto asignado?
3. ¿El rol tiene el permiso necesario?

```python
# Asignar rol manualmente
from sqlalchemy import select
from app.models.user import User
from app.models.role import Role

async with AsyncSessionLocal() as db:
    user = await db.get(User, user_id)
    role = await db.execute(select(Role).where(Role.name == "admin"))
    user.roles.append(role.scalar_one())
    await db.commit()
```

### Error: "User not found" al crear superuser

**Solución**: Verifica la conexión a la base de datos en `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/sillage
```

---

## Próximos Pasos

### Mejoras Sugeridas

1. **Frontend Admin Panel**
   - Implementar con Next.js 14
   - Dashboard interactivo con gráficos
   - Gestión visual de usuarios y perfumes

2. **Notificaciones**
   - Email cuando se regalan consultas
   - Alertas de actividad sospechosa
   - Reportes semanales automáticos

3. **Exportación de Datos**
   - CSV de usuarios
   - Reportes PDF
   - Backup automático

4. **Roles Personalizados**
   - Interfaz para crear roles custom
   - Permisos granulares por recurso
   - Herencia de roles

---

## Soporte

Para reportar bugs o solicitar características:
1. Abre un issue en el repositorio
2. Incluye logs relevantes
3. Describe los pasos para reproducir

**¡Disfruta gestionando Sillage! 🎉**
