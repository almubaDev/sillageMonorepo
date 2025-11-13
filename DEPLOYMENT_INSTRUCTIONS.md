# Guía de Despliegue - Sillage MVP

Esta guía te llevará paso a paso para desplegar Sillage en producción usando Render (backend) y Vercel (web).

---

## 📋 PREREQUISITOS

### Cuentas necesarias:
- [x] Cuenta de GitHub (ya la tienes)
- [ ] Cuenta de Render.com (gratis)
- [ ] Cuenta de Vercel (gratis)
- [ ] Cuenta de Expo (para EAS Build)
- [ ] Apple Developer ($99/año) - solo para iOS
- [ ] Google Play Developer ($25 one-time) - solo para Android

### APIs y Servicios:
- [ ] API Key de Gemini (Google AI)
- [ ] API Key de OpenWeather
- [ ] Cuenta PayPal Business
- [ ] Gmail con contraseña de aplicación
- [ ] Dominio propio (opcional pero recomendado)

---

## 🚀 PARTE 1: DESPLIEGUE DEL BACKEND (RENDER)

### Paso 1: Preparar el repositorio

1. **Asegúrate de que todos los cambios estén commiteados:**
   ```bash
   cd newSillage
   git status
   git add .
   git commit -m "Preparar para deploy en Render"
   git push origin main
   ```

2. **Verificar archivos importantes:**
   - ✅ `render.yaml` (en la raíz del monorepo)
   - ✅ `sillage-backend/requirements.txt`
   - ✅ `sillage-backend/alembic.ini`
   - ✅ `sillage-backend/.env.example`

### Paso 2: Crear cuenta en Render

