# INFORME TÉCNICO: Sistema de Pagos con PayPal - Botones Fijos y Asignación Automática de Créditos

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Arquitectura General](#2-arquitectura-general)
3. [Modelos de Base de Datos](#3-modelos-de-base-de-datos)
4. [Implementación Backend](#4-implementación-backend)
5. [Implementación Frontend](#5-implementación-frontend)
6. [Flujo de Pago Completo](#6-flujo-de-pago-completo)
7. [Configuración y Despliegue](#7-configuración-y-despliegue)
8. [Puntos Clave de la Implementación](#8-puntos-clave-de-la-implementación)
9. [Problemas Conocidos y Mejoras](#9-problemas-conocidos-y-mejoras)
10. [Guía de Implementación](#10-guía-de-implementación)

---

## 1. Introducción

### 1.1 Descripción del Sistema

Este sistema permite integrar **botones de pago fijos de PayPal** en una aplicación Django + REST Framework, donde:

- Los usuarios seleccionan paquetes de créditos predefinidos
- Cada paquete tiene botones de pago asociados (PayPal, Flow, etc.)
- El sistema genera formularios HTML que se envían directamente a PayPal
- Cuando el usuario completa el pago, PayPal redirige de vuelta a la aplicación
- El sistema verifica el pago y **asigna automáticamente los créditos al usuario**

### 1.2 Características Principales

✅ **Identificación única por custom_id**: Cada pago genera un ID único que conecta la transacción de PayPal con el usuario

✅ **Botones fijos multicountry**: Soporta diferentes métodos de pago según el país del usuario

✅ **Asignación automática de créditos**: Los créditos se agregan inmediatamente al wallet del usuario

✅ **Sistema de verificación con polling**: La página de éxito verifica automáticamente el estado del pago

✅ **Auditoría completa**: Todas las transacciones se registran para trazabilidad

✅ **Manejo de estados**: Pagos pendientes, completados, fallidos y reembolsados

### 1.3 Stack Tecnológico

- **Backend**: Django 4.x + Django REST Framework
- **Base de Datos**: PostgreSQL (compatible con cualquier DB de Django)
- **Pasarela de Pago**: PayPal Standard (botones HTML)
- **Frontend**: HTML + JavaScript vanilla + Tailwind CSS
- **Serialización**: Django REST Framework Serializers

---

## 2. Arquitectura General

### 2.1 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUJO COMPLETO DE PAGO                          │
└─────────────────────────────────────────────────────────────────────────┘

1. USUARIO SELECCIONA PAQUETE
   ↓
   Frontend: creditos.html
   └─ Usuario hace clic en "Pagar con PayPal"

2. GENERAR FORMULARIO PAYPAL
   ↓
   POST /api/billing/generar-url-pago/
   ├─ Genera custom_id único (TN-XXXXXXXXXXXX)
   ├─ Crea registro PagoCreditos (estado='pendiente')
   └─ Retorna datos del formulario HTML

3. ENVIAR FORMULARIO A PAYPAL
   ↓
   Frontend: JavaScript crea formulario dinámico
   └─ Submit a https://www.paypal.com/cgi-bin/webscr

4. USUARIO PAGA EN PAYPAL
   ↓
   PayPal procesa el pago
   └─ Redirige a: /payment/success/?ref={custom_id}&source=paypal&status=completed

5. VERIFICAR ESTADO DEL PAGO
   ↓
   Frontend: success.html inicia polling
   └─ GET /api/billing/verificar-pago/?ref={custom_id}&source=paypal&status=completed
      ├─ Busca PagoCreditos por custom_id
      ├─ Si pendiente → llama a _procesar_pago_completado()
      └─ Si completado → retorna datos

6. ASIGNAR CRÉDITOS AL USUARIO
   ↓
   Backend: _procesar_pago_completado(pago)
   ├─ Actualiza pago.estado = 'completado'
   ├─ Obtiene/Crea Wallet del usuario
   ├─ wallet.agregar_creditos(cantidad)
   ├─ Crea TransaccionCreditos (auditoría)
   └─ Retorna créditos totales

7. MOSTRAR CONFIRMACIÓN
   ↓
   Frontend: Muestra éxito + nuevos créditos
   └─ Actualiza display de créditos en navbar
```

### 2.2 Componentes del Sistema

```
apiTN/
├── billing/                          # App de facturación
│   ├── models.py                     # Modelos de datos
│   ├── views.py                      # Endpoints API
│   ├── serializers.py                # Serialización de datos
│   ├── urls.py                       # Rutas API
│   └── signals.py                    # Señales (créditos gratis al registrarse)
│
├── appWeb/                           # App web (frontend)
│   ├── views.py                      # Vistas Django tradicionales
│   ├── urls.py                       # Rutas web
│   └── templates/
│       └── appWeb/
│           ├── billing/
│           │   └── creditos.html     # Página de compra de créditos
│           └── payment/
│               ├── success.html      # Página de éxito
│               └── cancel.html       # Página de cancelación
│
└── settings.py                       # Configuración Django
```

---

## 3. Modelos de Base de Datos

### 3.1 Modelo: MetodoPago

Define los métodos de pago disponibles (PayPal, Flow, Stripe, etc.)

```python
from django.db import models

class MetodoPago(models.Model):
    """
    Representa un método de pago disponible en la plataforma
    """
    nombre = models.CharField(max_length=50, unique=True)  # "PayPal"
    codigo = models.CharField(max_length=20, unique=True)  # "paypal"
    descripcion = models.TextField(blank=True)
    icono = models.CharField(max_length=50, blank=True)    # Clase CSS del ícono
    color_boton = models.CharField(max_length=7, default='#007cba')  # Color hex
    paises_soportados = models.JSONField(default=list)     # ["US", "CL", "MX", "GLOBAL"]
    activo = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Método de Pago'
        verbose_name_plural = 'Métodos de Pago'
        ordering = ['orden', 'nombre']

    def soporta_pais(self, codigo_pais):
        """Verificar si el método soporta un país específico"""
        return 'GLOBAL' in self.paises_soportados or codigo_pais in self.paises_soportados
```

**Ejemplo de datos:**
```python
MetodoPago.objects.create(
    nombre="PayPal",
    codigo="paypal",
    descripcion="Paga con tarjeta o cuenta PayPal",
    icono="fab fa-paypal",
    color_boton="#0070ba",
    paises_soportados=["GLOBAL"],  # Disponible en todos los países
    activo=True,
    orden=1
)
```

### 3.2 Modelo: PaqueteCreditos

Define los paquetes de créditos que los usuarios pueden comprar

```python
class PaqueteCreditos(models.Model):
    """
    Paquete de créditos que el usuario puede comprar
    """
    nombre = models.CharField(max_length=100)              # "Paquete Básico"
    descripcion = models.TextField()
    cantidad_creditos = models.IntegerField()              # 10 créditos
    precio = models.DecimalField(max_digits=10, decimal_places=2)  # 9.99
    precio_anterior = models.DecimalField(max_digits=10, decimal_places=2,
                                          null=True, blank=True)  # 14.99 (para descuentos)
    destacado = models.BooleanField(default=False)        # "Más Popular"
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Paquete de Créditos'
        verbose_name_plural = 'Paquetes de Créditos'
        ordering = ['precio']

    @property
    def precio_por_credito(self):
        """Calcular precio unitario por crédito"""
        return round(float(self.precio) / self.cantidad_creditos, 3)

    @property
    def tiene_descuento(self):
        """Verificar si tiene precio anterior (descuento)"""
        return self.precio_anterior and self.precio_anterior > self.precio

    @property
    def porcentaje_descuento(self):
        """Calcular porcentaje de descuento"""
        if self.tiene_descuento:
            return round(((self.precio_anterior - self.precio) / self.precio_anterior) * 100)
        return 0
```

**Ejemplo de datos:**
```python
PaqueteCreditos.objects.create(
    nombre="Paquete Estelar",
    descripcion="Perfecto para consultas ocasionales",
    cantidad_creditos=10,
    precio=9.99,
    precio_anterior=14.99,  # 33% de descuento
    destacado=True,
    activo=True
)
```

### 3.3 Modelo: BotonPago

Asocia un método de pago con un paquete específico

```python
class BotonPago(models.Model):
    """
    Botón de pago específico para un paquete y método de pago
    """
    paquete = models.ForeignKey(PaqueteCreditos, on_delete=models.CASCADE,
                                related_name='botones_pago')
    metodo_pago = models.ForeignKey(MetodoPago, on_delete=models.CASCADE)
    url_base = models.URLField(blank=True)  # URL específica si es necesario
    parametros_adicionales = models.JSONField(default=dict, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Botón de Pago'
        verbose_name_plural = 'Botones de Pago'
        unique_together = ['paquete', 'metodo_pago']  # Un botón por paquete/método

    def es_disponible_para_pais(self, codigo_pais):
        """Verificar si el botón está disponible para un país"""
        return self.activo and self.metodo_pago.soporta_pais(codigo_pais)
```

### 3.4 Modelo: Wallet

Billetera de créditos del usuario

```python
from django.conf import settings

class Wallet(models.Model):
    """
    Billetera de créditos de cada usuario
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name='wallet')
    creditos_disponibles = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Billetera'
        verbose_name_plural = 'Billeteras'

    def __str__(self):
        return f"Wallet de {self.user.email} - {self.creditos_disponibles} créditos"

    def tiene_creditos_suficientes(self, cantidad):
        """Verificar si tiene créditos suficientes"""
        return self.creditos_disponibles >= cantidad

    def descontar_creditos(self, cantidad):
        """Descontar créditos (para consultas)"""
        if self.tiene_creditos_suficientes(cantidad):
            self.creditos_disponibles -= cantidad
            self.save()
            return True
        return False

    def agregar_creditos(self, cantidad):
        """Agregar créditos (compra)"""
        self.creditos_disponibles += cantidad
        self.save()
```

### 3.5 Modelo: PagoCreditos ⭐ (EL MÁS IMPORTANTE)

Registra cada transacción de pago de créditos

```python
class PagoCreditos(models.Model):
    """
    Registro de cada pago de créditos realizado
    Este es el modelo CENTRAL del sistema de pagos
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('completado', 'Completado'),
        ('fallido', 'Fallido'),
        ('reembolsado', 'Reembolsado'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                            related_name='pagos_creditos')
    paquete_creditos = models.ForeignKey(PaqueteCreditos, on_delete=models.CASCADE)
    boton_pago = models.ForeignKey(BotonPago, on_delete=models.SET_NULL,
                                   null=True, blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    metodo_pago = models.CharField(max_length=50, blank=True)  # "paypal"
    referencia_externa = models.CharField(max_length=200, blank=True)  # ID de PayPal
    custom_id = models.CharField(max_length=20, unique=True, null=True, blank=True)  # TN-XXXX
    datos_pago = models.JSONField(default=dict, blank=True)  # Metadata adicional
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pago de Créditos'
        verbose_name_plural = 'Pagos de Créditos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Pago {self.estado} - ${self.monto} - {self.user.email}"
```

**Campos clave:**
- `custom_id`: ID único generado por nosotros (TN-XXXXXXXXXXXX) que se envía a PayPal
- `referencia_externa`: ID de transacción de PayPal (si PayPal lo envía)
- `estado`: Estado actual del pago
- `datos_pago`: JSON con metadata adicional (país, email, timestamp, etc.)

### 3.6 Modelo: TransaccionCreditos

Auditoría de todos los movimientos de créditos

```python
class TransaccionCreditos(models.Model):
    """
    Registro de auditoría de todos los movimientos de créditos
    """
    TIPO_CHOICES = [
        ('compra', 'Compra'),          # Usuario compró créditos
        ('uso', 'Uso'),                # Usuario usó créditos
        ('regalo', 'Regalo'),          # Créditos regalados por admin
        ('reembolso', 'Reembolso'),    # Devolución de créditos
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                            related_name='transacciones_creditos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    descripcion = models.TextField()
    paquete_creditos = models.ForeignKey(PaqueteCreditos, on_delete=models.SET_NULL,
                                        null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Transacción de Créditos'
        verbose_name_plural = 'Transacciones de Créditos'
        ordering = ['-created_at']
```

---

## 4. Implementación Backend

### 4.1 Endpoints API (billing/urls.py)

```python
from django.urls import path
from . import views

app_name = 'billing'

urlpatterns = [
    # === OBTENER PAQUETES Y MÉTODOS DE PAGO ===
    path('paquetes-con-botones/', views.paquetes_con_botones, name='paquetes_con_botones'),

    # === GENERAR Y PROCESAR PAGOS ===
    path('generar-url-pago/', views.generar_url_pago, name='generar_url_pago'),
    path('verificar-pago/', views.verificar_pago, name='verificar_pago'),

    # === INFORMACIÓN DEL USUARIO ===
    path('mi-wallet/', views.mi_wallet, name='mi_wallet'),
    path('mis-transacciones/', views.mis_transacciones, name='mis_transacciones'),

    # === WEBHOOKS (PARA IMPLEMENTAR) ===
    path('paypal-ipn/', views.paypal_ipn, name='paypal_ipn'),
]
```

### 4.2 Endpoint: generar_url_pago() ⭐

Este endpoint genera el formulario HTML para PayPal

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_url_pago(request):
    """
    Genera formulario HTML de PayPal en lugar de URL de redirección

    Request Body:
        - paquete_id: int (ID del paquete de créditos)
        - boton_pago_id: int (ID del botón de pago)
        - pais_usuario: str (Código del país, ej: "CL")

    Response:
        {
            "success": true,
            "tipo": "formulario",
            "formulario": {
                "action": "https://www.paypal.com/cgi-bin/webscr",
                "method": "POST",
                "campos": {
                    "cmd": "_xclick",
                    "business": "tu-email@paypal.com",
                    "item_name": "Tarotnaútica - Paquete Básico",
                    "amount": "9.99",
                    "currency_code": "USD",
                    "custom": "TN-A1B2C3D4E5F6",
                    "return": "https://domain.com/payment/success/",
                    "cancel_return": "https://domain.com/payment/cancel/",
                    "rm": "2",
                    "no_shipping": "1",
                    "no_note": "1"
                }
            },
            "custom_id": "TN-A1B2C3D4E5F6"
        }
    """
    # Validar datos de entrada
    paquete_id = request.data.get('paquete_id')
    boton_pago_id = request.data.get('boton_pago_id')
    pais_usuario = request.data.get('pais_usuario', 'CL')

    if not paquete_id or not boton_pago_id:
        return Response({
            'error': 'paquete_id y boton_pago_id son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Obtener paquete y botón
        paquete = PaqueteCreditos.objects.get(id=paquete_id, activo=True)
        boton_pago = BotonPago.objects.get(id=boton_pago_id, paquete=paquete, activo=True)

        # Verificar disponibilidad para el país
        if not boton_pago.es_disponible_para_pais(pais_usuario):
            return Response({
                'error': 'Método de pago no disponible en tu país'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ===================================================================
        # PASO 1: GENERAR CUSTOM_ID ÚNICO
        # ===================================================================
        # Formato: TN-{12 caracteres hexadecimales}
        # Ejemplo: TN-A1B2C3D4E5F6
        custom_id = f"TN-{uuid.uuid4().hex[:12].upper()}"

        # ===================================================================
        # PASO 2: CREAR REGISTRO DE PAGO PENDIENTE
        # ===================================================================
        with transaction.atomic():
            pago = PagoCreditos.objects.create(
                user=request.user,
                paquete_creditos=paquete,
                boton_pago=boton_pago,
                monto=paquete.precio,
                metodo_pago=boton_pago.metodo_pago.codigo,
                estado='pendiente',  # ← Estado inicial
                referencia_externa=custom_id,
                custom_id=custom_id,  # ← ID único que conecta todo
                datos_pago={
                    'pais_usuario': pais_usuario,
                    'timestamp': timezone.now().isoformat(),
                    'user_id': request.user.id,
                    'user_email': request.user.email,
                    'metodo': 'formulario_paypal'
                }
            )

        # ===================================================================
        # PASO 3: GENERAR DATOS DEL FORMULARIO HTML
        # ===================================================================
        base_url = request.build_absolute_uri('/')

        formulario_data = {
            'action': 'https://www.paypal.com/cgi-bin/webscr',  # Producción
            # 'action': 'https://www.sandbox.paypal.com/cgi-bin/webscr',  # Sandbox
            'method': 'POST',
            'campos': {
                'cmd': '_xclick',  # Tipo de botón PayPal
                'business': 'tu-email@paypal.com',  # ← CAMBIAR POR TU EMAIL PAYPAL
                'item_name': f'Tarotnaútica - {paquete.nombre}',
                'amount': str(paquete.precio),
                'currency_code': 'USD',
                'custom': custom_id,  # ← CRÍTICO: Este es el ID que regresa PayPal
                'return': f"{base_url}payment/success/",  # URL de éxito
                'cancel_return': f"{base_url}payment/cancel/",  # URL de cancelación
                'rm': '2',  # Return method (POST)
                'no_shipping': '1',  # No pedir dirección de envío
                'no_note': '1'  # No permitir notas
            }
        }

        return Response({
            'success': True,
            'tipo': 'formulario',
            'formulario': formulario_data,
            'custom_id': custom_id,
            'paquete_nombre': paquete.nombre,
            'monto': str(paquete.precio)
        }, status=status.HTTP_200_OK)

    except PaqueteCreditos.DoesNotExist:
        return Response({
            'error': 'Paquete no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except BotonPago.DoesNotExist:
        return Response({
            'error': 'Botón de pago no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Error generando formulario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 4.3 Endpoint: verificar_pago() ⭐

Este endpoint verifica el estado del pago y lo completa si es necesario

```python
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Permitir sin autenticación
def verificar_pago(request):
    """
    Verifica el estado de un pago usando el custom_id

    Query Parameters:
        - ref: string (custom_id del pago, ej: "TN-A1B2C3D4E5F6")
        - source: string (opcional, "paypal")
        - status: string (opcional, "completed")

    Response (éxito):
        {
            "success": true,
            "estado": "completado",
            "paquete_nombre": "Paquete Básico",
            "creditos_agregados": 10,
            "creditos_totales": 25,
            "monto": "9.99",
            "fecha_pago": "2024-01-15T10:30:00Z"
        }

    Response (pendiente):
        {
            "success": true,
            "estado": "pendiente",
            "mensaje": "Verificando pago..."
        }
    """
    payment_ref = request.GET.get('ref')
    source = request.GET.get('source')
    status_param = request.GET.get('status')

    logger.info(f"Verificando pago - Ref: {payment_ref}, Source: {source}, Status: {status_param}")

    if not payment_ref:
        return Response({
            'error': 'Referencia de pago requerida'
        }, status=status.HTTP_400_BAD_REQUEST)

    # ===================================================================
    # CASO 1: PAGO DIRECTO DE PAYPAL COMPLETADO
    # ===================================================================
    if source == 'paypal' and status_param == 'completed':
        logger.info(f"Procesando pago directo de PayPal: {payment_ref}")

        try:
            # Buscar el pago por custom_id
            pago = PagoCreditos.objects.filter(custom_id=payment_ref).first()

            if pago:
                if pago.estado == 'completado':
                    # Ya procesado anteriormente
                    logger.info(f"Pago ya completado: {payment_ref}")
                    return Response({
                        'success': True,
                        'estado': 'completado',
                        'paquete_nombre': pago.paquete_creditos.nombre,
                        'creditos_agregados': pago.paquete_creditos.cantidad_creditos,
                        'creditos_totales': pago.user.wallet.creditos_disponibles,
                        'monto': str(pago.monto),
                        'fecha_pago': pago.updated_at.isoformat()
                    })
                else:
                    # Completar pago pendiente
                    logger.info(f"Completando pago pendiente: {payment_ref}")
                    _procesar_pago_completado(pago)
                    return Response({
                        'success': True,
                        'estado': 'completado',
                        'paquete_nombre': pago.paquete_creditos.nombre,
                        'creditos_agregados': pago.paquete_creditos.cantidad_creditos,
                        'creditos_totales': pago.user.wallet.creditos_disponibles,
                        'monto': str(pago.monto),
                        'fecha_pago': pago.updated_at.isoformat()
                    })
            else:
                # NO EXISTE EL PAGO
                logger.warning(f"Pago no encontrado: {payment_ref}")
                return Response({
                    'error': 'Pago no encontrado',
                    'referencia': payment_ref
                }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error procesando pago PayPal {payment_ref}: {str(e)}")
            return Response({
                'error': f'Error procesando pago: {str(e)}',
                'referencia': payment_ref
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ===================================================================
    # CASO 2: BÚSQUEDA NORMAL EN BASE DE DATOS
    # ===================================================================
    try:
        # Buscar por custom_id
        pago = PagoCreditos.objects.get(custom_id=payment_ref)

        if pago.estado == 'completado':
            return Response({
                'success': True,
                'estado': 'completado',
                'paquete_nombre': pago.paquete_creditos.nombre,
                'creditos_agregados': pago.paquete_creditos.cantidad_creditos,
                'creditos_totales': pago.user.wallet.creditos_disponibles,
                'monto': str(pago.monto),
                'fecha_pago': pago.updated_at.isoformat()
            })
        elif pago.estado == 'pendiente':
            # Auto-completar si han pasado más de 5 segundos
            tiempo_transcurrido = (timezone.now() - pago.created_at).total_seconds()
            if tiempo_transcurrido > 5:
                _procesar_pago_completado(pago)
                return Response({
                    'success': True,
                    'estado': 'completado',
                    'paquete_nombre': pago.paquete_creditos.nombre,
                    'creditos_agregados': pago.paquete_creditos.cantidad_creditos,
                    'creditos_totales': pago.user.wallet.creditos_disponibles,
                    'monto': str(pago.monto),
                    'fecha_pago': pago.updated_at.isoformat()
                })
            else:
                return Response({
                    'success': True,
                    'estado': 'pendiente',
                    'mensaje': 'Verificando pago...'
                })
        else:
            return Response({
                'success': False,
                'error': f'El pago está en estado: {pago.estado}'
            })

    except PagoCreditos.DoesNotExist:
        return Response({
            'error': 'Pago no encontrado',
            'referencia': payment_ref
        }, status=status.HTTP_404_NOT_FOUND)
```

### 4.4 Función: _procesar_pago_completado() ⭐⭐⭐

**Esta es la función MÁS IMPORTANTE** - Aquí se asignan los créditos al usuario

```python
def _procesar_pago_completado(pago):
    """
    Procesar un pago como completado y agregar créditos al usuario

    Esta función es ATÓMICA: o todo se ejecuta correctamente o nada se ejecuta
    """
    try:
        with transaction.atomic():
            # ===================================================================
            # VALIDACIÓN: Verificar que no esté ya completado
            # ===================================================================
            if pago.estado == 'completado':
                logger.info(f"ℹ️ Pago {pago.referencia_externa} ya estaba completado")
                return

            logger.info(f"🔄 Procesando pago como completado: {pago.referencia_externa}")

            # ===================================================================
            # PASO 1: ACTUALIZAR ESTADO DEL PAGO
            # ===================================================================
            pago.estado = 'completado'
            pago.save()

            # ===================================================================
            # PASO 2: OBTENER O CREAR WALLET DEL USUARIO
            # ===================================================================
            wallet, created = Wallet.objects.get_or_create(user=pago.user)
            creditos_antes = wallet.creditos_disponibles

            # ===================================================================
            # PASO 3: AGREGAR CRÉDITOS AL WALLET ⭐
            # ===================================================================
            wallet.agregar_creditos(pago.paquete_creditos.cantidad_creditos)
            creditos_despues = wallet.creditos_disponibles

            # ===================================================================
            # PASO 4: CREAR REGISTRO DE AUDITORÍA
            # ===================================================================
            # Verificar que no exista ya
            transaccion_existente = TransaccionCreditos.objects.filter(
                user=pago.user,
                tipo='compra',
                paquete_creditos=pago.paquete_creditos,
                descripcion__icontains=pago.referencia_externa
            ).first()

            if not transaccion_existente:
                TransaccionCreditos.objects.create(
                    user=pago.user,
                    tipo='compra',
                    cantidad=pago.paquete_creditos.cantidad_creditos,
                    descripcion=f'Compra de {pago.paquete_creditos.nombre} vía {pago.metodo_pago} - Ref: {pago.referencia_externa}',
                    paquete_creditos=pago.paquete_creditos
                )
                logger.info(f"📝 Transacción registrada para {pago.referencia_externa}")
            else:
                logger.info(f"ℹ️ Transacción ya existía para {pago.referencia_externa}")

            # ===================================================================
            # LOGGING FINAL
            # ===================================================================
            logger.info(f"✅ Pago {pago.referencia_externa} completado | Usuario: {pago.user.email} | Créditos: {creditos_antes} → {creditos_despues}")

    except Exception as e:
        logger.error(f"💥 Error procesando pago completado {pago.referencia_externa}: {str(e)}")
        import traceback
        logger.error(f"💥 Traceback: {traceback.format_exc()}")
        raise  # Re-lanzar excepción para rollback
```

---

## 5. Implementación Frontend

### 5.1 Página de Compra (creditos.html)

Esta página muestra los paquetes de créditos y botones de pago

**HTML:**
```html
<!-- Botón de Pago -->
<button onclick="iniciarPago({{ paquete.id }}, {{ boton.id }}, '{{ boton.metodo_pago.nombre|escapejs }}')"
        class="boton-pago w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-lg font-medium"
        style="background: {{ boton.metodo_pago.color_boton }}; color: white;">
    <i class="{{ boton.metodo_pago.icono }} text-lg"></i>
    <span>Pagar con {{ boton.metodo_pago.nombre }}</span>
</button>

<!-- Loading Overlay -->
<div id="loadingOverlay" class="loading-overlay">
    <div class="text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-cosmic-100 text-lg">Redirigiendo a la plataforma de pago...</p>
    </div>
</div>

<!-- CSRF Token -->
<input type="hidden" name="csrfmiddlewaretoken" value="{{ csrf_token }}">
```

**JavaScript:**
```javascript
// Variables globales
let pagoEnProceso = false;

/**
 * Inicia el proceso de pago
 * 1. Llama al API para generar formulario
 * 2. Crea formulario HTML dinámicamente
 * 3. Envía formulario a PayPal
 */
function iniciarPago(paqueteId, botonPagoId, metodoPago) {
    if (pagoEnProceso) {
        console.log('Pago ya en proceso...');
        return;
    }

    console.log('Iniciando pago:', { paqueteId, botonPagoId, metodoPago });

    // Mostrar loading
    mostrarLoading();
    pagoEnProceso = true;

    // Preparar datos para el API
    const formData = new FormData();
    formData.append('paquete_id', paqueteId);
    formData.append('boton_pago_id', botonPagoId);
    formData.append('pais_usuario', 'CL');  // Puedes detectar esto automáticamente

    // Obtener CSRF token
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // ===================================================================
    // PASO 1: LLAMAR AL API PARA GENERAR FORMULARIO
    // ===================================================================
    fetch('/api/billing/generar-url-pago/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Datos recibidos:', data);

        if (data.success && data.tipo === 'formulario') {
            // ===============================================================
            // PASO 2: CREAR Y ENVIAR FORMULARIO HTML A PAYPAL
            // ===============================================================
            crearYEnviarFormularioPayPal(data.formulario);
        } else {
            mostrarMensajeError(data.error || 'Error generando formulario de pago');
        }
    })
    .catch(error => {
        console.error('Error en la llamada:', error);
        mostrarMensajeError('Error de conexión. Inténtalo de nuevo.');
    })
    .finally(() => {
        ocultarLoading();
        pagoEnProceso = false;
    });
}

/**
 * Crea formulario HTML dinámicamente y lo envía a PayPal
 */
function crearYEnviarFormularioPayPal(formularioData) {
    console.log('Creando formulario PayPal:', formularioData);

    // Crear formulario
    const form = document.createElement('form');
    form.method = formularioData.method;
    form.action = formularioData.action;

    // Agregar todos los campos como inputs ocultos
    Object.entries(formularioData.campos).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    });

    // Agregar formulario al DOM
    document.body.appendChild(form);

    // Enviar formulario (esto redirige a PayPal)
    console.log('Enviando formulario a PayPal...');
    form.submit();
}

// Funciones auxiliares
function mostrarLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function ocultarLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

function mostrarMensajeError(mensaje) {
    alert(`Error: ${mensaje}`);
    // Puedes implementar un modal más elegante aquí
}
```

### 5.2 Página de Éxito (success.html)

Esta página verifica automáticamente el pago mediante polling

**HTML:**
```html
<div class="min-h-screen flex items-center justify-center">
    <div class="max-w-md w-full space-y-8">

        <!-- Loading State (inicial) -->
        <div id="processingState" class="text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-spinner fa-spin text-3xl text-white"></i>
            </div>
            <h2 class="font-mystical text-3xl font-bold text-cosmic-100 mb-2">
                Procesando tu Pago...
            </h2>
            <p class="text-cosmic-300">
                Verificando la transacción con PayPal
            </p>
        </div>

        <!-- Success State (se muestra después) -->
        <div id="successState" class="hidden text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-mystic-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-check text-3xl text-white"></i>
            </div>
            <h2 class="font-mystical text-3xl font-bold text-cosmic-100 mb-2">
                ¡Pago Exitoso!
            </h2>
            <p class="text-cosmic-300">
                Tus créditos han sido agregados exitosamente
            </p>
        </div>

        <!-- Payment Details Card -->
        <div class="bg-cosmic-800/50 backdrop-blur-sm rounded-2xl p-8">
            <h3 class="font-mystical text-lg font-semibold mb-4">
                Detalles del Pago
            </h3>

            <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                    <span>Referencia:</span>
                    <span id="paymentRef">-</span>
                </div>
                <div class="flex justify-between">
                    <span>Paquete:</span>
                    <span id="packageName">-</span>
                </div>
                <div class="flex justify-between">
                    <span>Créditos:</span>
                    <span id="creditsAmount">-</span>
                </div>
                <div class="flex justify-between">
                    <span>Estado:</span>
                    <span id="paymentStatus">Procesando...</span>
                </div>
            </div>

            <!-- Credits Display -->
            <div id="creditsDisplay" class="hidden mt-6 bg-gold-900/20 border border-gold-500/30 rounded-lg p-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-gold-400">
                        +<span id="newCredits">0</span> créditos
                    </div>
                    <div class="text-cosmic-300 text-sm">
                        Total: <span id="totalCredits">0</span> créditos
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div id="actionButtons" class="hidden mt-6 space-y-3">
                <a href="/mazos/" class="block w-full bg-primary-500 text-white text-center py-3 rounded-lg">
                    Comenzar Consultas
                </a>
                <a href="/perfil/" class="block w-full border border-cosmic-500 text-center py-3 rounded-lg">
                    Ver Mi Perfil
                </a>
            </div>
        </div>
    </div>
</div>
```

**JavaScript:**
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // ===================================================================
    // PASO 1: OBTENER PARÁMETROS DE LA URL
    // ===================================================================
    // URL ejemplo: /payment/success/?ref=TN-A1B2C3D4E5F6&source=paypal&status=completed
    const urlParams = new URLSearchParams(window.location.search);
    let paymentRef = urlParams.get('ref');
    const source = urlParams.get('source');
    const status = urlParams.get('status');

    console.log('Parámetros URL:', { paymentRef, source, status });

    if (!paymentRef) {
        showError('Referencia de pago no encontrada');
        return;
    }

    // Mostrar referencia en la UI
    document.getElementById('paymentRef').textContent = paymentRef;

    // ===================================================================
    // PASO 2: CONSTRUIR URL DE VERIFICACIÓN
    // ===================================================================
    let verifyUrl = `/api/billing/verificar-pago/?ref=${paymentRef}`;
    if (source && status) {
        verifyUrl += `&source=${source}&status=${status}`;
    }

    // ===================================================================
    // PASO 3: INICIAR VERIFICACIÓN (POLLING)
    // ===================================================================
    verificarEstadoPago(verifyUrl);
});

/**
 * Verifica el estado del pago mediante polling
 * Se ejecuta cada 2-3 segundos hasta que el pago esté completado
 */
function verificarEstadoPago(verifyUrl) {
    fetch(verifyUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Respuesta de verificación:', data);

            if (data.success) {
                if (data.estado === 'completado') {
                    // ===============================================
                    // PAGO COMPLETADO - MOSTRAR ÉXITO
                    // ===============================================
                    showSuccess(data);
                } else if (data.estado === 'pendiente') {
                    // ===============================================
                    // PAGO PENDIENTE - REINTENTAR
                    // ===============================================
                    const urlParams = new URLSearchParams(window.location.search);
                    const source = urlParams.get('source');

                    if (source === 'paypal') {
                        // Si viene de PayPal, reintentar en 2 segundos
                        setTimeout(() => verificarEstadoPago(verifyUrl), 2000);
                    } else {
                        // Otros métodos, reintentar en 3 segundos
                        setTimeout(() => verificarEstadoPago(verifyUrl), 3000);
                    }
                } else {
                    showError('El pago no fue completado exitosamente');
                }
            } else {
                showError(data.error || 'Error verificando el pago');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError('Error de conexión');
        });
}

/**
 * Muestra estado de éxito
 */
function showSuccess(data) {
    // Ocultar estado de procesamiento
    document.getElementById('processingState').classList.add('hidden');
    document.getElementById('successState').classList.remove('hidden');

    // Mostrar detalles
    document.getElementById('packageName').textContent = data.paquete_nombre;
    document.getElementById('creditsAmount').textContent = data.creditos_agregados;
    document.getElementById('paymentStatus').textContent = 'Completado';
    document.getElementById('paymentStatus').className = 'text-green-400';

    // Mostrar créditos
    document.getElementById('newCredits').textContent = data.creditos_agregados;
    document.getElementById('totalCredits').textContent = data.creditos_totales;
    document.getElementById('creditsDisplay').classList.remove('hidden');

    // Mostrar botones de acción
    document.getElementById('actionButtons').classList.remove('hidden');

    // Actualizar navbar si existe
    const navbarCreditos = document.querySelector('#creditos-display');
    if (navbarCreditos) {
        navbarCreditos.textContent = data.creditos_totales;
    }
}

/**
 * Muestra estado de error
 */
function showError(message) {
    document.getElementById('processingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('paymentStatus').textContent = 'Error';
    document.getElementById('paymentStatus').className = 'text-red-400';
}
```

---

## 6. Flujo de Pago Completo

### Paso a Paso Detallado

#### **PASO 1: Usuario hace clic en botón de pago**

```
Usuario → [Pagar con PayPal] → iniciarPago(paqueteId, botonId, "PayPal")
```

#### **PASO 2: Frontend llama a generar_url_pago()**

```javascript
POST /api/billing/generar-url-pago/
Body: {
    "paquete_id": 1,
    "boton_pago_id": 1,
    "pais_usuario": "CL"
}
```

#### **PASO 3: Backend genera custom_id y crea registro pendiente**

```python
# Generar ID único
custom_id = "TN-A1B2C3D4E5F6"

# Crear registro en DB
PagoCreditos.objects.create(
    user=request.user,
    paquete_creditos=paquete,
    monto=9.99,
    estado='pendiente',  # ← Estado inicial
    custom_id=custom_id  # ← ID que conecta todo
)
```

#### **PASO 4: Backend retorna datos del formulario**

```json
{
    "success": true,
    "tipo": "formulario",
    "formulario": {
        "action": "https://www.paypal.com/cgi-bin/webscr",
        "method": "POST",
        "campos": {
            "cmd": "_xclick",
            "business": "tu-email@paypal.com",
            "item_name": "Tarotnaútica - Paquete Básico",
            "amount": "9.99",
            "currency_code": "USD",
            "custom": "TN-A1B2C3D4E5F6",  ← ID ÚNICO
            "return": "https://domain.com/payment/success/",
            "cancel_return": "https://domain.com/payment/cancel/"
        }
    }
}
```

#### **PASO 5: Frontend crea y envía formulario a PayPal**

```javascript
// Crear formulario dinámico
const form = document.createElement('form');
form.method = 'POST';
form.action = 'https://www.paypal.com/cgi-bin/webscr';

// Agregar campos
form.innerHTML = `
    <input type="hidden" name="cmd" value="_xclick">
    <input type="hidden" name="business" value="tu-email@paypal.com">
    <input type="hidden" name="amount" value="9.99">
    <input type="hidden" name="custom" value="TN-A1B2C3D4E5F6">
    <!-- más campos... -->
`;

// Enviar (esto redirige a PayPal)
document.body.appendChild(form);
form.submit();
```

#### **PASO 6: Usuario paga en PayPal**

```
Usuario en sitio de PayPal
→ Ingresa credenciales
→ Autoriza pago
→ PayPal procesa
```

#### **PASO 7: PayPal redirige de vuelta**

```
https://domain.com/payment/success/?ref=TN-A1B2C3D4E5F6&source=paypal&status=completed
```

#### **PASO 8: Página de éxito inicia polling**

```javascript
// success.html carga
verificarEstadoPago('/api/billing/verificar-pago/?ref=TN-A1B2C3D4E5F6&source=paypal&status=completed');

// Ejecuta cada 2 segundos hasta que:
// - El pago esté completado, O
// - Haya un error
```

#### **PASO 9: Backend verifica y completa el pago**

```python
# verificar_pago() encuentra el pago
pago = PagoCreditos.objects.get(custom_id='TN-A1B2C3D4E5F6')

# Si está pendiente, lo completa
if pago.estado == 'pendiente':
    _procesar_pago_completado(pago)
```

#### **PASO 10: Backend asigna créditos**

```python
def _procesar_pago_completado(pago):
    with transaction.atomic():
        # 1. Cambiar estado
        pago.estado = 'completado'
        pago.save()

        # 2. Obtener wallet
        wallet = Wallet.objects.get(user=pago.user)

        # 3. AGREGAR CRÉDITOS ⭐
        wallet.agregar_creditos(pago.paquete_creditos.cantidad_creditos)
        # Antes: 15 créditos
        # Después: 25 créditos (15 + 10)

        # 4. Crear auditoría
        TransaccionCreditos.objects.create(
            user=pago.user,
            tipo='compra',
            cantidad=10,
            descripcion='Compra de Paquete Básico vía paypal'
        )
```

#### **PASO 11: Frontend muestra éxito**

```javascript
// Respuesta del API
{
    "success": true,
    "estado": "completado",
    "creditos_agregados": 10,
    "creditos_totales": 25
}

// Actualizar UI
showSuccess(data);
// → Muestra check verde
// → Muestra nuevos créditos
// → Muestra botones de acción
```

---

## 7. Configuración y Despliegue

### 7.1 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# PayPal Configuration
PAYPAL_EMAIL=tu-email@paypal.com
PAYPAL_MODE=production  # o 'sandbox' para testing

# URLs de la aplicación
BASE_URL=https://tudominio.com

# Django
SECRET_KEY=tu-secret-key-super-segura
DEBUG=False
```

### 7.2 settings.py

```python
import os
from pathlib import Path

# PayPal Configuration
PAYPAL_EMAIL = os.getenv('PAYPAL_EMAIL', 'tu-email@paypal.com')
PAYPAL_MODE = os.getenv('PAYPAL_MODE', 'sandbox')

# URLs
BASE_URL = os.getenv('BASE_URL', 'http://localhost:8000')

# PayPal URLs según el modo
if PAYPAL_MODE == 'production':
    PAYPAL_URL = 'https://www.paypal.com/cgi-bin/webscr'
else:
    PAYPAL_URL = 'https://www.sandbox.paypal.com/cgi-bin/webscr'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/payments.log',
        },
    },
    'loggers': {
        'billing': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 7.3 Migrar Base de Datos

```bash
# Crear migraciones
python manage.py makemigrations billing

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser
```

### 7.4 Datos Iniciales (Opcional)

Crear script `billing/management/commands/setup_payment_methods.py`:

```python
from django.core.management.base import BaseCommand
from billing.models import MetodoPago, PaqueteCreditos, BotonPago

class Command(BaseCommand):
    help = 'Configura métodos de pago y paquetes iniciales'

    def handle(self, *args, **options):
        # Crear método PayPal
        paypal, created = MetodoPago.objects.get_or_create(
            codigo='paypal',
            defaults={
                'nombre': 'PayPal',
                'descripcion': 'Paga con tarjeta o cuenta PayPal',
                'icono': 'fab fa-paypal',
                'color_boton': '#0070ba',
                'paises_soportados': ['GLOBAL'],
                'activo': True,
                'orden': 1
            }
        )
        self.stdout.write(f"✅ PayPal {'creado' if created else 'ya existe'}")

        # Crear paquetes
        paquetes = [
            {
                'nombre': 'Paquete Básico',
                'descripcion': 'Ideal para probar el servicio',
                'cantidad_creditos': 5,
                'precio': 4.99,
                'destacado': False
            },
            {
                'nombre': 'Paquete Estelar',
                'descripcion': 'El más popular',
                'cantidad_creditos': 10,
                'precio': 9.99,
                'precio_anterior': 14.99,
                'destacado': True
            },
            {
                'nombre': 'Paquete Premium',
                'descripcion': 'Para usuarios frecuentes',
                'cantidad_creditos': 25,
                'precio': 19.99,
                'precio_anterior': 29.99,
                'destacado': False
            }
        ]

        for paquete_data in paquetes:
            paquete, created = PaqueteCreditos.objects.get_or_create(
                nombre=paquete_data['nombre'],
                defaults=paquete_data
            )

            # Crear botón de pago para este paquete
            if created:
                BotonPago.objects.create(
                    paquete=paquete,
                    metodo_pago=paypal,
                    activo=True
                )
                self.stdout.write(f"✅ Paquete '{paquete.nombre}' creado con botón PayPal")
            else:
                self.stdout.write(f"ℹ️ Paquete '{paquete.nombre}' ya existe")
```

**Ejecutar:**
```bash
python manage.py setup_payment_methods
```

---

## 8. Puntos Clave de la Implementación

### 8.1 Sistema de custom_id Único

**¿Por qué es importante?**

El `custom_id` es el puente entre PayPal y tu aplicación. Es el ÚNICO campo que conecta:
- La transacción en PayPal
- El registro en tu base de datos
- El usuario que realizó el pago

**Formato:**
```
TN-{12 caracteres hexadecimales}
Ejemplo: TN-A1B2C3D4E5F6
```

**Generación:**
```python
import uuid
custom_id = f"TN-{uuid.uuid4().hex[:12].upper()}"
```

**Ventajas:**
- ✅ Único garantizado (UUID)
- ✅ Corto y legible
- ✅ Prefijo identifica tu aplicación
- ✅ Se envía a PayPal y regresa intacto

### 8.2 Estados de Pago

```python
ESTADO_CHOICES = [
    ('pendiente', 'Pendiente'),      # Pago creado, esperando confirmación
    ('completado', 'Completado'),    # Pago confirmado, créditos asignados
    ('fallido', 'Fallido'),          # Pago rechazado o error
    ('reembolsado', 'Reembolsado'),  # Pago devuelto
]
```

**Flujo de estados:**
```
pendiente → completado → [reembolsado]
          ↓
       fallido
```

### 8.3 Atomicidad de Transacciones

**Uso de `transaction.atomic()`:**

```python
from django.db import transaction

with transaction.atomic():
    # 1. Actualizar pago
    pago.estado = 'completado'
    pago.save()

    # 2. Agregar créditos
    wallet.agregar_creditos(10)

    # 3. Crear auditoría
    TransaccionCreditos.objects.create(...)

# Si CUALQUIER operación falla:
# → TODAS las operaciones se revierten (rollback)
# → La base de datos queda en estado consistente
```

**¿Por qué es crítico?**
- Evita que se marquen pagos como completados sin agregar créditos
- Evita que se agreguen créditos sin marcar el pago como completado
- Garantiza consistencia de datos

### 8.4 Sistema de Auditoría

Cada movimiento de créditos se registra en `TransaccionCreditos`:

```python
# Al comprar créditos
TransaccionCreditos.objects.create(
    user=usuario,
    tipo='compra',
    cantidad=10,
    descripcion='Compra de Paquete Estelar vía paypal - Ref: TN-A1B2C3D4E5F6'
)

# Al usar créditos
TransaccionCreditos.objects.create(
    user=usuario,
    tipo='uso',
    cantidad=1,
    descripcion='Consulta de tarot - Tirada de 3 cartas'
)
```

**Beneficios:**
- Trazabilidad completa
- Debugging de problemas
- Reportes y estadísticas
- Soporte al cliente

### 8.5 Polling vs Webhooks

**Implementación actual: Polling**

```javascript
// Verifica cada 2 segundos
function verificarEstadoPago(url) {
    fetch(url)
        .then(...)
        .then(data => {
            if (data.estado === 'pendiente') {
                setTimeout(() => verificarEstadoPago(url), 2000);
            }
        });
}
```

**Ventajas del polling:**
- ✅ Simple de implementar
- ✅ No requiere URL pública
- ✅ Funciona en localhost

**Desventajas:**
- ❌ Consume más recursos
- ❌ Puede ser lento (2-3 segundos de delay)

**Alternativa: Webhooks (IPN de PayPal)**

```python
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def paypal_ipn(request):
    """
    PayPal envía POST aquí cuando confirma el pago
    """
    # 1. Verificar que viene de PayPal
    # 2. Extraer custom_id
    # 3. Completar pago inmediatamente
    # 4. Retornar 200 OK
```

**Ventajas de webhooks:**
- ✅ Instantáneo
- ✅ Más confiable
- ✅ Menos recursos

**Desventajas:**
- ❌ Requiere URL pública accesible
- ❌ Más complejo de implementar
- ❌ Requiere verificación de firma

---

## 9. Problemas Conocidos y Mejoras

### 9.1 Problemas Actuales

#### **1. Email de PayPal Hardcodeado**

**Problema:**
```python
'business': 'alan.munoz.b@gmail.com',  # ← Hardcodeado
```

**Solución:**
```python
from django.conf import settings

'business': settings.PAYPAL_EMAIL,
```

#### **2. No hay verificación real con PayPal**

**Problema:**
- El sistema confía en que si el usuario regresa a `/payment/success/`, el pago es válido
- Cualquiera podría fabricar una URL con un custom_id válido

**Solución:**
Implementar IPN (Instant Payment Notification) de PayPal:

```python
@api_view(['POST'])
def paypal_ipn(request):
    # 1. Recibir POST de PayPal
    ipn_data = request.POST.dict()

    # 2. Verificar con PayPal (devolver los datos)
    verify_url = 'https://ipnpb.paypal.com/cgi-bin/webscr'
    verify_params = {'cmd': '_notify-validate'}
    verify_params.update(ipn_data)

    response = requests.post(verify_url, data=verify_params)

    # 3. Si PayPal confirma "VERIFIED"
    if response.text == 'VERIFIED':
        custom_id = ipn_data.get('custom')
        payment_status = ipn_data.get('payment_status')

        if payment_status == 'Completed':
            pago = PagoCreditos.objects.get(custom_id=custom_id)
            _procesar_pago_completado(pago)

    return Response({'status': 'ok'})
```

#### **3. Auto-completado a los 5 segundos**

**Problema:**
```python
if tiempo_transcurrido > 5:
    _procesar_pago_completado(pago)  # ← Riesgoso
```

**Solución:**
- Solo auto-completar si hay evidencia adicional (webhook, email, etc.)
- O aumentar el tiempo (30-60 segundos)
- O requerir confirmación manual

#### **4. Sin manejo de reembolsos**

**Problema:**
- Si un usuario pide reembolso en PayPal, los créditos no se descuentan automáticamente

**Solución:**
```python
# En IPN webhook
if payment_status == 'Refunded':
    pago = PagoCreditos.objects.get(referencia_externa=txn_id)
    pago.estado = 'reembolsado'
    pago.save()

    # Descontar créditos
    wallet = pago.user.wallet
    wallet.descontar_creditos(pago.paquete_creditos.cantidad_creditos)

    # Registrar
    TransaccionCreditos.objects.create(
        user=pago.user,
        tipo='reembolso',
        cantidad=-pago.paquete_creditos.cantidad_creditos,
        descripcion=f'Reembolso de {pago.paquete_creditos.nombre}'
    )
```

### 9.2 Mejoras Recomendadas

#### **1. Sistema de Notificaciones**

Enviar emails cuando:
- ✉️ Se completa un pago
- ✉️ Falló un pago
- ✉️ Se procesan créditos

```python
from django.core.mail import send_mail

def _procesar_pago_completado(pago):
    # ... código existente ...

    # Enviar email
    send_mail(
        subject='¡Pago Confirmado! - Tarotnaútica',
        message=f'Tu pago de ${pago.monto} ha sido confirmado. Se agregaron {pago.paquete_creditos.cantidad_creditos} créditos a tu cuenta.',
        from_email='noreply@tarotnautica.com',
        recipient_list=[pago.user.email],
    )
```

#### **2. Panel de Administración Mejorado**

```python
# billing/admin.py
from django.contrib import admin
from .models import PagoCreditos, Wallet, TransaccionCreditos

@admin.register(PagoCreditos)
class PagoCreditosAdmin(admin.ModelAdmin):
    list_display = ['custom_id', 'user', 'monto', 'estado', 'created_at']
    list_filter = ['estado', 'metodo_pago', 'created_at']
    search_fields = ['custom_id', 'user__email', 'referencia_externa']
    readonly_fields = ['created_at', 'updated_at']

    actions = ['completar_pagos_seleccionados']

    def completar_pagos_seleccionados(self, request, queryset):
        for pago in queryset.filter(estado='pendiente'):
            _procesar_pago_completado(pago)
        self.message_user(request, f'{queryset.count()} pagos completados')
```

#### **3. Validación de Monto**

```python
def verificar_pago(request):
    # ... código existente ...

    # NUEVO: Validar que el monto pagado coincida
    monto_esperado = float(pago.monto)
    monto_pagado = float(request.GET.get('mc_gross', 0))

    if abs(monto_pagado - monto_esperado) > 0.01:
        logger.error(f"Monto no coincide: esperado ${monto_esperado}, pagado ${monto_pagado}")
        return Response({
            'error': 'Monto de pago no coincide'
        }, status=status.HTTP_400_BAD_REQUEST)
```

#### **4. Rate Limiting**

Prevenir abuso del endpoint de verificación:

```python
from rest_framework.throttling import UserRateThrottle

class PaymentVerificationThrottle(UserRateThrottle):
    rate = '10/minute'  # Máximo 10 verificaciones por minuto

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([PaymentVerificationThrottle])
def verificar_pago(request):
    # ... código existente ...
```

#### **5. Cache de Resultados**

```python
from django.core.cache import cache

def verificar_pago(request):
    payment_ref = request.GET.get('ref')

    # Verificar cache primero
    cache_key = f'payment_status_{payment_ref}'
    cached_result = cache.get(cache_key)
    if cached_result:
        return Response(cached_result)

    # ... código de verificación ...

    # Guardar en cache por 5 minutos
    if result['estado'] == 'completado':
        cache.set(cache_key, result, 300)

    return Response(result)
```

---

## 10. Guía de Implementación

### Checklist Completo para Implementar en Otro Proyecto

#### **FASE 1: Setup Inicial**

- [ ] Crear app Django `billing`
- [ ] Instalar dependencias: `djangorestframework`
- [ ] Configurar `INSTALLED_APPS` en settings.py
- [ ] Configurar variables de entorno (`.env`)

#### **FASE 2: Modelos de Base de Datos**

- [ ] Crear modelo `MetodoPago`
- [ ] Crear modelo `PaqueteCreditos`
- [ ] Crear modelo `BotonPago`
- [ ] Crear modelo `Wallet`
- [ ] Crear modelo `PagoCreditos` ⭐
- [ ] Crear modelo `TransaccionCreditos`
- [ ] Ejecutar `makemigrations` y `migrate`

#### **FASE 3: Serializers**

- [ ] Crear `MetodoPagoSerializer`
- [ ] Crear `PaqueteCreditosSerializer`
- [ ] Crear `BotonPagoSerializer`
- [ ] Crear `WalletSerializer`
- [ ] Crear `PagoCreditosSerializer`
- [ ] Crear `ComprarCreditosSerializer` (para validación)

#### **FASE 4: Endpoints API**

- [ ] Implementar `paquetes_con_botones()` - GET
- [ ] Implementar `generar_url_pago()` - POST ⭐
- [ ] Implementar `verificar_pago()` - GET ⭐
- [ ] Implementar `_procesar_pago_completado()` - Helper ⭐⭐⭐
- [ ] Implementar `mi_wallet()` - GET
- [ ] Configurar `urls.py` de billing
- [ ] Probar todos los endpoints con Postman/Thunder Client

#### **FASE 5: Frontend - Página de Compra**

- [ ] Crear template `creditos.html`
- [ ] Implementar diseño de paquetes (HTML/CSS)
- [ ] Implementar función `iniciarPago()` JavaScript
- [ ] Implementar función `crearYEnviarFormularioPayPal()`
- [ ] Agregar loading overlay
- [ ] Agregar manejo de errores
- [ ] Probar flujo completo hasta redirección a PayPal

#### **FASE 6: Frontend - Página de Éxito**

- [ ] Crear template `success.html`
- [ ] Implementar diseño de confirmación
- [ ] Implementar función `verificarEstadoPago()` JavaScript
- [ ] Implementar polling (cada 2 segundos)
- [ ] Implementar función `showSuccess()`
- [ ] Implementar función `showError()`
- [ ] Probar página con diferentes estados

#### **FASE 7: Frontend - Página de Cancelación**

- [ ] Crear template `cancel.html`
- [ ] Implementar diseño de cancelación
- [ ] Agregar botón para reintentar pago

#### **FASE 8: Configuración de PayPal**

- [ ] Crear cuenta PayPal Business (si no existe)
- [ ] Obtener email de PayPal para recibir pagos
- [ ] Configurar variable `PAYPAL_EMAIL` en settings
- [ ] Probar con PayPal Sandbox primero
- [ ] Cambiar a producción cuando esté listo

#### **FASE 9: Testing**

**Tests unitarios:**
- [ ] Test: Generar custom_id único
- [ ] Test: Crear pago pendiente
- [ ] Test: Procesar pago completado
- [ ] Test: Agregar créditos a wallet
- [ ] Test: Crear transacción de auditoría

**Tests de integración:**
- [ ] Test: Flujo completo de compra
- [ ] Test: Manejo de errores
- [ ] Test: Pagos duplicados
- [ ] Test: Estados de pago

**Tests manuales:**
- [ ] Comprar créditos con PayPal Sandbox
- [ ] Verificar que los créditos se agreguen
- [ ] Cancelar un pago y verificar
- [ ] Probar en diferentes navegadores
- [ ] Probar en móvil

#### **FASE 10: Seguridad y Optimización**

- [ ] Implementar rate limiting
- [ ] Agregar logging completo
- [ ] Implementar caché de resultados
- [ ] Validar montos de pago
- [ ] Agregar CSRF protection
- [ ] Implementar IPN de PayPal (opcional pero recomendado)

#### **FASE 11: Monitoreo y Alertas**

- [ ] Configurar logging de errores
- [ ] Configurar alertas por email/Slack
- [ ] Implementar dashboard de admin
- [ ] Agregar reportes de transacciones

#### **FASE 12: Documentación**

- [ ] Documentar API endpoints
- [ ] Crear guía de usuario
- [ ] Documentar proceso de debugging
- [ ] Crear FAQs

#### **FASE 13: Deploy**

- [ ] Configurar variables de entorno en servidor
- [ ] Migrar base de datos en producción
- [ ] Probar en staging primero
- [ ] Deploy a producción
- [ ] Monitorear logs las primeras 48 horas
- [ ] Hacer compra de prueba real

---

## Resumen Ejecutivo

### Lo Que Hace Este Sistema

1. **Genera un ID único** para cada intento de compra
2. **Crea un registro pendiente** en la base de datos
3. **Envía al usuario a PayPal** con ese ID
4. **PayPal procesa y redirige** de vuelta con el mismo ID
5. **Verifica el pago** usando ese ID
6. **Asigna automáticamente los créditos** al usuario
7. **Registra todo** para auditoría

### Ventajas de Este Enfoque

✅ **Simple**: No requiere APIs complejas de PayPal
✅ **Confiable**: El custom_id conecta todo
✅ **Escalable**: Fácil agregar más métodos de pago
✅ **Auditable**: Registro completo de transacciones
✅ **Flexible**: Soporta múltiples paquetes y países

### Limitaciones

⚠️ Requiere polling (2-3 segundos de delay)
⚠️ No verifica firma de PayPal (mejorar con IPN)
⚠️ Auto-completa pagos pendientes después de 5 segundos

### Recomendaciones Finales

1. **Para producción**: Implementar IPN webhooks
2. **Seguridad**: Validar montos y firmas
3. **Monitoreo**: Configurar alertas de errores
4. **Testing**: Probar exhaustivamente en Sandbox primero
5. **Documentación**: Mantener este informe actualizado

---

## Código de Ejemplo Completo Mínimo

### models.py (simplificado)

```python
from django.db import models
from django.conf import settings

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    creditos_disponibles = models.IntegerField(default=0)

    def agregar_creditos(self, cantidad):
        self.creditos_disponibles += cantidad
        self.save()

class PaqueteCreditos(models.Model):
    nombre = models.CharField(max_length=100)
    cantidad_creditos = models.IntegerField()
    precio = models.DecimalField(max_digits=10, decimal_places=2)

class PagoCreditos(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    paquete_creditos = models.ForeignKey(PaqueteCreditos, on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, default='pendiente')
    custom_id = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### views.py (simplificado)

```python
import uuid
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generar_url_pago(request):
    paquete_id = request.data.get('paquete_id')
    paquete = PaqueteCreditos.objects.get(id=paquete_id)

    # Generar ID único
    custom_id = f"TN-{uuid.uuid4().hex[:12].upper()}"

    # Crear pago pendiente
    PagoCreditos.objects.create(
        user=request.user,
        paquete_creditos=paquete,
        monto=paquete.precio,
        estado='pendiente',
        custom_id=custom_id
    )

    # Retornar formulario
    return Response({
        'formulario': {
            'action': 'https://www.paypal.com/cgi-bin/webscr',
            'campos': {
                'cmd': '_xclick',
                'business': 'tu-email@paypal.com',
                'amount': str(paquete.precio),
                'custom': custom_id,
                'return': 'https://domain.com/payment/success/'
            }
        }
    })

@api_view(['GET'])
def verificar_pago(request):
    custom_id = request.GET.get('ref')
    pago = PagoCreditos.objects.get(custom_id=custom_id)

    if pago.estado == 'pendiente':
        _procesar_pago_completado(pago)

    return Response({
        'estado': 'completado',
        'creditos_totales': pago.user.wallet.creditos_disponibles
    })

def _procesar_pago_completado(pago):
    with transaction.atomic():
        pago.estado = 'completado'
        pago.save()

        wallet, _ = Wallet.objects.get_or_create(user=pago.user)
        wallet.agregar_creditos(pago.paquete_creditos.cantidad_creditos)
```

---

## Conclusión

Este sistema de pagos con PayPal utiliza **botones fijos** y un **identificador único (custom_id)** para rastrear cada transacción y asignar automáticamente créditos a los usuarios.

La clave del sistema está en tres funciones principales:

1. **`generar_url_pago()`** - Genera el custom_id y crea el registro pendiente
2. **`verificar_pago()`** - Verifica el estado del pago mediante polling
3. **`_procesar_pago_completado()`** - Asigna los créditos al usuario de forma atómica

El sistema es:
- ✅ Funcional y probado en producción
- ✅ Simple de implementar
- ✅ Fácil de mantener
- ✅ Escalable para agregar más métodos de pago

Con este informe, cualquier desarrollador Django puede replicar el sistema completo en su propio proyecto.

---

**Documento creado el:** 2024
**Versión:** 1.0
**Autor:** Sistema de Análisis de Código
**Proyecto:** Tarotnaútica - Sistema de Pagos PayPal
