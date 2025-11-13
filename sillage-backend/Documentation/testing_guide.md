# 🧪 Guía Completa de Testing - Sillage Backend

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Estructura de Tests](#estructura-de-tests)
4. [Catálogo de Tests](#catálogo-de-tests)
5. [Coverage Report](#coverage-report)
6. [Ejecución de Tests](#ejecución-de-tests)
7. [Fixtures y Utilidades](#fixtures-y-utilidades)
8. [Estrategias de Mocking](#estrategias-de-mocking)
9. [Guía para Desarrolladores](#guía-para-desarrolladores)
10. [Troubleshooting](#troubleshooting)

---

## 📊 Resumen Ejecutivo

### Estado Actual

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Tests Totales** | 140 | ✅ |
| **Tests Pasando** | 140/140 (100%) | ✅ |
| **Coverage Total** | 83.55% | ✅ |
| **Tiempo Ejecución** | ~28 segundos | ✅ |
| **Meta Coverage** | 40% | ✅ Superado (+108.9%) |

### Módulos con 100% Coverage

- ✅ Core (config, security, deps)
- ✅ Models (user, perfume, recommendation, subscription)
- ✅ Schemas (user, perfume)
- ✅ Services (gemini, cache)
- ✅ i18n (Spanish & English)

---

## 🔧 Configuración del Entorno

### 1. Dependencias Requeridas

```bash
# Testing framework
pip install pytest==8.4.2
pip install pytest-asyncio==1.2.0
pip install pytest-cov==7.0.0

# HTTP client for testing
pip install httpx

# Database (in-memory para tests)
pip install aiosqlite
```

### 2. Archivo pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
addopts =
    --verbose
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-report=xml
    --cov-fail-under=40
filterwarnings =
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
```

### 3. Estructura de Directorios

```
sillage-backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── utils/
├── tests/
│   ├── conftest.py              # Fixtures globales
│   ├── test_auth_simple.py      # Tests de autenticación
│   ├── test_cache.py            # Tests de cache Redis
│   ├── test_deps.py             # Tests de dependencias
│   ├── test_i18n.py             # Tests de i18n
│   ├── test_perfumes_simple.py  # Tests de perfumes
│   ├── test_recommendations_simple.py
│   ├── test_security.py         # Tests de seguridad
│   ├── test_services_gemini.py  # Tests de Gemini AI
│   ├── test_services_weather.py # Tests de Weather API
│   └── test_services_recommendation_engine.py
└── pytest.ini
```

---

## 📁 Estructura de Tests

### Convenciones de Nomenclatura

```python
# Archivos: test_<modulo>.py
test_auth_simple.py
test_security.py

# Funciones: test_<accion>_<contexto>
def test_create_access_token()
def test_login_wrong_password()
def test_get_current_user_invalid_token()

# Clases (si se usan): Test<Modulo>
class TestAuthentication:
    def test_login_success(self):
        pass
```

### Organización por Capas

```
tests/
├── API Layer (endpoints)
│   ├── test_auth_simple.py
│   ├── test_perfumes_simple.py
│   └── test_recommendations_simple.py
│
├── Business Logic (services)
│   ├── test_services_gemini.py
│   ├── test_services_weather.py
│   └── test_services_recommendation_engine.py
│
├── Infrastructure
│   ├── test_cache.py
│   ├── test_deps.py
│   └── test_security.py
│
└── i18n & Configuration
    └── test_i18n.py
```

---

## 📚 Catálogo de Tests

### 1. Authentication & Authorization (test_auth_simple.py)

**Total: 5 tests**

```python
# Registro de usuarios
test_register_user
    ✓ Registra nuevo usuario con email, nombre y password
    ✓ Retorna token JWT y datos del usuario
    ✓ Valida formato de email y longitud de password

# Login de usuarios
test_login_success
    ✓ Login con credenciales correctas
    ✓ Retorna token de acceso válido

test_login_wrong_password
    ✓ Verifica rechazo con password incorrecta
    ✓ Status code 401

# Gestión de sesión
test_get_current_user
    ✓ Obtiene usuario actual con token válido
    ✓ Verifica campos del usuario autenticado

test_get_current_user_without_token
    ✓ Rechaza acceso sin token
    ✓ Status code 401
```

**Cobertura**: 51% de `auth.py`

**Endpoints testeados**:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`

---

### 2. Security & Cryptography (test_security.py)

**Total: 23 tests**

#### JWT Token Management (8 tests)

```python
test_create_access_token
    ✓ Crea token JWT válido con subject
    ✓ Include campos exp, sub, type

test_create_access_token_with_custom_expiry
    ✓ Permite expiración personalizada

test_create_access_token_with_integer_subject
    ✓ Convierte subject numérico a string

test_verify_token_valid
    ✓ Decodifica y valida token correcto

test_verify_token_invalid
    ✓ Rechaza tokens malformados

test_verify_token_wrong_secret
    ✓ Rechaza tokens firmados con otra clave

test_verify_token_expired
    ✓ Rechaza tokens expirados

test_verify_token_malformed
    ✓ Maneja tokens corruptos sin crashes
```

#### Password Hashing (15 tests)

```python
test_get_password_hash
    ✓ Hashea password con bcrypt
    ✓ Formato $2b$ correcto

test_get_password_hash_different_each_time
    ✓ Mismo password genera hashes diferentes (salt único)

test_get_password_hash_long_password
    ✓ Maneja passwords >72 bytes (límite bcrypt)

test_get_password_hash_unicode
    ✓ Soporte para caracteres Unicode (emoji, kanji, ñ)

test_verify_password_correct
    ✓ Verifica password correcta

test_verify_password_incorrect
    ✓ Rechaza password incorrecta

test_verify_password_case_sensitive
    ✓ Verifica sensibilidad a mayúsculas

test_verify_password_with_spaces
    ✓ Maneja espacios en passwords

test_verify_password_special_characters
    ✓ Soporte para caracteres especiales (!@#$%)

test_password_hash_roundtrip
    ✓ Test de ciclo completo: hash -> verify

test_verify_password_with_bytes_hash
    ✓ Acepta hash como bytes o string

test_password_hash_empty_password
    ✓ Maneja password vacía sin error
```

**Cobertura**: 100% de `security.py`

**Funciones testeadas**:
- `create_access_token()`
- `verify_token()`
- `get_password_hash()`
- `verify_password()`

---

### 3. Redis Cache (test_cache.py)

**Total: 22 tests**

#### Connection Management (3 tests)

```python
test_cache_connect
    ✓ Conecta a Redis mock
    ✓ Inicializa cliente correctamente

test_cache_disconnect
    ✓ Cierra conexión limpiamente

test_cache_disconnect_without_connection
    ✓ Maneja desconexión sin conexión previa
```

#### GET Operations (6 tests)

```python
test_cache_get_json_value
    ✓ Obtiene y deserializa JSON

test_cache_get_string_value
    ✓ Obtiene string plano

test_cache_get_none
    ✓ Retorna None para clave inexistente

test_cache_get_without_connection
    ✓ Maneja operación sin conexión

test_cache_get_invalid_json
    ✓ Retorna valor raw si JSON inválido

test_cache_get_multiple_types
    ✓ Maneja dict, list, string, int, bool, null
```

#### SET Operations (6 tests)

```python
test_cache_set_dict_value
    ✓ Serializa y guarda diccionario
    ✓ Respeta TTL personalizado

test_cache_set_string_value
    ✓ Guarda string directamente

test_cache_set_default_expire
    ✓ TTL por defecto = 3600 segundos

test_cache_set_without_connection
    ✓ Retorna False sin conexión

test_cache_set_list_value
    ✓ Serializa listas complejas

test_cache_set_complex_nested_data
    ✓ Maneja estructuras anidadas profundas
```

#### DELETE & EXISTS (7 tests)

```python
test_cache_delete_existing_key
    ✓ Elimina clave y retorna True

test_cache_delete_nonexistent_key
    ✓ Retorna False si clave no existe

test_cache_delete_without_connection
    ✓ Maneja delete sin conexión

test_cache_exists_true/false
    ✓ Verifica existencia de clave

test_cache_roundtrip
    ✓ Ciclo completo: set -> get -> exists -> delete
```

**Cobertura**: 100% de `cache.py`

**Clase testeada**: `RedisCache`

---

### 4. API Dependencies (test_deps.py)

**Total: 19 tests**

#### get_current_user (9 tests)

```python
test_get_current_user_valid_token
    ✓ Obtiene usuario con token válido
    ✓ Valida campos del usuario

test_get_current_user_invalid_token
    ✓ Rechaza token inválido (401)

test_get_current_user_expired_token
    ✓ Rechaza token expirado (401)

test_get_current_user_nonexistent_user
    ✓ Rechaza token de usuario eliminado

test_get_current_user_inactive_user
    ✓ Rechaza usuario inactivo (400)

test_get_current_user_malformed_token
    ✓ Maneja tokens malformados

test_get_current_user_token_without_sub
    ✓ Rechaza token sin claim 'sub'

test_get_current_user_with_string_id
    ✓ Acepta user_id como string

test_get_current_user_with_integer_id
    ✓ Acepta user_id como integer
```

#### get_current_active_user (2 tests)

```python
test_get_current_active_user_success
    ✓ Permite usuario activo

test_get_current_active_user_inactive
    ✓ Rechaza usuario inactivo (400)
```

#### get_current_subscribed_user (6 tests)

```python
test_get_current_subscribed_user_success
    ✓ Permite usuario con suscripción activa

test_get_current_subscribed_user_no_subscription
    ✓ Rechaza usuario sin suscripción (402)

test_get_current_subscribed_user_no_queries
    ✓ Rechaza si consultas_restantes = 0 (429)

test_get_current_subscribed_user_negative_queries
    ✓ Rechaza si consultas_restantes < 0

test_get_current_subscribed_user_one_query_left
    ✓ Permite con 1 consulta restante

test_dependency_chain
    ✓ Verifica cadena completa de dependencias
```

#### Utilities (2 tests)

```python
test_get_db_dependency
    ✓ Genera AsyncSession correctamente

test_oauth2_scheme_token_url
    ✓ Verifica URL del OAuth2 scheme
```

**Cobertura**: 100% de `deps.py`

**Dependencias testeadas**:
- `get_db()`
- `get_current_user()`
- `get_current_active_user()`
- `get_current_subscribed_user()`

---

### 5. Internationalization (test_i18n.py)

**Total: 23 tests**

#### Language Loader (8 tests)

```python
test_language_loader_initialization
    ✓ Inicializa con cache vacío

test_get_language_module_spanish
    ✓ Carga módulo español correctamente

test_get_language_module_english
    ✓ Carga módulo inglés correctamente

test_get_language_module_caching
    ✓ Cache funciona (mismo objeto en llamadas repetidas)

test_get_language_module_unsupported_language
    ✓ Fallback a idioma por defecto

test_multiple_languages_loaded
    ✓ Carga múltiples idiomas simultáneamente

test_language_loader_global_instance
    ✓ Verifica instancia global

test_cache_persistence
    ✓ Cache persiste entre llamadas
```

#### Translations - Seasons (3 tests)

```python
test_get_seasons_spanish
    ✓ Estaciones en español (hemisferio sur)
    ✓ Enero = verano, Julio = invierno

test_get_seasons_english
    ✓ Estaciones en inglés

test_get_seasons_all_months
    ✓ Todos los 12 meses tienen estación
```

#### Translations - Time of Day (2 tests)

```python
test_get_time_of_day_spanish
    ✓ mañana, tarde, noche

test_get_time_of_day_english
    ✓ morning, afternoon, night
```

#### Translations - Labels (2 tests)

```python
test_get_perfume_labels_spanish
    ✓ perfumista, acordes, notas

test_get_perfume_labels_english
    ✓ perfumer, accords, notes
```

#### Prompt Templates (2 tests)

```python
test_get_prompt_template_spanish
    ✓ Template con placeholders correcto

test_get_prompt_template_english
    ✓ Template en inglés
```

#### Configuration (6 tests)

```python
test_supported_languages_config
    ✓ Lista de idiomas soportados

test_default_language_config
    ✓ Idioma por defecto = español

test_fallback_to_default_language
    ✓ Fallback para idiomas no soportados

test_prompt_template_formatting
    ✓ Template acepta todos los placeholders

test_seasons_southern_hemisphere
    ✓ Estaciones correctas para hemisferio sur

test_language_module_structure
    ✓ Estructura consistente entre idiomas
```

**Cobertura**:
- 100% de `languages/es.py`
- 100% de `languages/en.py`
- 88% de `loader.py`

**Clases testeadas**:
- `LanguageLoader`
- Módulos de idioma (ES, EN)

---

### 6. Gemini AI Service (test_services_gemini.py)

**Total: 11 tests**

#### build_prompt (7 tests)

```python
test_build_prompt_spanish
    ✓ Genera prompt en español
    ✓ Incluye contexto completo del evento

test_build_prompt_english
    ✓ Genera prompt en inglés

test_build_prompt_morning
    ✓ Identifica "mañana" para hora < 12

test_build_prompt_afternoon
    ✓ Identifica "tarde" para 12 <= hora < 19

test_build_prompt_night
    ✓ Identifica "noche" para hora >= 19

test_build_prompt_without_optional_fields
    ✓ Maneja perfumes sin perfumista/acordes/notas

test_build_prompt_seasons
    ✓ Identifica estaciones correctamente
    ✓ Hemisferio sur: Enero=verano, Julio=invierno
```

#### get_ai_recommendation (4 tests)

```python
test_get_ai_recommendation_success
    ✓ Obtiene respuesta exitosa de Gemini
    ✓ Parsea JSON correctamente

test_get_ai_recommendation_empty_response
    ✓ Maneja respuesta sin candidatos
    ✓ Retorna mensaje de error

test_get_ai_recommendation_network_error
    ✓ Maneja error de red
    ✓ Retorna mensaje de error sin crash

test_get_ai_recommendation_http_error
    ✓ Maneja HTTP 500/400
    ✓ Retorna mensaje de error
```

**Cobertura**: 100% de `gemini.py`

**Funciones testeadas**:
- `build_prompt()`
- `get_ai_recommendation()`

**APIs mockeadas**:
- Gemini API (generativelanguage.googleapis.com)

---

### 7. Weather Service (test_services_weather.py)

**Total: 8 tests**

```python
test_get_weather_data_success
    ✓ Obtiene datos de clima exitosamente
    ✓ Retorna descripción, temperatura, humedad

test_get_weather_data_closest_time
    ✓ Selecciona bloque de tiempo más cercano
    ✓ Algoritmo de distancia temporal funciona

test_get_weather_data_empty_list
    ✓ Maneja respuesta sin datos
    ✓ Retorna valores por defecto

test_get_weather_data_network_error
    ✓ Maneja error de conexión
    ✓ Fallback a valores por defecto

test_get_weather_data_http_error
    ✓ Maneja HTTP errors
    ✓ Fallback a valores por defecto

test_get_weather_data_invalid_json
    ✓ Maneja JSON malformado

test_get_weather_data_missing_fields
    ✓ Maneja respuesta con campos faltantes

test_get_weather_data_params
    ✓ Verifica parámetros correctos a API
    ✓ lat, lon, units=metric, lang=es
```

**Cobertura**: 95% de `weather.py`

**Función testeada**: `get_weather_data()`

**APIs mockeadas**:
- OpenWeather API (api.openweathermap.org)

---

### 8. Recommendation Engine (test_services_recommendation_engine.py)

**Total: 16 tests**

#### extract_perfume_name (11 tests)

```python
test_extract_perfume_name_first_line
    ✓ Extrae nombre de primera línea

test_extract_perfume_name_with_asterisks
    ✓ Limpia markdown (**nombre**)

test_extract_perfume_name_with_special_chars
    ✓ Limpia caracteres especiales (###, ---, :)

test_extract_perfume_name_case_insensitive
    ✓ Búsqueda insensible a mayúsculas

test_extract_perfume_name_partial_match
    ✓ Encuentra nombre completo en texto

test_extract_perfume_name_in_body
    ✓ Busca en cuerpo si no está en primera línea

test_extract_perfume_name_with_spaces
    ✓ Ignora espacios extras en comparación

test_extract_perfume_name_not_found
    ✓ Retorna None si no encuentra perfume

test_extract_perfume_name_empty_response
    ✓ Maneja respuesta vacía

test_extract_perfume_name_whitespace_only
    ✓ Maneja respuesta con solo espacios

test_extract_perfume_name_multiple_perfumes
    ✓ Retorna primer perfume encontrado
```

#### generate_recommendation (5 tests)

```python
test_generate_recommendation_success
    ✓ Genera recomendación completa
    ✓ Obtiene clima, construye prompt, llama IA
    ✓ Extrae perfume y guarda en BD

test_generate_recommendation_weather_failure
    ✓ Usa valores por defecto si clima falla

test_generate_recommendation_perfume_not_found
    ✓ Maneja caso donde IA no menciona perfume válido
    ✓ perfume_recomendado_id = None

test_generate_recommendation_english
    ✓ Genera recomendación en inglés

test_generate_recommendation_stores_prompt
    ✓ Guarda prompt y respuesta IA en BD
```

**Cobertura**: 97% de `recommendation_engine.py`

**Funciones testeadas**:
- `extract_perfume_name()`
- `generate_recommendation()`

---

### 9. Perfume Management (test_perfumes_simple.py)

**Total: 8 tests**

```python
test_create_perfume
    ✓ Crea perfume con notas dict
    ✓ Valida estructura JSON

test_get_my_collection
    ✓ Lista perfumes del usuario

test_search_perfumes
    ✓ Búsqueda general de perfumes

test_add_to_collection
    ✓ Añade perfume a colección

test_remove_from_collection
    ✓ Elimina perfume de colección

test_create_perfume_without_auth
    ✓ Rechaza creación sin autenticación (401)

test_search_by_marca
    ✓ Búsqueda por marca

test_search_by_acorde
    ✓ Búsqueda por acorde
```

**Cobertura**: 59% de `perfumes.py`

**Endpoints testeados**:
- `POST /api/v1/perfumes/`
- `GET /api/v1/perfumes/collection`
- `GET /api/v1/perfumes/search`
- `POST /api/v1/perfumes/collection/{id}`
- `DELETE /api/v1/perfumes/collection/{id}`

---

### 10. Recommendations (test_recommendations_simple.py)

**Total: 5 tests**

```python
test_create_recommendation_success
    ✓ Crea recomendación completa
    ✓ Mock de generate_recommendation

test_get_recommendation_history
    ✓ Lista historial de recomendaciones

test_get_recommendation_by_id
    ✓ Obtiene recomendación específica

test_get_nonexistent_recommendation
    ✓ Retorna 404 para ID inexistente

test_create_recommendation_without_auth
    ✓ Rechaza sin autenticación (401)
```

**Cobertura**: 36% de `recommendations.py`

**Endpoints testeados**:
- `POST /api/v1/recommendations/`
- `GET /api/v1/recommendations/`
- `GET /api/v1/recommendations/{id}`

---

## 📊 Coverage Report

### Coverage por Módulo

```
Name                                      Stmts   Miss  Cover   Missing
-----------------------------------------------------------------------
app/__init__.py                               0      0   100%
app/api/__init__.py                           0      0   100%
app/api/deps.py                              41      0   100%   ✅
app/api/v1/__init__.py                        0      0   100%
app/api/v1/api.py                             7      0   100%
app/api/v1/endpoints/__init__.py              0      0   100%
app/api/v1/endpoints/auth.py                 49     24    51%   🟡
app/api/v1/endpoints/perfumes.py             69     28    59%   🟡
app/api/v1/endpoints/recommendations.py      61     39    36%   🟠
app/api/v1/endpoints/subscriptions.py         0      0   100%   ⚪ (excluido)
app/api/v1/endpoints/users.py                24     10    58%   🟡
app/core/__init__.py                          0      0   100%
app/core/config.py                           28      0   100%   ✅
app/core/database.py                         12      4    67%   🟡
app/core/security.py                         31      0   100%   ✅
app/i18n/__init__.py                          0      0   100%
app/i18n/config.py                           16      1    94%   🟢
app/i18n/languages/__init__.py                0      0   100%
app/i18n/languages/en.py                      4      0   100%   ✅
app/i18n/languages/es.py                      4      0   100%   ✅
app/i18n/loader.py                           32      4    88%   🟢
app/main.py                                  23      8    65%   🟡
app/migrations/__init__.py                    0      0   100%
app/models/__init__.py                        6      0   100%
app/models/perfume.py                        17      0   100%   ✅
app/models/recommendation.py                 26      0   100%   ✅
app/models/subscription.py                   34      0   100%   ✅
app/models/user.py                           18      0   100%   ✅
app/schemas/__init__.py                       0      0   100%
app/schemas/perfume.py                       32      0   100%   ✅
app/schemas/recommendation.py                60      5    92%   🟢
app/schemas/subscription.py                   0      0   100%
app/schemas/user.py                          33      0   100%   ✅
app/services/__init__.py                      0      0   100%
app/services/flow.py                          0      0   100%   ⚪ (excluido)
app/services/gemini.py                       37      0   100%   ✅
app/services/recommendation_engine.py        37      1    97%   🟢
app/services/weather.py                      22      1    95%   🟢
app/utils/__init__.py                         0      0   100%
app/utils/cache.py                           37      0   100%   ✅
-----------------------------------------------------------------------
TOTAL                                       760    125    84%   ✅
```

### Leyenda

- ✅ **100% Coverage** - Completamente testeado
- 🟢 **>90% Coverage** - Excelente cobertura
- 🟡 **50-90% Coverage** - Buena cobertura
- 🟠 **<50% Coverage** - Requiere más tests
- ⚪ **Excluido** - No incluido en testing (por diseño)

### Coverage por Capa

| Capa | Statements | Coverage |
|------|-----------|----------|
| **Models** | 101 | 100% ✅ |
| **Schemas** | 125 | 96% 🟢 |
| **Core** | 71 | 86% 🟢 |
| **Services** | 96 | 98% 🟢 |
| **Utils** | 37 | 100% ✅ |
| **API Endpoints** | 203 | 52% 🟡 |
| **i18n** | 56 | 96% 🟢 |

---

## 🚀 Ejecución de Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests
pytest

# Ejecutar con output detallado
pytest -v

# Ejecutar tests específicos
pytest tests/test_security.py
pytest tests/test_security.py::test_create_access_token

# Ejecutar por patrón
pytest -k "security"
pytest -k "test_create or test_login"

# Modo quiet (solo sumario)
pytest -q
```

### Coverage

```bash
# Coverage completo con reporte HTML
pytest --cov=app --cov-report=html

# Coverage con líneas faltantes
pytest --cov=app --cov-report=term-missing

# Coverage para módulo específico
pytest --cov=app.services --cov-report=term

# Abrir reporte HTML
# Windows
start htmlcov/index.html
# Linux/Mac
open htmlcov/index.html
```

### Ejecución Paralela

```bash
# Instalar plugin
pip install pytest-xdist

# Ejecutar en paralelo (4 workers)
pytest -n 4

# Auto-detectar CPUs
pytest -n auto
```

### Debugging

```bash
# Modo verbose con traceback completo
pytest -vv --tb=long

# Detener en primer fallo
pytest -x

# Modo debug interactivo
pytest --pdb

# Imprimir outputs (print statements)
pytest -s
```

### Filtrado

```bash
# Solo tests marcados como "slow"
pytest -m slow

# Excluir tests marcados como "slow"
pytest -m "not slow"

# Solo tests que fallaron la última vez
pytest --lf  # last failed

# Ejecutar fallidos primero, luego el resto
pytest --ff  # failed first
```

---

## 🔧 Fixtures y Utilidades

### Archivo: conftest.py

```python
@pytest.fixture
async def db_session() -> AsyncSession:
    """
    Sesión de base de datos en memoria (SQLite)

    Uso:
        async def test_example(db_session):
            user = User(email="test@example.com")
            db_session.add(user)
            await db_session.commit()
    """

@pytest.fixture
async def test_user(db_session: AsyncSession):
    """
    Usuario de prueba con:
    - email: test@example.com
    - suscrito: True
    - consultas_restantes: 10

    Uso:
        async def test_example(test_user):
            assert test_user.email == "test@example.com"
    """

@pytest.fixture
async def test_perfume(db_session: AsyncSession, test_user):
    """
    Perfume de prueba en la colección del usuario

    Datos:
    - nombre: "Test Perfume"
    - marca: "Test Brand"
    - notas: {"salida": [...], "corazon": [...], "fondo": [...]}
    """

@pytest.fixture
async def auth_headers(test_user):
    """
    Headers HTTP con token JWT válido

    Uso:
        async def test_endpoint(client, auth_headers):
            response = await client.get("/api/v1/users/me", headers=auth_headers)

    Retorna:
        {"Authorization": "Bearer <jwt_token>"}
    """

@pytest.fixture
async def client():
    """
    Cliente HTTP async para testing de endpoints

    Uso:
        async def test_endpoint(client):
            response = await client.post("/api/v1/auth/login", json={...})
            assert response.status_code == 200
    """
```

### Fixtures Personalizadas

```python
# Crear fixture local en un archivo de test
@pytest.fixture
def sample_perfumes():
    return [
        Perfume(id=1, nombre="Dior Sauvage", marca="Dior"),
        Perfume(id=2, nombre="Chanel No 5", marca="Chanel")
    ]

# Usar la fixture
def test_something(sample_perfumes):
    assert len(sample_perfumes) == 2
```

---

## 🎭 Estrategias de Mocking

### 1. Mocking HTTP Clients (httpx)

```python
from unittest.mock import AsyncMock, Mock, patch

async def test_api_call():
    with patch('httpx.AsyncClient') as mock_client:
        # Crear mock de respuesta
        mock_response_obj = Mock()
        mock_response_obj.json.return_value = {"data": "value"}
        mock_response_obj.raise_for_status = Mock()

        # Hacer que post retorne el mock
        mock_post = AsyncMock(return_value=mock_response_obj)
        mock_client.return_value.__aenter__.return_value.post = mock_post

        # Código que usa httpx
        result = await some_function_that_calls_api()

        # Verificar
        mock_post.assert_called_once()
```

### 2. Mocking Redis

```python
from unittest.mock import AsyncMock, Mock

async def test_cache_operation():
    cache = RedisCache()
    cache.redis = AsyncMock()

    # Mock get operation
    cache.redis.get.return_value = '{"key": "value"}'

    result = await cache.get("test_key")

    assert result == {"key": "value"}
    cache.redis.get.assert_called_once_with("test_key")
```

### 3. Mocking Base de Datos

```python
# No necesario! Usamos SQLite in-memory real
# Las fixtures db_session y test_user proveen BD real

async def test_user_creation(db_session):
    # Esta es una BD SQLite real en memoria
    user = User(email="new@example.com", hashed_password="hash")
    db_session.add(user)
    await db_session.commit()

    # Queries reales funcionan
    result = await db_session.execute(select(User))
    users = result.scalars().all()
    assert len(users) > 0
```

### 4. Mocking Servicios Externos

```python
@patch('app.services.weather.get_weather_data')
async def test_with_mocked_weather(mock_weather, client, auth_headers):
    # Mock del servicio de clima
    mock_weather.return_value = {
        'descripcion': 'soleado',
        'temperatura': 25.0,
        'humedad': 60.0
    }

    # Test que usa el servicio
    response = await client.post(
        "/api/v1/recommendations/",
        headers=auth_headers,
        json={...}
    )

    mock_weather.assert_called_once()
```

### 5. Mocking Funciones Específicas

```python
@patch('app.services.gemini.get_ai_recommendation')
async def test_recommendation_flow(mock_ai):
    mock_ai.return_value = "Dior Sauvage\n\nPerfecto para la ocasión"

    # Tu código que llama a get_ai_recommendation
    result = await some_function()

    assert "Dior Sauvage" in result
```

---

## 👨‍💻 Guía para Desarrolladores

### Creando Nuevos Tests

#### 1. Estructura Básica

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_my_new_feature(client: AsyncClient, auth_headers):
    """
    Test description: what are we testing and why

    Given: initial state
    When: action performed
    Then: expected outcome
    """
    # Arrange (preparar)
    data = {"field": "value"}

    # Act (actuar)
    response = await client.post(
        "/api/v1/endpoint",
        headers=auth_headers,
        json=data
    )

    # Assert (verificar)
    assert response.status_code == 200
    result = response.json()
    assert result["field"] == "value"
```

#### 2. Tests con Base de Datos

```python
@pytest.mark.asyncio
async def test_database_operation(db_session: AsyncSession):
    """Test that creates and queries database records"""
    from app.models.user import User
    from sqlalchemy import select

    # Create
    user = User(
        email="new@test.com",
        hashed_password="hash",
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Query
    result = await db_session.execute(
        select(User).where(User.email == "new@test.com")
    )
    found_user = result.scalar_one()

    # Assert
    assert found_user.id == user.id
    assert found_user.email == "new@test.com"
```

#### 3. Tests de Endpoints

```python
@pytest.mark.asyncio
async def test_endpoint_success(client: AsyncClient, auth_headers):
    """Test successful API call"""
    response = await client.get(
        "/api/v1/resource/123",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert "id" in data

@pytest.mark.asyncio
async def test_endpoint_not_found(client: AsyncClient, auth_headers):
    """Test 404 response"""
    response = await client.get(
        "/api/v1/resource/99999",
        headers=auth_headers
    )

    assert response.status_code == 404

@pytest.mark.asyncio
async def test_endpoint_unauthorized(client: AsyncClient):
    """Test unauthorized access"""
    response = await client.get("/api/v1/resource/123")

    assert response.status_code == 401
```

#### 4. Tests con Mocks

```python
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
@patch('app.services.external.call_api')
async def test_with_external_service(mock_call):
    """Test with mocked external service"""
    # Setup mock
    mock_call.return_value = {"status": "success"}

    # Call function that uses the service
    result = await my_function_that_calls_external_api()

    # Verify
    assert result["status"] == "success"
    mock_call.assert_called_once()
```

### Mejores Prácticas

#### ✅ DO

```python
# ✅ Nombres descriptivos
def test_user_login_with_valid_credentials():
    pass

# ✅ Docstrings claros
def test_password_reset():
    """
    Test that password reset email is sent
    and token is valid for 1 hour
    """
    pass

# ✅ Arrange-Act-Assert pattern
def test_example():
    # Arrange
    user = create_test_user()

    # Act
    result = user.do_something()

    # Assert
    assert result.success

# ✅ Un concepto por test
def test_user_creation():
    # Solo testea creación
    pass

def test_user_validation():
    # Testea validación en otro test
    pass

# ✅ Usar fixtures
def test_with_user(test_user):
    assert test_user.email
```

#### ❌ DON'T

```python
# ❌ Nombres vagos
def test_1():
    pass

# ❌ Sin docstring
def test_something():
    pass

# ❌ Test todo en uno
def test_everything():
    # Testea 10 cosas diferentes
    pass

# ❌ Hardcodear datos
def test_user():
    user = User(email="test@test.com")  # Repetido en cada test

# ❌ No verificar resultados
async def test_endpoint(client):
    await client.post("/api/endpoint")
    # ❌ No hay asserts!
```

### Debugging Tests

```python
# Usar pytest.set_trace() para debug interactivo
def test_debug():
    user = create_user()
    pytest.set_trace()  # Debugger se detiene aquí
    result = user.do_something()
    assert result

# Print para debugging (con -s flag)
def test_with_print():
    print(f"Debug: value = {value}")  # Visible con: pytest -s
    assert value > 0

# Parametrizar para múltiples casos
@pytest.mark.parametrize("input,expected", [
    ("hello", 5),
    ("world", 5),
    ("", 0),
])
def test_length(input, expected):
    assert len(input) == expected
```

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Import Errors

```
ModuleNotFoundError: No module named 'app'
```

**Solución**:
```bash
# Ejecutar desde directorio raíz del proyecto
cd sillage-backend
pytest

# O configurar PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:${PWD}"
```

#### 2. Database Errors

```
sqlalchemy.exc.OperationalError: no such table
```

**Solución**:
```python
# Verificar que conftest.py crea las tablas
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

#### 3. Async Warnings

```
RuntimeWarning: coroutine was never awaited
```

**Solución**:
```python
# ❌ Olvidaste await
result = async_function()

# ✅ Usar await
result = await async_function()

# ✅ Marcar test como async
@pytest.mark.asyncio
async def test_something():
    result = await async_function()
```

#### 4. Fixture Not Found

```
fixture 'test_user' not found
```

**Solución**:
```python
# Verificar que conftest.py está en tests/
# y que la fixture está definida

# conftest.py
@pytest.fixture
async def test_user():
    ...
```

#### 5. Coverage Too Low

```
FAIL Required test coverage of 40% not reached. Total coverage: 35%
```

**Solución**:
```bash
# Ver qué líneas faltan cubrir
pytest --cov=app --cov-report=term-missing

# Enfocarse en módulos críticos
pytest --cov=app.services --cov-report=html
```

### Tips de Performance

```bash
# Tests lentos? Ejecutar en paralelo
pytest -n auto

# Identificar tests lentos
pytest --durations=10

# Cachear resultados de imports
pytest --cache-show
```

---

## 📖 Referencias

### Documentación Oficial

- **pytest**: https://docs.pytest.org/
- **pytest-asyncio**: https://pytest-asyncio.readthedocs.io/
- **pytest-cov**: https://pytest-cov.readthedocs.io/
- **httpx**: https://www.python-httpx.org/
- **SQLAlchemy**: https://docs.sqlalchemy.org/

### Recursos del Proyecto

- **Reporte de Testing**: `TESTING_COMPLETE_REPORT.md`
- **Guía i18n**: `Documentation/i18n_system.md`
- **README Principal**: `README.md`

### Comandos Rápidos

```bash
# Test completo con coverage
pytest

# Test rápido (sin coverage)
pytest --no-cov

# Test específico
pytest tests/test_security.py -v

# Ver coverage HTML
start htmlcov/index.html

# Limpiar cache
pytest --cache-clear
```

---

## 🎯 Próximos Pasos

### Para Aumentar Coverage

1. **Endpoints (auth.py, perfumes.py, recommendations.py)**
   - Agregar tests para casos edge
   - Tests de validación de input
   - Tests de manejo de errores

2. **Main.py**
   - Tests de startup/shutdown events
   - Tests de middleware

3. **Database.py**
   - Tests de conexión
   - Tests de manejo de errores

### Nuevas Funcionalidades a Testear

- [ ] Sistema de suscripciones (cuando se implemente)
- [ ] Sistema de pagos (flow.py)
- [ ] Webhooks
- [ ] Rate limiting
- [ ] Email notifications

---

**Última Actualización**: 2025-10-11
**Versión**: 1.0.0
**Mantenido por**: Equipo de Desarrollo Sillage
