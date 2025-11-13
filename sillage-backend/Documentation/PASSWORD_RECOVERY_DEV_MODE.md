# Recuperación de Contraseña - Modo Desarrollo

## Estado Actual

El sistema de recuperación de contraseña está **completamente implementado** pero configurado en **MODO DESARROLLO** debido a problemas con las credenciales de Gmail.

## ¿Cómo funciona en Desarrollo?

### 1. Cuando un usuario solicita recuperar su contraseña:

- El backend genera un código de 6 dígitos
- **NO envía email** (para evitar errores de SMTP)
- **Imprime el código en la consola del backend**
- La app responde exitosamente al usuario

### 2. Cómo obtener el código de recuperación:

1. Usuario ingresa su email en la app
2. **Mira la consola donde corre el backend** (terminal con `uvicorn`)
3. Verás un mensaje como este:

```
================================================================================
🔑 CÓDIGO DE RECUPERACIÓN GENERADO
📧 Email: usuario@ejemplo.com
👤 Usuario: Juan
🔢 CÓDIGO: 123456
⏰ Expira: 2025-10-26 18:30:00
================================================================================
```

4. Usa ese código de 6 dígitos en la app para restablecer la contraseña

## Configuración Actual

En [`.env`](../../../.env):
```bash
ENVIRONMENT=local  # ← Esto activa el modo desarrollo
```

## ¿Cómo activar el envío de emails real?

### Opción 1: Generar App Password de Gmail (Recomendado)

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. App Passwords → Generar nueva contraseña
4. Selecciona "Correo" y "Otro dispositivo"
5. Copia la contraseña de 16 caracteres (sin espacios)
6. Actualiza en `.env`:

```bash
EMAIL_HOST_USER=info@consultorabadillo.com
EMAIL_HOST_PASSWORD=tu_nueva_app_password_aqui
```

### Opción 2: Usar otro servicio de email

Si Gmail sigue dando problemas, puedes usar:

#### SendGrid (Gratis hasta 100 emails/día)
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=tu_sendgrid_api_key
```

#### Mailgun (Gratis hasta 5,000 emails/mes)
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@tu-dominio.mailgun.org
EMAIL_HOST_PASSWORD=tu_mailgun_password
```

### Opción 3: Cambiar a modo producción

Una vez que tengas credenciales válidas:

1. Actualiza `.env`:
```bash
ENVIRONMENT=production  # ← Desactiva modo desarrollo
```

2. Reinicia el backend

3. Ahora los emails se enviarán realmente

## Flujo de Recuperación Completo

### Mobile App:

1. **LoginScreen** → Click en "¿Olvidaste tu contraseña?"
2. **ForgotPasswordScreen** → Ingresar email → "Enviar Código"
3. **ResetPasswordScreen** → Ingresar:
   - Código de 6 dígitos (obtenerlo de la consola del backend)
   - Nueva contraseña (mín 8 chars, 1 mayúscula, 1 número)
   - Confirmar contraseña
4. **Success** → Regresa al login con nueva contraseña

### Backend Endpoints:

- `POST /api/v1/password/request-reset` - Solicitar código
  ```json
  {
    "email": "usuario@ejemplo.com"
  }
  ```

- `POST /api/v1/password/reset-password` - Restablecer con código
  ```json
  {
    "email": "usuario@ejemplo.com",
    "token": "123456",
    "new_password": "NuevaPass123"
  }
  ```

- `POST /api/v1/password/change-password` - Cambiar contraseña (usuario autenticado)
  ```json
  {
    "current_password": "actual",
    "new_password": "nueva"
  }
  ```

## Testing

### Probar con curl:

```bash
# 1. Solicitar código de recuperación
curl -X POST "http://localhost:8000/api/v1/password/request-reset" \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@ejemplo.com"}'

# 2. Mira la consola del backend para obtener el código

# 3. Restablecer contraseña con el código
curl -X POST "http://localhost:8000/api/v1/password/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@ejemplo.com", "token": "123456", "new_password": "NuevaPass123"}'

# 4. Login con nueva contraseña
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=usuario@ejemplo.com&password=NuevaPass123"
```

## Seguridad

✅ **Implementado:**
- Códigos de 6 dígitos aleatorios
- Expiración de 1 hora
- Un solo uso por código
- Tokens anteriores se invalidan al generar uno nuevo
- Hash seguro de contraseñas con bcrypt
- No revela si el email existe o no

⚠️ **Importante:**
- En producción, cambiar `ENVIRONMENT=production`
- Nunca compartir el app password de Gmail
- Los códigos se imprimen en consola SOLO en desarrollo

## Troubleshooting

### "Error 500 al solicitar recuperación"
- ✅ SOLUCIONADO: Modo desarrollo ignora errores de email
- Verifica que `ENVIRONMENT=local` en `.env`

### "No veo el código en consola"
- Verifica que estés mirando la terminal correcta (donde corre uvicorn)
- El mensaje empieza con `🔑 CÓDIGO DE RECUPERACIÓN GENERADO`

### "Código inválido o expirado"
- Los códigos expiran en 1 hora
- Solo pueden usarse una vez
- Solicita un nuevo código

### "Quiero que envíe emails reales"
- Genera un App Password de Gmail válido
- O cambia a otro servicio de email (SendGrid, Mailgun)
- Actualiza `.env` con las nuevas credenciales
- Cambia `ENVIRONMENT=production`
