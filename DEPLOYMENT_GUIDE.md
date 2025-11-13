# 🚀 Guía de Despliegue - Sillage

Esta guía te ayudará a preparar y desplegar Sillage para usuarios reales.

## 📋 Pre-requisitos

### Cuentas Necesarias
- [ ] Cuenta Expo (para builds móviles): https://expo.dev
- [ ] Servidor para backend (AWS/DigitalOcean/Railway/Render)
- [ ] Cuenta PostgreSQL (puede estar en el mismo servidor o usar servicio externo)
- [ ] Cuenta Redis (Redis Cloud o servidor local)
- [ ] Dominio (opcional pero recomendado)

### API Keys Necesarias
- [ ] Google Gemini API Key
- [ ] OpenWeather API Key
- [ ] Google Maps API Key
- [ ] Flow API Keys (pagos)

## 🔧 Configuración Inicial

### 1. Backend

#### 1.1 Copiar archivo de configuración
```bash
cd sillage-backend
cp .env.example .env
```

#### 1.2 Editar `.env` con tus credenciales
```bash
# IMPORTANTE: Cambiar estos valores
ENVIRONMENT=production
DATABASE_URL=postgresql://user:password@host/database
REDIS_URL=redis://host:6379
SECRET_KEY=genera_una_clave_segura_de_minimo_32_caracteres
ALLOWED_ORIGINS=https://tudominio.com,https://admin.tudominio.com

# API Keys
OPENWEATHER_API_KEY=tu_api_key
GEMINI_API_KEY=tu_api_key
GOOGLE_MAPS_API_KEY=tu_api_key
FLOW_API_KEY=tu_api_key
FLOW_SECRET_KEY=tu_secret_key
FLOW_SANDBOX=False
```

#### 1.3 Instalar dependencias
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 1.4 Ejecutar migraciones
```bash
alembic upgrade head
```

#### 1.5 Crear superusuario
```bash
python scripts/create_superuser.py
```

#### 1.6 Poblar base de datos con perfumes
```bash
python scripts/seed_perfumes.py
```

#### 1.7 Iniciar servidor (prueba local)
```bash
uvicorn app.main:app --reload
```

### 2. Mobile App

#### 2.1 Instalar Expo CLI y EAS
```bash
npm install -g expo-cli eas-cli
```

#### 2.2 Login en Expo
```bash
eas login
```

#### 2.3 Configurar proyecto EAS
```bash
cd sillage-mobile
eas init
```

Esto generará un `projectId` que debes agregar a `app.json`.

#### 2.4 Copiar configuración
```bash
cp .env.example .env
```

#### 2.5 Editar `.env`
```bash
EXPO_PUBLIC_API_URL=https://api.tudominio.com/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key
EXPO_PUBLIC_ENVIRONMENT=production
```

#### 2.6 Actualizar `app.json`
- Cambiar `owner` a tu username de Expo
- Actualizar `projectId` con el generado por `eas init`
- Cambiar `bundleIdentifier` (iOS) si es necesario
- Cambiar `package` (Android) si es necesario

#### 2.7 Build para desarrollo (opcional)
```bash
eas build --profile preview --platform android
```

#### 2.8 Build para producción
```bash
# Para Android
eas build --profile production --platform android

# Para iOS (requiere cuenta Apple Developer)
eas build --profile production --platform ios
```

### 3. Panel Admin

#### 3.1 Copiar configuración
```bash
cd sillage-admin
cp .env.example .env.local
```

#### 3.2 Editar `.env.local`
```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api/v1
NEXT_PUBLIC_ENVIRONMENT=production
```

#### 3.3 Instalar y build
```bash
npm install
npm run build
```

#### 3.4 Iniciar en producción
```bash
npm start
```

## 🌐 Despliegue en Servidor

### Opción 1: Railway (Recomendado para comenzar)

#### Backend
1. Crear cuenta en Railway.app
2. New Project → Deploy from GitHub
3. Seleccionar repo `sillage-backend`
4. Agregar PostgreSQL y Redis desde Railway
5. Configurar variables de entorno desde el dashboard
6. Deploy automático

#### Admin Panel
1. New Service → Deploy from GitHub
2. Seleccionar repo `sillage-admin`
3. Configurar variables de entorno
4. Deploy

### Opción 2: DigitalOcean / AWS

#### Backend
```bash
# En tu servidor
git clone tu-repo
cd sillage-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
nano .env  # Editar con tus valores

# Migraciones
alembic upgrade head

# Crear superuser y seed
python scripts/create_superuser.py
python scripts/seed_perfumes.py

# Usar gunicorn para producción
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### Nginx como reverse proxy
```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### SSL con Certbot
```bash
sudo certbot --nginx -d api.tudominio.com
```

## 📱 Publicación en Stores

### App Store (iOS)
1. Cuenta Apple Developer ($99/año)
2. Crear App ID en Apple Developer Portal
3. Configurar bundle identifier en app.json
4. Build con EAS: `eas build --platform ios`
5. Submit con EAS: `eas submit --platform ios`

### Google Play (Android)
1. Cuenta Google Play Developer ($25 one-time)
2. Crear nueva app en Play Console
3. Configurar package name en app.json
4. Build con EAS: `eas build --platform android`
5. Submit con EAS: `eas submit --platform android`

## ✅ Checklist Pre-Lanzamiento

### Backend
- [ ] Migraciones ejecutadas
- [ ] Superusuario creado
- [ ] Perfumes seed cargados
- [ ] CORS configurado correctamente
- [ ] SECRET_KEY cambiada
- [ ] SSL/HTTPS configurado
- [ ] Backups de DB configurados

### Mobile
- [ ] API URL apunta a producción
- [ ] Builds generados exitosamente
- [ ] Testeo en dispositivos reales
- [ ] Términos y Privacidad agregados
- [ ] Permisos de ubicación funcionando

### Admin Panel
- [ ] Deploy exitoso
- [ ] Puede acceder con superuser
- [ ] Puede crear perfumes
- [ ] Puede regalar consultas

### General
- [ ] Sistema de pagos testeado
- [ ] Emails de bienvenida funcionando
- [ ] Error tracking configurado (Sentry)
- [ ] Analytics configurado (opcional)
- [ ] Beta testing con 5-10 usuarios

## 🆘 Solución de Problemas

### Error: "Module not found"
```bash
# Backend
pip install -r requirements.txt

# Mobile/Admin
npm install
```

### Error: "Database connection failed"
- Verificar DATABASE_URL en .env
- Confirmar que PostgreSQL está corriendo
- Verificar credenciales

### Error: "CORS policy"
- Verificar ALLOWED_ORIGINS en backend/.env
- Asegurar que incluye el dominio del frontend

### Build de Expo falla
```bash
# Limpiar cache
rm -rf node_modules
npm install

# Re-login
eas login

# Verificar eas.json y app.json
```

## 📧 Soporte

Para problemas adicionales, consulta:
- Documentación de Backend: `sillage-backend/Documentation/`
- Documentación de Mobile: `sillage-mobile/Documentation/`
- Documentación de Admin: `sillage-admin/Documentation/`
