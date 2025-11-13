# Sillage - Despliegue Rápido

## 📦 Estructura del Proyecto (Monorepo)

```
newSillage/
├── sillage-backend/        # FastAPI + PostgreSQL + Redis
├── sillage-mobile/         # React Native Expo (iOS/Android/Web)
├── render.yaml             # Configuración Blueprint para Render
└── DEPLOYMENT_INSTRUCTIONS.md  # Guía detallada paso a paso
```

---

## 🚀 Despliegue Rápido (30 minutos)

### 1. Backend en Render (15 min)

1. **Ir a [render.com](https://render.com) → Sign up con GitHub**

2. **New → Blueprint**
   - Seleccionar repo `newSillage`
   - Render detecta `render.yaml` automáticamente
   - Click "Apply"

3. **Configurar variables de entorno** (en el dashboard):
   ```bash
   SECRET_KEY=<genera-32-chars-aleatorios>
   GEMINI_API_KEY=<tu-key>
   OPENWEATHER_API_KEY=<tu-key>
   PAYPAL_BUSINESS_EMAIL=<tu-email>
   EMAIL_HOST_USER=<tu-gmail>
   EMAIL_HOST_PASSWORD=<contraseña-app-gmail>
   ALLOWED_ORIGINS=https://tudominio.com
   FRONTEND_URL=https://app.tudominio.com
   ```

4. **Deploy automático** (esperar 5-10 min)

5. **Ejecutar migraciones** (Render Shell):
   ```bash
   alembic upgrade head
   ```

✅ **Backend listo en**: `https://sillage-backend.onrender.com`

---

### 2. Web en Vercel (10 min)

1. **Instalar Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   cd sillage-mobile
   vercel
   ```

3. **Configurar en Vercel Dashboard**:
   - Build Command: `npx expo export:web`
   - Output Directory: `web-build`
   - Environment Variables:
     ```
     EXPO_PUBLIC_API_URL=https://sillage-backend.onrender.com/api/v1
     EXPO_PUBLIC_ENVIRONMENT=production
     ```

4. **Re-deploy**:
   ```bash
   vercel --prod
   ```

✅ **Web listo en**: `https://tu-proyecto.vercel.app`

---

### 3. Mobile App con EAS (15 min)

1. **Instalar EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login**:
   ```bash
   eas login
   ```

3. **Build Android (APK para testing)**:
   ```bash
   cd sillage-mobile
   eas build --platform android --profile preview
   ```

4. **Descargar APK** del link que te da Expo y probar en tu teléfono

✅ **APK listo** para testing

---

## 💰 Costos

### MVP Testing (Gratis)
- Render Free Tier: **$0** (con limitaciones de sleep)
- Vercel Free: **$0**
- Expo EAS Free: **$0**
- **TOTAL: $0/mes**

### Producción (Recomendado)
- Render Starter (Backend): **$7/mes**
- Render PostgreSQL: **$7/mes**
- Render Redis: **$10/mes**
- Vercel: **$0/mes**
- Expo EAS: **$0/mes** (o $29/mes para builds prioritarios)
- **TOTAL: $24-53/mes**

---

## 📚 Documentación Completa

Ver [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) para:
- Guía detallada paso a paso
- Troubleshooting
- Configuración de dominios custom
- Submit a App Stores
- Verificación post-deployment
- Y mucho más

---

## 🆘 Soporte

**Si algo sale mal:**
1. Revisa logs en Render Dashboard → Logs
2. Consulta [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) sección Troubleshooting
3. Verifica variables de entorno están correctas
4. Asegúrate que migraciones están aplicadas: `alembic current`

**Recursos:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Expo EAS Docs: https://docs.expo.dev/eas/

---

## ✅ Checklist Post-Deploy

- [ ] Backend responde: `curl https://tu-backend.onrender.com/health`
- [ ] Web carga correctamente
- [ ] Login funciona (web)
- [ ] APK instala en Android
- [ ] Login funciona (mobile)
- [ ] API calls exitosos desde mobile/web
- [ ] Email de bienvenida se envía al registrarse
- [ ] Recomendaciones funcionan end-to-end

---

**¡Listo para lanzar!** 🚀
