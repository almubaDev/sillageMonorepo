# Scripts de Sillage

## create_superuser.py

Script interactivo para crear y gestionar superusuarios en el sistema Sillage.

### Uso

```bash
cd sillage-backend
python scripts/create_superuser.py
```

### Características

- ✅ Creación interactiva de superusuarios
- ✅ Validación de email y contraseña
- ✅ Confirmación de contraseña
- ✅ Listado de superusuarios existentes
- ✅ Conversión de usuarios existentes a superusuarios
- ✅ Asignación automática del rol "superadmin"
- ✅ Inicialización automática de roles predeterminados

### Menú Principal

```
🔧 GESTIÓN DE SUPERUSUARIOS - SILLAGE

1. Crear nuevo superusuario
2. Listar superusuarios existentes
3. Salir
```

### Ejemplo de Uso

#### Crear un nuevo superusuario:

```
Selecciona una opción (1-3): 1

🔐  CREAR SUPERUSUARIO PARA SILLAGE ADMIN

📧 Email: admin@sillage.com
👤 Nombre: Admin
👤 Apellido: Principal
🔑 Password: ********
🔑 Confirmar password: ********

📋 Resumen del superusuario a crear:
   Email: admin@sillage.com
   Nombre: Admin Principal
   Privilegios: Superusuario (acceso completo)

¿Confirmar creación? (s/n): s

⏳ Creando superusuario...
🔧 Inicializando roles predeterminados...
✓ Rol 'superadmin' creado con éxito
✓ Rol 'admin' creado con éxito
✓ Rol 'moderator' creado con éxito
✓ Roles predeterminados inicializados correctamente

✅ SUPERUSUARIO CREADO EXITOSAMENTE
📧 Email: admin@sillage.com
👤 Nombre: Admin Principal
🔑 ID: 1
🛡️  Privilegios: Superusuario (acceso completo)
👥 Rol: superadmin

💡 Ahora puedes iniciar sesión en el panel administrativo con estas credenciales.
```

#### Listar superusuarios existentes:

```
Selecciona una opción (1-3): 2

👥 SUPERUSUARIOS EXISTENTES

1. admin@sillage.com
   Nombre: Admin Principal
   ID: 1
   Activo: Sí
   Verificado: Sí

2. superadmin@company.com
   Nombre: Super Admin
   ID: 5
   Activo: Sí
   Verificado: Sí
```

### Requisitos

- Python 3.10+
- Base de datos configurada (PostgreSQL)
- Variables de entorno configuradas en `.env`
- Migraciones aplicadas (`alembic upgrade head`)

### Validaciones

El script valida:

- ✅ Email válido (debe contener @)
- ✅ Nombre y apellido requeridos
- ✅ Contraseña mínimo 8 caracteres
- ✅ Confirmación de contraseña coincidente
- ✅ Email único (no puede estar duplicado)

### Conversión de Usuario Existente

Si intentas crear un superusuario con un email que ya existe, el script te ofrecerá convertir ese usuario existente en superusuario:

```
❌ Error: Ya existe un usuario con el email 'usuario@email.com'
¿Convertir este usuario en superusuario? (s/n): s

✅ Usuario 'usuario@email.com' convertido en superusuario exitosamente
```

### Errores Comunes

#### Error de Conexión a Base de Datos

```
❌ Error al crear superusuario: could not connect to server
```

**Solución**: Verifica que:
1. PostgreSQL esté corriendo
2. `DATABASE_URL` en `.env` sea correcto
3. Las credenciales de base de datos sean válidas

#### Error: Tabla "roles" no existe

```
❌ Error al crear superusuario: relation "roles" does not exist
```

**Solución**: Ejecuta las migraciones:
```bash
alembic upgrade head
```

### Seguridad

- ⚠️ **NO** compartas las credenciales del superusuario
- ⚠️ Usa contraseñas fuertes (mínimo 8 caracteres, combina mayúsculas, minúsculas, números y símbolos)
- ⚠️ Mantén un registro de quién tiene acceso de superusuario
- ⚠️ Revisa regularmente la lista de superusuarios y elimina los que ya no sean necesarios

### Cancelar Operación

Presiona `Ctrl+C` en cualquier momento para cancelar la operación:

```
^C

👋 Operación cancelada por el usuario
```

### Logs

El script muestra logs informativos durante la ejecución:

- 🔧 Inicialización de componentes
- ✓ Operaciones exitosas
- ❌ Errores
- ⚠️ Advertencias
- 💡 Sugerencias

### Próximos Pasos Después de Crear un Superusuario

1. **Iniciar sesión en la API**
   ```bash
   POST /api/v1/auth/login
   {
     "email": "admin@sillage.com",
     "password": "tu_password"
   }
   ```

2. **Acceder al Dashboard**
   ```bash
   GET /api/v1/admin/dashboard/stats
   Authorization: Bearer <token>
   ```

3. **Crear otros administradores**
   - Usa el endpoint `/api/v1/admin/users/{id}` para actualizar usuarios
   - Asigna el rol "admin" para administradores regulares
   - Asigna el rol "moderator" para usuarios con solo lectura

### Ver También

- [Documentación Completa del Sistema Admin](../Documentation/ADMIN_SYSTEM.md)
- [API Reference](http://localhost:8000/docs)
