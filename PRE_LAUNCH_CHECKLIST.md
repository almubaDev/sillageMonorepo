# ✅ Checklist Pre-Lanzamiento - Sillage

## ✅ YA COMPLETADO

### Configuración Base
- ✅ `.env.example` creados para Backend, Mobile y Admin
- ✅ CORS configurable por variable de entorno
- ✅ EAS configurado (`eas.json`)
- ✅ `app.json` con bundleIdentifier y package
- ✅ Permisos de ubicación configurados
- ✅ Script de seed con 10 perfumes populares
- ✅ Términos y Condiciones creados
- ✅ Política de Privacidad creada
- ✅ FAQ creado
- ✅ Guía de deployment creada

### Seguridad Base
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens JWT con expiración apropiada
- ✅ Variables de entorno NO commitadas en Git
- ✅ Archivos sensibles en `.gitignore`

---

## 🚀 LO QUE FALTA HACER

### 1️⃣ Ejecutar Setup Inicial (10 minutos)

```bash
cd sillage-backend

# Crear tu .env desde el ejemplo
cp .env.example .env
# Editar .env con tus credenciales reales

# Ejecutar migraciones
alembic upgrade head

# Crear superusuario
python scripts/create_superuser.py

# Cargar perfumes de ejemplo
python scripts/seed_perfumes.py
```

### 2️⃣ Testing Básico (30 minutos)

**Backend:**
- [ ] Backend corre sin errores (`uvicorn app.main:app --reload`)
- [ ] Puedes hacer login en el admin panel
- [ ] Los 10 perfumes seed aparecen en la DB

**Mobile:**
- [ ] La app corre (`npm start`)
- [ ] Puedes registrar un usuario
- [ ] Puedes hacer login
- [ ] Puedes ver/agregar perfumes a tu colección
- [ ] El wizard de recomendación funciona
- [ ] Cambio de idioma funciona

### 3️⃣ Deployment (cuando estés listo)

- [ ] Deploy backend a Railway/Render/DigitalOcean
- [ ] Configurar dominio y SSL
- [ ] Build preview con EAS: `eas build --platform android --profile preview`
- [ ] Probar APK en dispositivo real

---

## 📋 Opcional para MVP

Estas cosas pueden esperar para después del lanzamiento inicial:

- Webhooks de Flow (si no usas pagos aún)
- Email system completo
- Analytics/Sentry
- Backup automático
- Beta testing formal
- Publicar en stores (puedes usar EAS preview builds primero)
