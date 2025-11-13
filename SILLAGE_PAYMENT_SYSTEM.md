# 💳 SISTEMA DE PAGOS SILLAGE - PAYPAL

## ✅ COMPLETADO - BACKEND

Se ha implementado exitosamente el sistema de pagos con PayPal para compra de paquetes de consultas.

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelos de Base de Datos](#modelos-de-base-de-datos)
4. [Endpoints API](#endpoints-api)
5. [Flujo de Pago Completo](#flujo-de-pago-completo)
6. [Configuración](#configuración)
7. [Próximos Pasos - Mobile](#próximos-pasos---mobile)
8. [Testing](#testing)

---

## 🎯 RESUMEN EJECUTIVO

### ¿Qué se implementó?

✅ **Sistema de créditos/consultas** (no suscripciones)
✅ **Método de pago: PayPal** (botones HTML)
✅ **Modo PRODUCCIÓN** (no sandbox)
✅ **Backend FastAPI** completamente funcional
✅ **Base de datos** migrada con Alembic
✅ **Datos iniciales** cargados (3 paquetes)

### Concepto Central

El sistema usa **botones HTML de PayPal** con un **identificador único (`custom_id`)** que conecta todo el flujo:

```
Usuario selecciona paquete
→ Backend genera SILL-XXXXXXXXXXXX
→ Crea registro en estado "pendiente"
→ Frontend envía formulario HTML a PayPal
→ Usuario paga en PayPal
→ PayPal redirige con el custom_id
→ Frontend hace polling para verificar
→ Backend completa pago y asigna consultas automáticamente
→ Usuario tiene consultas disponibles
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Componentes Implementados

```
sillage-backend/
├── app/
│   ├── models/
│   │   └── payment.py ✅              # 5 modelos nuevos
│   │       ├── MetodoPago
│   │       ├── PaqueteConsultas
│   │       ├── BotonPago
│   │       ├── PagoConsultas
│   │       └── TransaccionConsultas
│   │
│   ├── schemas/
│   │   └── payment.py ✅              # Schemas Pydantic
│   │
│   ├── api/v1/endpoints/
│   │   └── payments.py ✅             # 3 endpoints principales
│   │       ├── GET /paquetes
│   │       ├── POST /generar-pago
│   │       └── GET /verificar-pago
│   │
│   ├── services/
│   │   └── payment_service.py ✅      # Lógica de negocio
│   │
│   └── core/
│       ├── config.py ✅               # +3 config vars PayPal
│       └── database.py                # (sin cambios)
│
├── scripts/
│   └── init_payment_data.py ✅        # Script de inicialización
│
├── alembic/versions/
│   └── e2987728f29e_*.py ✅           # Migración aplicada
│
└── .env ✅                            # +4 vars PayPal
```

---

## 📊 MODELOS DE BASE DE DATOS

### 1. MetodoPago
Define los métodos de pago disponibles (PayPal, Flow, etc.)

```python
class MetodoPago:
    id: int
    nombre: str                    # "PayPal"
    codigo: str                    # "paypal"
    descripcion: str
    icono: str                     # "fab fa-paypal"
    color_boton: str               # "#0070ba"
    paises_soportados: JSON        # ["GLOBAL"]
    activo: bool
    orden: int
```

**Datos iniciales:**
- ✅ PayPal (código: `paypal`, soporta: `GLOBAL`)

### 2. PaqueteConsultas
Paquetes de consultas que los usuarios pueden comprar

```python
class PaqueteConsultas:
    id: int
    nombre: str                    # "Paquete Popular"
    descripcion: str
    cantidad_consultas: int        # 15
    precio: Decimal                # 12.99
    precio_anterior: Decimal       # 17.99 (para descuentos)
    moneda: str                    # "USD"
    destacado: bool                # True
    activo: bool
```

**Datos iniciales:**
- ✅ **Paquete Básico**: 5 consultas por $4.99 USD
- ✅ **Paquete Popular**: 15 consultas por $12.99 USD (antes $17.99 - 28% OFF) ⭐ DESTACADO
- ✅ **Paquete Premium**: 30 consultas por $19.99 USD (antes $29.99 - 33% OFF)

### 3. BotonPago
Asocia un paquete con un método de pago

```python
class BotonPago:
    id: int
    paquete_id: int               # FK a PaqueteConsultas
    metodo_pago_id: int           # FK a MetodoPago
    activo: bool
```

**Datos iniciales:**
- ✅ 3 botones PayPal (uno por cada paquete)

### 4. PagoConsultas ⭐ (MODELO CENTRAL)
Registra cada transacción de pago

```python
class PagoConsultas:
    id: int
    user_id: int                   # FK a User
    paquete_consultas_id: int     # FK a PaqueteConsultas
    boton_pago_id: int            # FK a BotonPago
    monto: Decimal                # 12.99
    moneda: str                   # "USD"
    estado: str                   # "pendiente" | "completado" | "fallido" | "reembolsado"
    metodo_pago: str              # "paypal"
    referencia_externa: str       # ID de PayPal (si lo envía)
    custom_id: str                # "SILL-A1B2C3D4E5F6" ← CRÍTICO
    datos_pago: JSON              # Metadata adicional
    created_at: datetime
    updated_at: datetime
```

**Estados:**
- `pendiente`: Pago creado, esperando confirmación de PayPal
- `completado`: Pago confirmado, consultas asignadas
- `fallido`: Pago rechazado o error
- `reembolsado`: Pago devuelto

### 5. TransaccionConsultas
Auditoría de todos los movimientos de consultas

```python
class TransaccionConsultas:
    id: int
    user_id: int
    paquete_consultas_id: int     # Opcional
    tipo: str                     # "compra" | "uso" | "regalo" | "reembolso"
    cantidad: int                 # +15 para compra, -1 para uso
    descripcion: str              # "Compra de Paquete Popular vía paypal - Ref: SILL-XXX"
    created_at: datetime
```

---

## 🌐 ENDPOINTS API

### Base URL
```
http://localhost:8000/api/v1/payments
```

### 1. GET `/paquetes`
Obtener todos los paquetes disponibles con sus botones de pago

**Query Parameters:**
- `pais_usuario` (opcional): Código del país (ej: "US", "CL", "MX"). Default: "US"

**Response:**
```json
{
  "paquetes": [
    {
      "id": 1,
      "nombre": "Paquete Básico",
      "descripcion": "Ideal para probar el servicio",
      "cantidad_consultas": 5,
      "precio": 4.99,
      "precio_anterior": null,
      "moneda": "USD",
      "destacado": false,
      "precio_por_consulta": 1.00,
      "tiene_descuento": false,
      "porcentaje_descuento": 0,
      "botones_pago": [
        {
          "id": 1,
          "metodo_pago": {
            "id": 1,
            "nombre": "PayPal",
            "codigo": "paypal",
            "icono": "fab fa-paypal",
            "color_boton": "#0070ba"
          }
        }
      ]
    },
    // ... más paquetes
  ],
  "metodos_pago": [
    {
      "id": 1,
      "nombre": "PayPal",
      "codigo": "paypal",
      "descripcion": "Paga con tarjeta de crédito/débito o cuenta PayPal",
      "icono": "fab fa-paypal",
      "color_boton": "#0070ba"
    }
  ]
}
```

### 2. POST `/generar-pago` ⭐ (Requiere autenticación)
Genera formulario HTML para PayPal

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "paquete_id": 2,
  "boton_pago_id": 2,
  "pais_usuario": "US"
}
```

**Response:**
```json
{
  "success": true,
  "tipo": "formulario",
  "formulario": {
    "action": "https://www.paypal.com/cgi-bin/webscr",
    "method": "POST",
    "campos": {
      "cmd": "_xclick",
      "business": "info@consultorabadillo.com",
      "item_name": "Sillage - Paquete Popular",
      "item_number": "2",
      "amount": "12.99",
      "currency_code": "USD",
      "custom": "SILL-A1B2C3D4E5F6",  // ← ID ÚNICO
      "return": "http://localhost:19006/payment/success?ref=SILL-A1B2C3D4E5F6&source=paypal&status=completed",
      "cancel_return": "http://localhost:19006/payment/cancel?ref=SILL-A1B2C3D4E5F6",
      "rm": "2",
      "no_shipping": "1",
      "no_note": "1",
      "charset": "utf-8"
    }
  },
  "custom_id": "SILL-A1B2C3D4E5F6",
  "paquete_nombre": "Paquete Popular",
  "monto": "12.99",
  "mensaje": "Formulario generado exitosamente"
}
```

**¿Qué hace este endpoint?**
1. Genera un `custom_id` único (ej: `SILL-A1B2C3D4E5F6`)
2. Crea un registro `PagoConsultas` en estado `pendiente`
3. Retorna datos del formulario HTML para enviar a PayPal

### 3. GET `/verificar-pago` ⭐
Verifica el estado de un pago y lo completa si es necesario

**Query Parameters:**
- `ref` (requerido): custom_id del pago
- `source` (opcional): "paypal"
- `status` (opcional): "completed"

**Example:**
```
GET /verificar-pago?ref=SILL-A1B2C3D4E5F6&source=paypal&status=completed
```

**Response (pendiente):**
```json
{
  "success": true,
  "estado": "pendiente",
  "mensaje": "Verificando pago..."
}
```

**Response (completado):**
```json
{
  "success": true,
  "estado": "completado",
  "paquete_nombre": "Paquete Popular",
  "consultas_agregadas": 15,
  "consultas_totales": 23,          // Total del usuario ahora
  "monto": "12.99",
  "fecha_pago": "2025-10-27T18:52:41Z",
  "mensaje": "Pago procesado y consultas agregadas exitosamente"
}
```

**¿Qué hace este endpoint?**
1. Busca el pago por `custom_id`
2. Si está `pendiente` y viene de PayPal con status `completed`:
   - Cambia estado a `completado`
   - Agrega consultas al usuario (`user.consultas_restantes += cantidad`)
   - Crea registro de auditoría en `TransaccionConsultas`
3. Retorna información completa del pago

### 4. GET `/mis-consultas` (Requiere autenticación)
Obtener información de consultas del usuario actual

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "consultas_disponibles": 23,
  "historial_compras": [
    {
      "id": 1,
      "custom_id": "SILL-A1B2C3D4E5F6",
      "paquete_nombre": "Paquete Popular",
      "consultas": 15,
      "monto": 12.99,
      "moneda": "USD",
      "estado": "completado",
      "metodo_pago": "paypal",
      "fecha": "2025-10-27T18:52:41Z"
    }
  ],
  "historial_transacciones": [
    {
      "id": 1,
      "tipo": "compra",
      "cantidad": 15,
      "descripcion": "Compra de Paquete Popular vía paypal - Ref: SILL-A1B2C3D4E5F6",
      "fecha": "2025-10-27T18:52:41Z"
    },
    {
      "id": 2,
      "tipo": "uso",
      "cantidad": -1,
      "descripcion": "Consulta de recomendación de perfume",
      "fecha": "2025-10-27T19:15:20Z"
    }
  ]
}
```

---

## 🔄 FLUJO DE PAGO COMPLETO

### Diagrama de Flujo

```
[USUARIO]
   ↓
1. Ve paquetes disponibles
   GET /api/v1/payments/paquetes
   ↓
2. Selecciona paquete y hace clic en "Pagar con PayPal"
   ↓
3. [FRONTEND] Llama a generar-pago
   POST /api/v1/payments/generar-pago
   Body: { paquete_id: 2, boton_pago_id: 2, pais_usuario: "US" }
   ↓
4. [BACKEND] Genera custom_id y crea pago pendiente
   custom_id: "SILL-A1B2C3D4E5F6"
   Estado: pendiente
   ↓
5. [BACKEND] Retorna datos del formulario HTML
   {
     formulario: {
       action: "https://www.paypal.com/cgi-bin/webscr",
       campos: { ..., custom: "SILL-A1B2C3D4E5F6", ... }
     }
   }
   ↓
6. [FRONTEND] Crea formulario HTML dinámicamente
   <form action="https://www.paypal.com/cgi-bin/webscr" method="POST">
     <input name="cmd" value="_xclick">
     <input name="custom" value="SILL-A1B2C3D4E5F6">
     ...
   </form>
   ↓
7. [FRONTEND] Envía formulario → Redirige a PayPal
   Usuario sale de la app
   ↓
8. [USUARIO EN PAYPAL]
   - Ingresa credenciales PayPal
   - Autoriza pago
   - PayPal procesa
   ↓
9. [PAYPAL] Redirige de vuelta
   http://localhost:19006/payment/success?ref=SILL-A1B2C3D4E5F6&source=paypal&status=completed
   ↓
10. [FRONTEND] Página de éxito inicia polling
    Llama cada 2 segundos:
    GET /api/v1/payments/verificar-pago?ref=SILL-A1B2C3D4E5F6&source=paypal&status=completed
    ↓
11. [BACKEND] Verifica estado del pago
    - Encuentra pago por custom_id
    - Estado: pendiente
    - Viene de PayPal con status completed
    ↓
12. [BACKEND] Procesa pago completado
    - pago.estado = 'completado'
    - user.consultas_restantes += 15
    - Crea TransaccionConsultas (auditoría)
    - Commit en BD
    ↓
13. [BACKEND] Retorna éxito
    {
      success: true,
      estado: "completado",
      consultas_agregadas: 15,
      consultas_totales: 23
    }
    ↓
14. [FRONTEND] Muestra éxito
    "¡Pago exitoso! Se agregaron 15 consultas a tu cuenta"
    ↓
15. [USUARIO] Tiene consultas disponibles
    Puede usar la app para generar recomendaciones
```

---

## ⚙️ CONFIGURACIÓN

### 1. Variables de Entorno (.env)

```bash
# PayPal (PRODUCCIÓN - Botones de pago)
PAYPAL_BUSINESS_EMAIL=info@consultorabadillo.com
PAYPAL_MODE=production
PAYPAL_URL=https://www.paypal.com/cgi-bin/webscr

# Para sandbox (testing):
# PAYPAL_MODE=sandbox
# PAYPAL_URL=https://www.sandbox.paypal.com/cgi-bin/webscr
# PAYPAL_BUSINESS_EMAIL=tu-email-sandbox@business.example.com
```

### 2. Settings (app/core/config.py)

```python
# PayPal
PAYPAL_BUSINESS_EMAIL: str
PAYPAL_MODE: str = "production"  # "production" o "sandbox"
PAYPAL_URL: str = "https://www.paypal.com/cgi-bin/webscr"
```

### 3. Base de Datos

**Migración aplicada:**
```bash
alembic upgrade head
# Aplicada: e2987728f29e_add_payment_system_models
```

**Tablas creadas:**
- `metodos_pago`
- `paquetes_consultas`
- `botones_pago`
- `pagos_consultas`
- `transacciones_consultas`

### 4. Datos Iniciales

**Ejecutar script:**
```bash
cd sillage-backend
./venv/Scripts/python.exe scripts/init_payment_data.py
```

**O manualmente en Python:**
```python
from scripts.init_payment_data import init_payment_data
import asyncio
asyncio.run(init_payment_data())
```

---

## 📱 PRÓXIMOS PASOS - MOBILE

### Pantallas a Crear

#### 1. PurchaseScreen.tsx
Pantalla principal de compra de paquetes

**Features:**
- Mostrar 3 paquetes en cards
- Destacar el paquete "Popular"
- Mostrar precio, descuento, cantidad de consultas
- Botón "Pagar con PayPal" por cada paquete
- Loading state durante generación de formulario

**Llamadas API:**
```typescript
// 1. Obtener paquetes
const response = await fetch('http://localhost:8000/api/v1/payments/paquetes?pais_usuario=US');
const data = await response.json();

// 2. Generar formulario de pago
const paymentResponse = await fetch('http://localhost:8000/api/v1/payments/generar-pago', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paquete_id: 2,
    boton_pago_id: 2,
    pais_usuario: 'US'
  })
});
const paymentData = await paymentResponse.json();
```

**¿Cómo enviar formulario a PayPal?**

Opción A: WebView (React Native)
```tsx
import { WebView } from 'react-native-webview';

// Generar HTML del formulario
const formHTML = `
  <html>
    <body>
      <form id="paypalForm" action="${formulario.action}" method="${formulario.method}">
        ${Object.entries(formulario.campos).map(([name, value]) =>
          `<input type="hidden" name="${name}" value="${value}">`
        ).join('')}
      </form>
      <script>
        document.getElementById('paypalForm').submit();
      </script>
    </body>
  </html>
`;

return (
  <WebView
    source={{ html: formHTML }}
    onNavigationStateChange={(navState) => {
      // Detectar cuando regresa de PayPal
      if (navState.url.includes('/payment/success')) {
        // Extraer custom_id de la URL
        // Navegar a PaymentSuccessScreen
      }
    }}
  />
);
```

Opción B: Linking (abrir navegador externo)
```tsx
import { Linking } from 'react-native';

// Construir URL con query params
const paypalURL = new URL(formulario.action);
Object.entries(formulario.campos).forEach(([key, value]) => {
  paypalURL.searchParams.append(key, value);
});

// Abrir en navegador
await Linking.openURL(paypalURL.toString());
```

#### 2. PaymentSuccessScreen.tsx
Pantalla de confirmación de pago con polling

**Features:**
- Mostrar "Procesando pago..."
- Polling cada 2 segundos para verificar estado
- Mostrar éxito cuando se complete
- Mostrar cantidad de consultas agregadas
- Botón para volver a la app

**Polling:**
```tsx
import { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native';

function PaymentSuccessScreen() {
  const route = useRoute();
  const customId = route.params?.ref;
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [consultasAgregadas, setConsultasAgregadas] = useState(0);

  useEffect(() => {
    const verificarPago = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/v1/payments/verificar-pago?ref=${customId}&source=paypal&status=completed`
        );
        const data = await response.json();

        if (data.estado === 'completado') {
          setPaymentStatus('completed');
          setConsultasAgregadas(data.consultas_agregadas);
          // Detener polling
        } else if (data.estado === 'pendiente') {
          // Continuar polling
          setTimeout(verificarPago, 2000);
        }
      } catch (error) {
        console.error('Error verificando pago:', error);
        setTimeout(verificarPago, 2000); // Reintentar
      }
    };

    if (customId) {
      verificarPago();
    }
  }, [customId]);

  if (paymentStatus === 'pending') {
    return <LoadingView text="Verificando pago..." />;
  }

  return (
    <SuccessView
      consultas={consultasAgregadas}
      onContinue={() => navigation.navigate('Home')}
    />
  );
}
```

#### 3. Actualizar servicio de API mobile

```typescript
// src/services/paymentService.ts

class PaymentService {
  private baseURL = 'http://localhost:8000/api/v1/payments';

  async getPaquetes(paisUsuario: string = 'US') {
    const response = await fetch(`${this.baseURL}/paquetes?pais_usuario=${paisUsuario}`);
    return response.json();
  }

  async generarPago(paqueteId: number, botonPagoId: number, paisUsuario: string = 'US') {
    const token = await AsyncStorage.getItem('access_token');

    const response = await fetch(`${this.baseURL}/generar-pago`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paquete_id: paqueteId,
        boton_pago_id: botonPagoId,
        pais_usuario: paisUsuario
      })
    });

    return response.json();
  }

  async verificarPago(customId: string) {
    const response = await fetch(
      `${this.baseURL}/verificar-pago?ref=${customId}&source=paypal&status=completed`
    );
    return response.json();
  }

  async getMisConsultas() {
    const token = await AsyncStorage.getItem('access_token');

    const response = await fetch(`${this.baseURL}/mis-consultas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }
}

export const paymentService = new PaymentService();
```

### Traducciones (i18n)

**es/payments.json:**
```json
{
  "purchase": {
    "title": "Comprar Consultas",
    "subtitle": "Elige el paquete que mejor se adapte a tus necesidades",
    "consultations": "consultas",
    "mostPopular": "Más Popular",
    "discount": "{{percent}}% OFF",
    "pricePerQuery": "${{price}} por consulta",
    "buyButton": "Pagar con PayPal"
  },
  "success": {
    "title": "¡Pago Exitoso!",
    "processing": "Procesando tu pago...",
    "completed": "Tu pago ha sido procesado exitosamente",
    "consultationsAdded": "Se agregaron {{count}} consultas a tu cuenta",
    "totalConsultations": "Total de consultas: {{count}}",
    "continue": "Continuar"
  },
  "errors": {
    "loadingPackages": "Error cargando paquetes",
    "generatingPayment": "Error generando formulario de pago",
    "verifyingPayment": "Error verificando pago",
    "tryAgain": "Intentar nuevamente"
  }
}
```

---

## 🧪 TESTING

### Testing Backend

#### 1. Probar endpoint de paquetes

```bash
curl -X GET "http://localhost:8000/api/v1/payments/paquetes?pais_usuario=US"
```

**Esperado:** JSON con 3 paquetes y 1 método de pago

#### 2. Probar generar pago (requiere token)

Primero login:
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=test123"
```

Luego generar pago:
```bash
curl -X POST "http://localhost:8000/api/v1/payments/generar-pago" \
  -H "Authorization: Bearer {TOKEN_AQUI}" \
  -H "Content-Type: application/json" \
  -d '{
    "paquete_id": 2,
    "boton_pago_id": 2,
    "pais_usuario": "US"
  }'
```

**Esperado:** JSON con formulario HTML y custom_id

#### 3. Probar verificar pago

```bash
curl -X GET "http://localhost:8000/api/v1/payments/verificar-pago?ref=SILL-A1B2C3D4E5F6&source=paypal&status=completed"
```

**Esperado:** JSON con estado del pago

#### 4. Probar mis consultas (requiere token)

```bash
curl -X GET "http://localhost:8000/api/v1/payments/mis-consultas" \
  -H "Authorization: Bearer {TOKEN_AQUI}"
```

**Esperado:** JSON con consultas disponibles e historial

### Testing Manual Completo

1. **Iniciar backend:**
   ```bash
   cd sillage-backend
   ./venv/Scripts/python.exe -m uvicorn app.main:app --reload
   ```

2. **Verificar datos iniciales:**
   - Login a la base de datos
   - Verificar tablas: `metodos_pago`, `paquetes_consultas`, `botones_pago`

3. **Probar flujo completo:**
   - Crear usuario de prueba
   - Generar pago
   - Simular retorno de PayPal (manualmente cambiar estado en BD)
   - Verificar que se agreguen consultas
   - Verificar registro de auditoría

---

## 📝 NOTAS IMPORTANTES

### Seguridad

⚠️ **IMPORTANTE - Sistema actual NO verifica firma de PayPal**

El sistema actual confía en que si el usuario regresa a `/payment/success?status=completed`, el pago es válido. Esto es **suficiente para MVP** pero **NO es seguro para producción**.

**Solución para producción:**
Implementar IPN (Instant Payment Notification) de PayPal para verificación real. Ver archivo `INFORME_SISTEMA_PAGOS_PAYPAL.md` sección 9.1 para detalles.

### URLs de Retorno

Actualmente configuradas para desarrollo:
```
return: http://localhost:19006/payment/success?ref={custom_id}
cancel_return: http://localhost:19006/payment/cancel?ref={custom_id}
```

**Para producción:**
Cambiar a URLs reales de tu dominio:
```
return: https://tusitio.com/payment/success?ref={custom_id}
cancel_return: https://tusitio.com/payment/cancel?ref={custom_id}
```

### Email de PayPal

Configurado actualmente:
```
PAYPAL_BUSINESS_EMAIL=info@consultorabadillo.com
```

Este email debe:
- ✅ Tener una cuenta PayPal Business
- ✅ Estar verificado
- ✅ Poder recibir pagos

### Modo Sandbox vs Producción

**Actual: PRODUCCIÓN**
```
PAYPAL_MODE=production
PAYPAL_URL=https://www.paypal.com/cgi-bin/webscr
```

**Para testing (Sandbox):**
```
PAYPAL_MODE=sandbox
PAYPAL_URL=https://www.sandbox.paypal.com/cgi-bin/webscr
PAYPAL_BUSINESS_EMAIL=tu-email-sandbox@business.example.com
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend ✅ COMPLETADO

- [x] Modelos de base de datos creados
- [x] Migraciones de Alembic aplicadas
- [x] Schemas Pydantic creados
- [x] Servicio de pagos implementado
- [x] Endpoints API implementados
- [x] Configuración de PayPal agregada
- [x] Script de inicialización creado y ejecutado
- [x] Datos iniciales cargados (3 paquetes + PayPal)
- [x] Documentación completa

### Mobile ⏳ PENDIENTE

- [ ] Pantalla PurchaseScreen
- [ ] Pantalla PaymentSuccessScreen
- [ ] Pantalla PaymentCancelScreen (opcional)
- [ ] Servicio paymentService.ts
- [ ] WebView para PayPal
- [ ] Polling de verificación
- [ ] Traducciones (ES/EN)
- [ ] Navegación actualizada
- [ ] Iconos e imágenes
- [ ] Testing end-to-end

### Testing

- [ ] Backend: Endpoints con curl
- [ ] Backend: Flujo completo simulado
- [ ] Mobile: UI/UX de paquetes
- [ ] Mobile: Flujo completo con PayPal sandbox
- [ ] Mobile: Polling de verificación
- [ ] Integración: Flujo end-to-end real

### Deployment

- [ ] Backend deployed con URLs reales
- [ ] Variables de entorno de producción
- [ ] PayPal IPN webhook implementado (recomendado)
- [ ] Monitoreo y alertas
- [ ] Logging de transacciones

---

## 🚀 INICIO RÁPIDO

### 1. Levantar Backend

```bash
cd sillage-backend

# Activar venv (si no está activo)
source venv/bin/activate  # Linux/Mac
./venv/Scripts/activate   # Windows

# Iniciar servidor
uvicorn app.main:app --reload
```

### 2. Verificar Datos

```bash
# Obtener paquetes
curl -X GET "http://localhost:8000/api/v1/payments/paquetes"
```

### 3. Implementar Mobile

Seguir sección "Próximos Pasos - Mobile" de este documento.

---

## 📚 RECURSOS ADICIONALES

- **Informe PayPal Original:** `INFORME_SISTEMA_PAGOS_PAYPAL.md`
- **Documentación PayPal:** https://developer.paypal.com/
- **React Native WebView:** https://github.com/react-native-webview/react-native-webview

---

**Fecha:** 27 de Octubre, 2025
**Versión:** 1.0
**Proyecto:** Sillage - Sistema de Pagos PayPal
**Estado:** Backend Completado ✅ | Mobile Pendiente ⏳
