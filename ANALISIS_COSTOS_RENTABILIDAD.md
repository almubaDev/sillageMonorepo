# 💰 Análisis de Costos Operativos - Sillage App

**Fecha:** 27 de Octubre, 2025

---

## 📊 COSTOS POR CONSULTA

### Costo Total por Consulta

| Escenario | Costo |
|-----------|-------|
| **Dentro de Free Tier (0-10K/mes)** | **$0.00 USD** |
| **Fuera de Free Tier (10K+/mes)** | **$0.008 USD** |

---

## 🔍 Desglose de Costos por API

### 1. OpenWeather API
- **Llamadas por consulta:** 1
- **Free tier:** 1,000/día (30,000/mes)
- **Costo en free tier:** $0.00
- **Costo pagando:** $0.0000037 USD

### 2. Google Gemini AI
- **Llamadas por consulta:** 1
- **Modelo:** gemini-2.0-flash
- **Tokens por consulta:** ~1,000 tokens (700 input + 300 output)
- **Free tier:** 1,500 requests/día (45,000/mes)
- **Costo en free tier:** $0.00
- **Costo pagando:** $0.003 USD

### 3. Google Maps Geocoding API ⚠️
- **Llamadas por consulta:** 1-2 (reverse geocoding al seleccionar ubicación)
- **Ubicación en código:** `sillage-mobile/src/screens/Recommend/steps/Step8Location.web.tsx`
- **Uso:** Convertir coordenadas → dirección cuando usuario selecciona lugar en el mapa
- **Free tier:** 10,000 requests/mes (desde marzo 2025)
- **Costo en free tier:** $0.00
- **Costo pagando:** $0.005 USD por request

---

## 💵 Análisis de Paquetes - PLAN 1 (Precios Originales)

| Paquete | Consultas | Precio | Costo APIs | **Ganancia Bruta** |
|---------|-----------|--------|------------|-------------------|
| Básico | 5 | $4.99 | $0.04 | $4.95 (99.2%) |
| Popular | 15 | $12.99 | $0.12 | $12.87 (99.1%) |
| Premium | 30 | $19.99 | $0.24 | $19.75 (98.8%) |

**Costo APIs por consulta fuera de free tier:** $0.008 USD
- OpenWeather: $0.0000037
- Gemini: $0.003
- Google Maps: $0.005

---

## 💳 Costos PayPal (3.4% + comisión fija) - PLAN 1

| Paquete | Precio | Comisión PayPal | Costo APIs | **Ganancia Neta** | **Margen Neto** |
|---------|--------|----------------|------------|-------------------|-----------------|
| Básico | $4.99 | $0.47 | $0.04 | **$4.48** | **89.8%** |
| Popular | $12.99 | $0.87 | $0.12 | **$12.00** | **92.4%** |
| Premium | $19.99 | $1.36 | $0.24 | **$18.39** | **92.0%** |

---

## 📈 Proyección de Costos por Volumen

| Consultas/Mes | Costo APIs | Estado |
|---------------|------------|--------|
| 100 | $0.00 | Free tier |
| 1,000 | $0.00 | Free tier |
| **10,000** | **$0.00** | **Límite free tier (Google Maps)** |
| 30,000 | $150.00 | Pagando |
| 50,000 | $250.18 | Pagando |
| 100,000 | $500.37 | Pagando |

**Límite crítico:** 10,000 consultas/mes (Google Maps Geocoding es el límite más restrictivo)

---

## ✅ Resumen

- **Costo operativo por consulta:** $0.008 USD (fuera de free tier)
- **Principal costo:** PayPal (3.4%) > Google Maps ($0.005) > Gemini ($0.003)
- **Margen neto:** ~90-92% después de PayPal
- **Free tier válido hasta:** 10,000 consultas/mes (límite de Google Maps)

---

## 📋 PLAN 2 - Precios Reducidos

### Nuevos Precios Propuestos

| Paquete | Consultas | Precio Anterior | **Precio Nuevo** | Reducción |
|---------|-----------|----------------|-----------------|-----------|
| Básico | 5 | $4.99 | **$2.99** | -40% |
| Popular | 15 | $12.99 | **$6.99** | -46% |
| Premium | 30 | $19.99 | **$9.99** | -50% |

---

### Análisis de Costos y Beneficios - Plan 2

#### Costo por Consulta (Precio Nuevo)

| Paquete | Consultas | Precio | Precio/Consulta |
|---------|-----------|--------|----------------|
| Básico | 5 | $2.99 | **$0.60** |
| Popular | 15 | $6.99 | **$0.47** |
| Premium | 30 | $9.99 | **$0.33** |

---

#### Ganancia Bruta (Sin PayPal)

| Paquete | Precio | Costo APIs | **Ganancia Bruta** | **Margen Bruto** |
|---------|--------|------------|-------------------|-----------------|
| Básico | $2.99 | $0.04 | **$2.95** | **98.7%** |
| Popular | $6.99 | $0.12 | **$6.87** | **98.3%** |
| Premium | $9.99 | $0.24 | **$9.75** | **97.6%** |

**Costo APIs por consulta:** $0.008 USD (fuera de free tier)

---

#### Ganancia Neta (Con PayPal 3.4%)

| Paquete | Precio | Comisión PayPal | Costo APIs | **Ganancia Neta** | **Margen Neto** |
|---------|--------|----------------|------------|-------------------|-----------------|
| Básico | $2.99 | $0.30 | $0.04 | **$2.65** | **88.6%** |
| Popular | $6.99 | $0.54 | $0.12 | **$6.33** | **90.6%** |
| Premium | $9.99 | $0.72 | $0.24 | **$9.03** | **90.4%** |

**Nota:** Comisión PayPal calculada como 3.4% del precio + $0.30 aproximado de comisión fija.

---

### Comparación Plan 1 vs Plan 2

| Paquete | Plan 1 (Ganancia Neta) | Plan 2 (Ganancia Neta) | **Diferencia** |
|---------|------------------------|------------------------|----------------|
| Básico | $4.48 | $2.65 | **-$1.83** (-41%) |
| Popular | $12.00 | $6.33 | **-$5.67** (-47%) |
| Premium | $18.39 | $9.03 | **-$9.36** (-51%) |

---

### Resumen Plan 2

- **Precio por consulta:** $0.33 - $0.60 USD
- **Costo operativo por consulta:** $0.008 USD
- **Margen neto:** 88.6% - 90.6%
- **Ganancia por paquete:** $2.65 - $9.03 USD
- **Reducción de precio:** 40-50% vs Plan 1