1. Ve a [render.com](https://render.com)
2. Click en "Get Started"
3. Conecta con GitHub
4. Autoriza acceso a tu repositorio `newSillage`

### Paso 3: Desplegar usando Blueprint (render.yaml)

1. En el dashboard de Render, click **"New" → "Blueprint"**
2. Selecciona el repositorio `newSillage`
3. Render detectará automáticamente `render.yaml`
4. Click en **"Apply"**

Render creará automáticamente:
- ✅ Web Service (sillage-backend)
- ✅ PostgreSQL Database (sillage-db)
- ✅ Redis Instance (sillage-redis)

### Paso 4: Configurar variables de entorno

1. En el dashboard, selecciona el servicio **"sillage-backend"**
2. Ve a **"Environment"** en el menú lateral
3. Agrega las siguientes variables manualmente:

```bash
# Seguridad
SECRET_KEY=<genera-una-clave-aleatoria-32-caracteres>

# APIs
GEMINI_API_KEY=<tu-api-key-de-gemini>
OPENWEATHER_API_KEY=<tu-api-key-openweather>

# PayPal
PAYPAL_BUSINESS_EMAIL=<tu-email-paypal>

# Email
EMAIL_HOST_USER=<tu-gmail>
EMAIL_HOST_PASSWORD=<contraseña-app-gmail>

# CORS (actualizar con tus dominios reales)
ALLOWED_ORIGINS=https://app.tudominio.com,https://sillage-backend.onrender.com

# Frontend (actualizar después de deploy web)
FRONTEND_URL=https://app.tudominio.com
```

**Para generar SECRET_KEY:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

4. Click en **"Save Changes"**

### Paso 5: Trigger manual deploy

1. En el servicio, click **"Manual Deploy" → "Deploy latest commit"**
2. Espera a que termine el build (5-10 minutos la primera vez)
3. Verifica logs para errores

### Paso 6: Ejecutar migraciones

**Opción A: Desde Render Shell (Recomendado)**

1. En el servicio, ve a **"Shell"** (menú lateral)
2. Ejecuta:
   ```bash
   alembic current
   alembic upgrade head
   ```

**Opción B: Desde tu terminal local con Render CLI**

1. Instalar Render CLI:
   ```bash
   npm install -g @render/cli
   ```

2. Login:
   ```bash
   render login
   ```

3. Ejecutar migraciones:
   ```bash
   render run sillage-backend alembic upgrade head
   ```

### Paso 7: Seed inicial de datos

1. Desde Render Shell o CLI, ejecuta:
   ```bash
   # Crear superadmin (si tienes script)
   python scripts/create_superuser.py

   # Cargar perfumes (si tienes script)
   python scripts/seed_perfumes.py
   ```

### Paso 8: Verificar deployment

1. Obtén la URL de tu servicio (ej: `https://sillage-backend.onrender.com`)
2. Prueba el health endpoint:
   ```bash
   curl https://sillage-backend.onrender.com/health
   ```
3. Prueba la API:
   ```bash
   curl https://sillage-backend.onrender.com/api/v1/perfumes/paquetes
   ```

### Paso 9: Configurar dominio custom (OPCIONAL)

1. En Render, ve a **"Settings" → "Custom Domain"**
2. Agrega tu dominio (ej: `api.tudominio.com`)
3. En tu proveedor de DNS (Cloudflare, Namecheap, etc.):
   - Tipo: `CNAME`
   - Name: `api`
   - Value: `sillage-backend.onrender.com`
   - TTL: Automático
4. Espera propagación DNS (5-30 minutos)
5. Render proveerá SSL automáticamente (Let's Encrypt)

---

## 🌐 PARTE 2: DESPLIEGUE DEL FRONTEND WEB (VERCEL)

### Paso 1: Preparar el proyecto

1. **Crear archivo de configuración de Vercel:**
   ```bash
   cd sillage-mobile
   ```

2. **Crear `.env.production`:**
   ```bash
   cp .env.production.example .env.production
   ```

3. **Editar `.env.production`:**
   ```bash
   EXPO_PUBLIC_API_URL=https://api.tudominio.com/api/v1
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<tu-key>
   EXPO_PUBLIC_ENVIRONMENT=production
   ```

### Paso 2: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Paso 3: Deploy

```bash
cd sillage-mobile
vercel
```

Responde las preguntas:
- Set up and deploy? → **Y**
- Which scope? → Tu cuenta
- Link to existing project? → **N**
- Project name? → **sillage-web** (o el que prefieras)
- In which directory is your code located? → **./** (current)
- Override settings? → **N**

### Paso 4: Configurar build para Expo Web

1. Ve al dashboard de Vercel → tu proyecto
2. **Settings → Build & Development Settings:**
   - Framework Preset: **Other**
   - Build Command: `npx expo export:web`
   - Output Directory: `web-build`
   - Install Command: `npm install`

3. **Settings → Environment Variables:**
   Agrega las variables de `.env.production`:
   ```
   EXPO_PUBLIC_API_URL=https://api.tudominio.com/api/v1
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
   EXPO_PUBLIC_ENVIRONMENT=production
   ```

### Paso 5: Re-deploy

```bash
vercel --prod
```

### Paso 6: Configurar dominio custom (OPCIONAL)

1. En Vercel dashboard → **Settings → Domains**
2. Agrega tu dominio (ej: `app.tudominio.com` o `www.tudominio.com`)
3. Vercel te indicará qué registros DNS crear
4. En tu proveedor DNS:
   - Tipo: `CNAME`
   - Name: `app` (o `www`)
   - Value: `cname.vercel-dns.com`
5. SSL automático por Vercel

---

## 📱 PARTE 3: BUILD MOBILE APP (EXPO EAS)

### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Paso 2: Login a Expo

```bash
eas login
```

### Paso 3: Configurar proyecto

1. **Verificar `app.json`:**
   ```json
   {
     "expo": {
       "name": "Sillage",
       "slug": "sillage",
       "version": "1.0.0",
       "ios": {
         "bundleIdentifier": "com.sillage.app"
       },
       "android": {
         "package": "com.sillage.app"
       }
     }
   }
   ```

2. **Verificar `eas.json`** (ya debería estar configurado)

### Paso 4: Build para Android (Testing)

```bash
cd sillage-mobile
eas build --platform android --profile preview
```

Esto:
1. Sube tu código a Expo
2. Construye el APK en la nube
3. Te da un link para descargar

**Descargar y probar:**
- Descarga el APK a tu teléfono Android
- Instala y prueba

### Paso 5: Build para iOS (Testing)

**REQUIERE:** Apple Developer Account ($99/año)

```bash
eas build --platform ios --profile preview
```

Esto crea un build para TestFlight.

### Paso 6: Build de Producción

Una vez que hayas probado y todo funciona:

```bash
eas build --platform all --profile production
```

### Paso 7: Enviar a las tiendas

**Google Play:**
```bash
eas submit --platform android
```

Necesitas:
- Google Play Developer Account ($25 one-time)
- Store listing completo (descripción, screenshots, etc.)

**Apple App Store:**
```bash
eas submit --platform ios
```

Necesitas:
- Apple Developer Account ($99/año)
- App Store Connect configurado

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### Backend (API)

- [ ] Health endpoint responde: `https://api.tudominio.com/health`
- [ ] Autenticación funciona: Login/Register
- [ ] Base de datos conectada correctamente
- [ ] Redis funciona (verificar logs)
- [ ] Migraciones aplicadas: `alembic current`
- [ ] Perfumes cargados: GET `/api/v1/perfumes`
- [ ] CORS configurado: Headers en respuestas
- [ ] Email funciona: Probar registro de usuario

### Web

- [ ] Sitio carga: `https://app.tudominio.com`
- [ ] Login funciona
- [ ] API calls exitosos (verificar Network tab)
- [ ] Navegación entre pantallas
- [ ] Responsive design OK

### Mobile

- [ ] APK instala en Android
- [ ] App abre sin crashes
- [ ] Login funciona
- [ ] Location permissions OK
- [ ] Recomendaciones funcionan
- [ ] API calls exitosos

### End-to-End

- [ ] Usuario se registra (mobile/web)
- [ ] Recibe email de bienvenida
- [ ] Puede hacer login
- [ ] Ve colección de perfumes
- [ ] Completa wizard de recomendación
- [ ] Recibe recomendación
- [ ] Ve historial
- [ ] Password reset funciona

---

## 🐛 TROUBLESHOOTING

### Backend no inicia

**Error: ModuleNotFoundError**
- Verificar `requirements.txt` está completo
- Re-deploy desde Render dashboard

**Error: Database connection failed**
- Verificar `DATABASE_URL` en variables de entorno
- Render lo asigna automáticamente, no debe estar hardcodeado

**Error: Redis connection failed**
- Verificar `REDIS_URL` en variables de entorno
- Verificar servicio Redis está running

### Migraciones fallan

**Error: relation does not exist**
```bash
# Reset y re-aplicar
alembic downgrade base
alembic upgrade head
```

### CORS errors en frontend

- Verificar `ALLOWED_ORIGINS` incluye tu dominio web
- Formato: `https://app.tudominio.com,https://tudominio.com` (sin espacios)
- Re-deploy backend después de cambiar

### Build de EAS falla

**Error: Bundle identifier mismatch**
- Verificar `app.json` tiene `ios.bundleIdentifier` y `android.package`
- Deben ser únicos (ej: `com.sillage.app`)

**Error: Not enough build minutes**
- Usar tier gratuito tiene cola, esperar
- O upgrade a EAS Production ($29/mo)

---

## 💰 COSTOS ESTIMADOS

### Mes 1-2 (MVP Testing)
- Render Free Tier: **$0** (con limitaciones)
  - Spins down después de 15 min inactividad
  - 750 horas/mes
- Vercel Free: **$0**
- Expo EAS Free: **$0**
- **TOTAL: $0/mes**

### Mes 3+ (Producción)
- Render Starter (Backend): **$7/mes**
- Render PostgreSQL: **$7/mes**
- Render Redis: **$10/mes**
- Vercel Free: **$0**
- Expo EAS Free: **$0**
- Dominio: **$1-2/mes**
- **TOTAL: $25-26/mes**

### Una vez (App Stores)
- Google Play: **$25** (una sola vez)
- Apple Developer: **$99/año**

---

## 📞 RECURSOS Y SOPORTE

### Documentación oficial:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Expo EAS: https://docs.expo.dev/eas/

### Comunidades:
- Render Discord: https://render.com/discord
- Expo Discord: https://chat.expo.dev/

### Monitoreo:
- Render Logs: Dashboard → Logs
- Sentry (errores): https://sentry.io (free tier: 5K errors/mo)
- Uptime Robot: https://uptimerobot.com (free: 50 monitors)

---

## 🎯 PRÓXIMOS PASOS

1. **Deploy backend a Render** (hoy, 30 min)
2. **Deploy web a Vercel** (hoy, 15 min)
3. **Probar end-to-end** (mañana, 2 horas)
4. **Build mobile preview** (mañana, 1 hora)
5. **Testing con usuarios beta** (semana 1-2)
6. **Submit a app stores** (semana 3-4)
7. **Launch público!** 🚀

---

**¡Éxito con el deploy!** 🎉
