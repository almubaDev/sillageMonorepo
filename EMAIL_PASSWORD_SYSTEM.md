# ✅ Sistema de Email y Gestión de Contraseñas - IMPLEMENTADO

## 📧 Sistema de Email Configurado

### Backend - Configuración

**Archivo:** `sillage-backend/app/core/config.py`
```python
# Email
EMAIL_HOST: str = "smtp.gmail.com"
EMAIL_PORT: int = 587
EMAIL_USE_TLS: bool = True
EMAIL_HOST_USER: str
EMAIL_HOST_PASSWORD: str
DEFAULT_FROM_EMAIL: str
```

**Variables de entorno** (`.env.example`):
```bash
# Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=info@consultorabadillo.com
EMAIL_HOST_PASSWORD=iull_xaej_utmc_zvrf
DEFAULT_FROM_EMAIL=info@consultorabadillo.com
```

### Servicio de Email

**Archivo:** `sillage-backend/app/services/email.py`

Funciones implementadas:
- ✅ `send_email()` - Envío genérico de emails con HTML y texto plano
- ✅ `send_welcome_email()` - Email de bienvenida al registrarse
- ✅ `send_password_reset_email()` - Email con código de recuperación
- ✅ `send_password_changed_email()` - Confirmación de cambio de contraseña

**Características:**
- Templates HTML responsive con gradientes
- Contenido en texto plano alternativo
- Manejo de errores con logging
- Emails transaccionales automáticos

---

## 🔒 Sistema de Gestión de Contraseñas

### Base de Datos

**Nuevo modelo:** `sillage-backend/app/models/password_reset.py`

```python
class PasswordResetToken(Base):
    id: int
    user_id: int
    token: str  # Código de 6 dígitos
    created_at: datetime
    expires_at: datetime  # Expira en 1 hora
    used: bool
    used_at: datetime | None
```

**Migración:** `sillage-backend/alembic/versions/4b9f5e6c7d8a_add_password_reset_tokens.py`

### Schemas

**Archivo:** `sillage-backend/app/schemas/password.py`

- `PasswordResetRequest` - Solicitar recuperación
- `PasswordResetVerify` - Verificar token y cambiar contraseña
- `PasswordChange` - Cambiar contraseña (usuario autenticado)
- `PasswordResetResponse` - Respuesta de operación
- `PasswordChangeResponse` - Confirmación de cambio

**Validaciones:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 número

### Endpoints Backend

**Archivo:** `sillage-backend/app/api/v1/endpoints/password.py`

#### POST `/api/v1/password/request-reset`
Solicitar recuperación de contraseña
- **Body:** `{ "email": "user@example.com" }`
- **Acción:**
  - Genera código de 6 dígitos
  - Expira en 1 hora
  - Envía email con el código
  - No revela si el email existe (seguridad)

#### POST `/api/v1/password/reset-password`
Restablecer contraseña con código
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "token": "123456",
    "new_password": "NewPass123"
  }
  ```
- **Validaciones:**
  - Código válido y no expirado
  - Contraseña cumple requisitos
- **Acción:**
  - Cambia la contraseña
  - Marca token como usado
  - Envía email de confirmación

#### POST `/api/v1/password/change-password` 🔐
Cambiar contraseña (requiere autenticación)
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "current_password": "OldPass123",
    "new_password": "NewPass123"
  }
  ```
- **Validaciones:**
  - Contraseña actual correcta
  - Nueva contraseña diferente
  - Cumple requisitos
- **Acción:**
  - Actualiza contraseña
  - Envía email de confirmación

### Integración con Registro

**Modificado:** `sillage-backend/app/api/v1/endpoints/auth.py`

El endpoint de registro ahora envía automáticamente email de bienvenida:
```python
# Enviar email de bienvenida (no bloquear si falla)
try:
    email_service.send_welcome_email(
        user_email=db_user.email,
        user_name=db_user.first_name or "Usuario"
    )
except Exception as e:
    print(f"⚠️ Error enviando email de bienvenida: {str(e)}")
```

---

## 📱 Frontend Mobile - Gestión de Contraseñas

### Pantalla de Perfil

**Archivo:** `sillage-mobile/src/screens/Profile/ProfileScreen.tsx`

**Nuevo botón:**
```tsx
<TouchableOpacity onPress={() => setPasswordModalVisible(true)}>
  <MaterialCommunityIcons name="lock-reset" />
  <Text>{t('profile:actions.changePassword')}</Text>
</TouchableOpacity>
```

**Modal completo con:**
- 3 inputs de contraseña (actual, nueva, confirmar)
- Botones de mostrar/ocultar contraseña
- Requisitos visibles
- Validaciones en cliente
- Mensajes de error/éxito

### Servicio de Autenticación

**Archivo:** `sillage-mobile/src/services/authService.ts`

**Nuevas funciones:**
```typescript
// Cambiar contraseña
async changePassword(currentPassword: string, newPassword: string): Promise<void>

// Solicitar recuperación
async requestPasswordReset(email: string): Promise<void>

// Restablecer con token
async resetPassword(email: string, token: string, newPassword: string): Promise<void>
```

### Traducciones

**Archivos actualizados:**
- `sillage-mobile/src/i18n/locales/es/profile.json`
- `sillage-mobile/src/i18n/locales/en/profile.json`

**Nuevas claves:**
```json
{
  "password": {
    "title": "Cambiar Contraseña",
    "currentPassword": "Contraseña Actual",
    "newPassword": "Nueva Contraseña",
    "confirmPassword": "Confirmar Contraseña",
    "requirements": "Requisitos de contraseña:",
    "req8Chars": "Mínimo 8 caracteres",
    "reqUppercase": "Al menos una mayúscula",
    "reqNumber": "Al menos un número",
    // ... más traducciones
  }
}
```

---

## 🚀 Cómo Usar

### 1. Configurar Variables de Entorno

Copiar `.env.example` a `.env` en `sillage-backend/`:
```bash
cd sillage-backend
cp .env.example .env
```

Actualizar con tus credenciales de Gmail:
```bash
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-app-password
```

**Nota:** Para Gmail, necesitas generar una [Contraseña de Aplicación](https://support.google.com/accounts/answer/185833)

### 2. Ejecutar Migración

```bash
cd sillage-backend
alembic upgrade head
```

Esto crea la tabla `password_reset_tokens`.

### 3. Probar el Sistema

#### Registro de Usuario
1. Registrar un nuevo usuario desde la app
2. Verificar que llegue el email de bienvenida

#### Cambio de Contraseña (Autenticado)
1. Ir a Perfil en la app
2. Clic en "Cambiar Contraseña"
3. Ingresar contraseña actual y nueva
4. Verificar email de confirmación

#### Recuperación de Contraseña (Sin sesión)
1. Llamar a `/api/v1/password/request-reset`
2. Revisar email con código de 6 dígitos
3. Llamar a `/api/v1/password/reset-password` con el código
4. Verificar email de confirmación

---

## 📋 Checklist de Implementación

### Backend ✅
- [x] Configuración de email en `config.py`
- [x] Servicio de email con templates HTML
- [x] Modelo `PasswordResetToken`
- [x] Migración de Alembic
- [x] Schemas de contraseña
- [x] Endpoint de solicitud de reset
- [x] Endpoint de reset con token
- [x] Endpoint de cambio autenticado
- [x] Integración con registro
- [x] Variables de entorno documentadas

### Mobile ✅
- [x] Botón de cambiar contraseña en perfil
- [x] Modal de cambio de contraseña
- [x] Validaciones en cliente
- [x] Manejo de errores
- [x] Funciones en `authService`
- [x] Traducciones ES/EN
- [x] UI responsive con ThemeProvider

---

## 🔐 Seguridad

### Implementado ✅
- Códigos de recuperación de 6 dígitos (solo números)
- Tokens expiran en 1 hora
- Tokens de un solo uso
- Contraseñas hasheadas con bcrypt
- Validaciones de complejidad
- No revela si emails existen
- Emails de confirmación de cambios

### Recomendaciones Adicionales
- [ ] Rate limiting en endpoints de password
- [ ] CAPTCHA en solicitud de reset (producción)
- [ ] Límite de intentos fallidos
- [ ] Log de cambios de contraseña
- [ ] Invalidar sesiones al cambiar contraseña
- [ ] 2FA opcional (futuro)

---

## 📧 Templates de Email

### Email de Bienvenida
- Gradiente morado de la marca
- Lista de funcionalidades
- Responsive design
- Versión texto plano

### Email de Recuperación
- Código destacado en caja con bordes
- Advertencias de expiración
- Instrucciones claras
- Aviso de seguridad

### Email de Confirmación
- Mensaje de éxito
- Alerta si no fue el usuario
- Información de contacto
- Diseño consistente

---

## 🧪 Testing

### Probar Endpoints (Backend)

```bash
# Solicitar recuperación
curl -X POST http://localhost:8000/api/v1/password/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Restablecer con token
curl -X POST http://localhost:8000/api/v1/password/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "token":"123456",
    "new_password":"NewPass123"
  }'

# Cambiar contraseña (autenticado)
curl -X POST http://localhost:8000/api/v1/password/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "current_password":"OldPass123",
    "new_password":"NewPass123"
  }'
```

### Probar en Mobile

1. Iniciar backend: `uvicorn app.main:app --reload`
2. Iniciar mobile: `npm start`
3. Registrar usuario y verificar email
4. Ir a Perfil → Cambiar Contraseña
5. Verificar validaciones
6. Cambiar contraseña exitosamente
7. Verificar email de confirmación

---

## 📝 Próximos Pasos

### Completar Sistema de Recuperación en Mobile
- [ ] Pantalla "Olvidé mi contraseña" en Login
- [ ] Input de email
- [ ] Pantalla de ingreso de código
- [ ] Pantalla de nueva contraseña
- [ ] Navegación completa del flujo

### Mejoras Opcionales
- [ ] Templates de email personalizables
- [ ] Soporte para más proveedores SMTP
- [ ] Historial de cambios de contraseña
- [ ] Notificaciones push de seguridad
- [ ] Políticas de expiración de contraseñas

---

## ✅ Estado Final

**Sistema de Email:** ✅ Completamente funcional
**Cambio de Contraseña (Perfil):** ✅ Completamente funcional
**Recuperación Backend:** ✅ Completamente funcional
**Recuperación Mobile:** ⚠️ Pendiente UI (backend listo)

**Tiempo estimado para completar recuperación en mobile:** 2-3 horas

---

**Documentado por:** Claude Code
**Fecha:** 26 de Octubre, 2025
**Versión:** 1.0.0
