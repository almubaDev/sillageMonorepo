# 🎨 Guía de Estilos y Paletas de Colores - Sillage

## 🎯 Filosofía de Diseño

Sillage adopta un enfoque de **diseño emocional** donde cada paleta de colores refleja diferentes personalidades y estados de ánimo, permitiendo a los usuarios personalizar su experiencia visual según sus preferencias.

### Principios de Diseño
- **Elegancia minimalista**: Interfaces limpias sin elementos innecesarios
- **Responsive-first**: Diseño optimizado para dispositivos móviles
- **Accesibilidad**: Contraste adecuado y legibilidad en todas las paletas
- **Experiencia fluida**: Transiciones suaves entre estados y paletas

---

## 🎨 Sistema de Paletas de Colores

### 1. **Noir Chic** (Paleta Principal)
**Personalidad**: Elegante, sofisticada, premium

```css
body.noir-chic {
    --bg: #0B0B0B;           /* Fondo principal - Negro profundo */
    --text: #F5F5F5;         /* Texto principal - Blanco marfil */
    --accent: #D4AF37;       /* Acento - Dorado elegante */
    --secondary: #5C5C5C;    /* Secundario - Gris medio */
}
```

**Uso contextual**:
- **Background principal**: Negro profundo que evoca lujo y sofisticación
- **Texto**: Blanco marfil para máxima legibilidad
- **Elementos de acción**: Dorado para botones principales y elementos interactivos
- **Elementos secundarios**: Gris para información complementaria

**Psicología del color**:
- Negro: Elegancia, misterio, premium
- Dorado: Lujo, calidad, aspiración
- Contraste 8:1 para accesibilidad AA+

### 2. **Violeta Sensual**
**Personalidad**: Creativa, artística, emocional

```css
body.violeta-sensual {
    --bg: #3B2C4D;           /* Fondo - Violeta profundo */
    --text: #FDFDFD;         /* Texto - Blanco puro */
    --accent: #C5B4E3;       /* Acento - Lavanda suave */
    --secondary: #F0E0EA;    /* Secundario - Rosa muy claro */
}
```

**Uso contextual**:
- **Background**: Violeta profundo que transmite creatividad y sofisticación
- **Elementos destacados**: Lavanda para crear jerarquía visual suave
- **Información secundaria**: Rosa claro para elementos de apoyo
- **Contraste suave**: Ideal para sesiones largas de uso

**Psicología del color**:
- Violeta: Creatividad, espiritualidad, lujo
- Lavanda: Calma, elegancia, feminidad
- Rosa claro: Delicadeza, suavidad

### 3. **Minimal Light**
**Personalidad**: Limpia, moderna, profesional

```css
body.minimal-light {
    --bg: #F8F6F2;           /* Fondo - Beige muy claro */
    --text: #2B2B2B;         /* Texto - Gris muy oscuro */
    --accent: #D6A7A1;       /* Acento - Terracota suave */
    --secondary: #A79F94;    /* Secundario - Taupe */
}
```

**Uso contextual**:
- **Background claro**: Beige suave para reducir fatiga visual
- **Texto oscuro**: Máxima legibilidad en fondos claros
- **Acento terracota**: Color cálido pero profesional
- **Elementos secundarios**: Taupe para crear profundidad sutil

**Psicología del color**:
- Beige: Calidez, naturalidad, calma
- Terracota: Tierra, estabilidad, confort
- Taupe: Sofisticación neutral, equilibrio

---

## 🎨 Variables CSS Globales

### Sistema de Variables Dinámicas
```css
:root {
    /* Variables se establecen dinámicamente por JavaScript */
    --bg: /* Color de fondo principal */
    --text: /* Color de texto principal */
    --accent: /* Color de acento para elementos interactivos */
    --secondary: /* Color secundario para elementos de apoyo */
    
    /* Variables calculadas automáticamente */
    --bg-alt: /* Variación de fondo para elementos elevados */
    --bg-soft: /* Fondo suave para areas de contenido */
    --text-muted: /* Texto atenuado para información secundaria */
    --block: /* Fondo para bloques de contenido */
}
```

### Aplicación de Variables
```css
body {
    background-color: var(--bg);
    color: var(--text);
    transition: background-color 0.3s ease, color 0.3s ease;
}

.btn-accent {
    background-color: var(--accent);
    color: var(--bg);
}

.bg-secondary {
    background-color: var(--secondary);
}
```

---

## 🎛️ Sistema de Cambio de Paletas

### Implementación JavaScript
```javascript
const palettes = ['noir-chic', 'violeta-sensual', 'minimal-light'];

const getCurrentPalette = () => 
    palettes.find(p => document.body.classList.contains(p)) || palettes[0];

const applyPalette = (palette) => {
    // Remover todas las clases de paleta
    palettes.forEach(c => document.body.classList.remove(c));
    
    // Aplicar nueva paleta
    document.body.classList.add(palette);
    
    // Persistir en localStorage
    localStorage.setItem('palette', palette);
};

const cyclePalette = () => {
    const current = getCurrentPalette();
    const next = palettes[(palettes.indexOf(current) + 1) % palettes.length];
    applyPalette(next);
};
```

### Trigger de Cambio
```javascript
// Cambio de paleta mediante click en logo
<img src="{% static 'img/logo.png' %}" 
     onclick="cyclePalette()"
     class="h-14 w-14 cursor-pointer rounded-full shadow-lg hover:scale-105 transition duration-300">
```

### Persistencia
- **localStorage**: Las preferencias se guardan automáticamente
- **Carga inicial**: La paleta se restaura al cargar la página
- **Fallback**: 'noir-chic' como paleta por defecto

---

## 🎨 Componentes de Estilo

### 1. **Botones**
```css
/* Botón principal con color de acento */
.btn-accent {
    background-color: var(--accent);
    color: var(--bg);
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.btn-accent:hover {
    filter: brightness(110%);
    transform: translateY(-1px);
}

/* Botón secundario con borde */
.btn-outline {
    border: 2px solid var(--accent);
    color: var(--accent);
    background: transparent;
}

.btn-outline:hover {
    background-color: var(--accent);
    color: var(--bg);
}
```

### 2. **Tarjetas y Bloques**
```css
.feature-card {
    border: 1px solid rgba(212, 175, 55, 0.3);
    background: rgba(20, 20, 20, 0.5);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 2rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(212, 175, 55, 0.2);
}
```

### 3. **Formularios**
```css
input, select, textarea {
    background-color: #fff !important;
    color: #000 !important;
    border: 1px solid var(--accent);
    border-radius: 0.5rem;
    padding: 0.75rem;
    width: 100%;
    transition: border-color 0.2s ease;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
```

---

## 🌟 Efectos Visuales y Animaciones

### Transiciones Globales
```css
body {
    transition: background-color 0.3s ease, color 0.3s ease;
}

/* Elementos interactivos */
button, a, .interactive {
    transition: all 0.2s ease;
}

/* Hover effects */
.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

### Animaciones CSS
```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeInUp {
    animation: fadeInUp 0.6s ease forwards;
}

/* Delays para efectos escalonados */
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
```

### Efectos de Carga
```css
/* Spinner de carga */
.loading-spinner {
    border: 4px solid var(--accent);
    border-top: 4px solid transparent;
    border-radius: 50%;
    width: 3rem;
    height: 3rem;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

## 📱 Diseño Responsive

### Breakpoints Tailwind
```css
/* Mobile First Approach */
/* xs: 0px - 639px (móviles) */
/* sm: 640px+ (tablets pequeñas) */
/* md: 768px+ (tablets) */
/* lg: 1024px+ (laptops) */
/* xl: 1280px+ (desktops) */
/* 2xl: 1536px+ (pantallas grandes) */
```

### Componentes Adaptativos
```css
/* Navegación bottom-tab para móviles */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-radius: 1.5rem 1.5rem 0 0;
    padding: 0.5rem;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

/* Grid responsive */
.responsive-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

@media (min-width: 768px) {
    .responsive-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1024px) {
    .responsive-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

---

## 🎭 Estados y Feedback Visual

### Estados de Elementos
```css
/* Estado normal */
.element {
    opacity: 1;
    transform: scale(1);
}

/* Estado hover */
.element:hover {
    opacity: 0.9;
    transform: scale(1.02);
}

/* Estado activo */
.element:active {
    transform: scale(0.98);
}

/* Estado deshabilitado */
.element:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

### Indicadores de Estado
```css
/* Indicador de éxito */
.status-success {
    background-color: #10B981;
    color: white;
    border-radius: 0.5rem;
    padding: 0.75rem;
}

/* Indicador de error */
.status-error {
    background-color: #EF4444;
    color: white;
    border-radius: 0.5rem;
    padding: 0.75rem;
}

/* Indicador de advertencia */
.status-warning {
    background-color: #F59E0B;
    color: white;
    border-radius: 0.5rem;
    padding: 0.75rem;
}

/* Indicador de información */
.status-info {
    background-color: #3B82F6;
    color: white;
    border-radius: 0.5rem;
    padding: 0.75rem;
}
```

---

## 💫 Efectos Especiales

### Glassmorphism
```css
.glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Gradientes Dinámicos
```css
.gradient-text {
    background: linear-gradient(90deg, #D4AF37 0%, #F5E1A4 50%, #D4AF37 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    background-size: 200% 200%;
    animation: gradient-shift 3s ease infinite;
}

@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
```

### Sombras Contextuales
```css
/* Sombra para paleta oscura */
.noir-chic .shadow-context {
    box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);
}

/* Sombra para paleta violeta */
.violeta-sensual .shadow-context {
    box-shadow: 0 4px 20px rgba(197, 180, 227, 0.3);
}

/* Sombra para paleta clara */
.minimal-light .shadow-context {
    box-shadow: 0 4px 20px rgba(43, 43, 43, 0.1);
}
```

---

## 🎯 Iconografía y Tipografía

### Sistema de Iconos
```css
/* Font Awesome 6.5.0 */
/* Iconos principales */
.icon-perfume::before { content: "\f5a8"; }    /* fas fa-spray-can-sparkles */
.icon-recommend::before { content: "\f72b"; }  /* fas fa-wand-magic-sparkles */
.icon-user::before { content: "\f2bd"; }       /* fas fa-circle-user */
.icon-collection::before { content: "\f49e"; } /* fas fa-layer-group */

/* Tamaños de iconos */
.icon-sm { font-size: 0.875rem; }
.icon-md { font-size: 1rem; }
.icon-lg { font-size: 1.25rem; }
.icon-xl { font-size: 1.5rem; }
```

### Tipografía
```css
/* Google Fonts importadas */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Poppins:wght@300;400;600&display=swap');

/* Jerarquía tipográfica */
body {
    font-family: 'Poppins', sans-serif;
    font-weight: 400;
    line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
    font-weight: 700;
    line-height: 1.2;
}

/* Escalas tipográficas */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
.text-4xl { font-size: 2.25rem; }
.text-5xl { font-size: 3rem; }
```

---

## 🎨 Componentes Específicos de Sillage

### 1. **Modal de Recomendación**
```css
/* Modal fullscreen */
.recommendation-modal {
    width: 100vw;
    height: 100vh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    background: var(--bg);
    border: none;
    border-radius: 0;
}

/* Header del modal */
.modal-header {
    background: var(--accent);
    color: var(--bg);
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

/* Botón de cerrar */
.modal-close {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.5rem;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
}
```

### 2. **Formulario Multistep**
```css
/* Contenedor de pasos */
.step-container {
    height: calc(100vh - 60px);
    overflow-y: auto;
    padding: 1.5rem;
}

/* Paso individual */
.step-content {
    max-width: 32rem;
    margin: 0 auto;
    space-y: 1.5rem;
}

.step-content.hidden {
    display: none;
}

/* Navegación entre pasos */
.step-navigation {
    display: flex;
    justify-content: space-between;
    padding-top: 2rem;
    margin-top: 2rem;
    border-top: 1px solid rgba(var(--accent-rgb), 0.2);
}
```

### 3. **Tarjetas de Perfume**
```css
.perfume-card {
    background: var(--bg-alt, rgba(255, 255, 255, 0.05));
    border: 1px solid rgba(var(--accent-rgb), 0.2);
    border-radius: 1rem;
    padding: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
}

.perfume-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 8px 25px rgba(var(--accent-rgb), 0.15);
}

/* Nombre del perfume */
.perfume-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.25rem;
}

/* Marca del perfume */
.perfume-brand {
    font-size: 0.875rem;
    color: var(--text-muted, rgba(var(--text-rgb), 0.7));
    margin-bottom: 1rem;
}

/* Acordes */
.perfume-accords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
}

.accord-tag {
    background: var(--bg);
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
}
```

### 4. **Selector de Ubicación**
```css
/* Contenedor del mapa */
.map-container {
    width: 100%;
    height: 16rem;
    border-radius: 0.5rem;
    border: 1px solid var(--accent);
    overflow: hidden;
    position: relative;
}

/* Input de búsqueda de dirección */
.address-search {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.address-input {
    flex-grow: 1;
    border: 1px solid var(--accent);
    border-radius: 0.5rem;
    padding: 0.75rem;
    background: white;
    color: black;
}

.search-button {
    background: var(--accent);
    color: var(--bg);
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: filter 0.2s ease;
}

.search-button:hover {
    filter: brightness(110%);
}
```

### 5. **Navegación Bottom Tab**
```css
.bottom-navigation {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
}

.nav-container {
    width: 100%;
    max-width: 28rem;
    margin: 0 auto;
    background: white;
    border-radius: 1.5rem 1.5rem 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0.5rem;
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    text-decoration: none;
    transition: color 0.2s ease;
    color: #6B7280;
}

.nav-item.active {
    color: var(--accent);
}

.nav-item i {
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
}

.nav-item span {
    font-size: 0.75rem;
    font-weight: 500;
}
```

---

## 🔧 Utilidades CSS Personalizadas

### Espaciado Contextual
```css
/* Espaciado para móviles */
.mobile-padding {
    padding-left: 1rem;
    padding-right: 1rem;
}

@media (min-width: 768px) {
    .mobile-padding {
        padding-left: 1.5rem;
        padding-right: 1.5rem;
    }
}

/* Márgenes adaptativos */
.adaptive-margin {
    margin-top: 1rem;
    margin-bottom: 1rem;
}

@media (min-width: 768px) {
    .adaptive-margin {
        margin-top: 2rem;
        margin-bottom: 2rem;
    }
}
```

### Estados de Carga
```css
/* Skeleton loading */
.skeleton {
    background: linear-gradient(90deg, 
        rgba(var(--text-rgb), 0.1) 25%, 
        rgba(var(--text-rgb), 0.2) 50%, 
        rgba(var(--text-rgb), 0.1) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Overlay de carga */
.loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-content {
    background: var(--bg);
    padding: 2rem;
    border-radius: 1rem;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}
```

### Efectos de Focus
```css
/* Focus visible mejorado */
.focus-visible:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 0.25rem;
}

/* Focus para elementos personalizados */
.custom-focus:focus {
    box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.3);
    outline: none;
}
```

---

## 📐 Layout y Grid Systems

### Grid Principal
```css
/* Container principal */
.main-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

@media (min-width: 768px) {
    .main-container {
        padding: 0 1.5rem;
    }
}

@media (min-width: 1024px) {
    .main-container {
        padding: 0 2rem;
    }
}

/* Grid de contenido */
.content-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr;
}

@media (min-width: 768px) {
    .content-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 2rem;
    }
}

@media (min-width: 1024px) {
    .content-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem;
    }
}
```

### Flexbox Utilities
```css
/* Centrado perfecto */
.center-perfect {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Distribución espaciada */
.space-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* Stack vertical */
.stack-vertical {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Stack horizontal */
.stack-horizontal {
    display: flex;
    gap: 1rem;
    align-items: center;
}
```

---

## 🎪 Temas y Variaciones

### Variables RGB para Transparencias
```css
/* Conversión automática de colores hex a RGB */
.noir-chic {
    --accent-rgb: 212, 175, 55;      /* #D4AF37 */
    --text-rgb: 245, 245, 245;       /* #F5F5F5 */
    --bg-rgb: 11, 11, 11;            /* #0B0B0B */
}

.violeta-sensual {
    --accent-rgb: 197, 180, 227;     /* #C5B4E3 */
    --text-rgb: 253, 253, 253;       /* #FDFDFD */
    --bg-rgb: 59, 44, 77;            /* #3B2C4D */
}

.minimal-light {
    --accent-rgb: 214, 167, 161;     /* #D6A7A1 */
    --text-rgb: 43, 43, 43;          /* #2B2B2B */
    --bg-rgb: 248, 246, 242;         /* #F8F6F2 */
}
```

### Uso de Transparencias
```css
/* Fondos semitransparentes */
.bg-accent-10 { background-color: rgba(var(--accent-rgb), 0.1); }
.bg-accent-20 { background-color: rgba(var(--accent-rgb), 0.2); }
.bg-accent-50 { background-color: rgba(var(--accent-rgb), 0.5); }

/* Bordes con transparencia */
.border-accent-30 { border-color: rgba(var(--accent-rgb), 0.3); }
.border-accent-50 { border-color: rgba(var(--accent-rgb), 0.5); }

/* Texto con transparencia */
.text-muted { color: rgba(var(--text-rgb), 0.7); }
.text-subtle { color: rgba(var(--text-rgb), 0.5); }
```

---

## 📱 Optimizaciones Móviles

### Touch Targets
```css
/* Tamaños mínimos para elementos táctiles */
.touch-target {
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Botones móviles */
.mobile-button {
    padding: 0.75rem 1.5rem;
    min-height: 48px;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
}
```

### Viewport Específico
```css
/* Altura de viewport móvil */
@supports (height: 100dvh) {
    .mobile-full-height {
        height: 100dvh;
    }
}

/* Fallback para navegadores sin soporte */
.mobile-full-height {
    height: 100vh;
}

/* Safe areas para dispositivos con notch */
.safe-area-padding {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
}
```

---

## 🔮 Futuras Mejoras de Estilo

### Variables CSS Propuestas
```css
/* Futuras variables para más personalización */
:root {
    --border-radius-sm: 0.25rem;
    --border-radius-md: 0.5rem;
    --border-radius-lg: 1rem;
    --border-radius-xl: 1.5rem;
    
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
}
```

### Temas Estacionales
```css
/* Tema primavera */
.spring-theme {
    --accent: #10B981;     /* Verde fresco */
    --secondary: #F3E8FF;  /* Lavanda muy claro */
}

/* Tema verano */
.summer-theme {
    --accent: #F59E0B;     /* Naranja cálido */
    --secondary: #FEF3C7;  /* Amarillo muy claro */
}

/* Tema otoño */
.autumn-theme {
    --accent: #DC2626;     /* Rojo cálido */
    --secondary: #FEE2E2;  /* Rosa muy claro */
}

/* Tema invierno */
.winter-theme {
    --accent: #3B82F6;     /* Azul frío */
    --secondary: #EBF8FF;  /* Azul muy claro */
}
```

---

## 📊 Métricas de Rendimiento Visual

### Optimizaciones CSS
- **Minificación**: Todas las clases CSS están optimizadas
- **Purge CSS**: Solo se cargan estilos utilizados
- **Critical CSS**: Estilos críticos inline en el head
- **Lazy Loading**: Efectos y animaciones se cargan según necesidad

### Accesibilidad
- **Contraste**: Ratio mínimo 4.5:1 en todas las paletas
- **Focus**: Indicadores claros para navegación por teclado
- **Escalabilidad**: Tipografía escalable hasta 200%
- **Reducción de movimiento**: Respeta prefers-reduced-motion

### Performance
- **Transiciones eficientes**: Solo transform y opacity
- **GPU acceleration**: Transform3d para animaciones suaves
- **Debounce**: Cambios de paleta optimizados
- **Local Storage**: Persistencia sin llamadas al servidor

---

*Documento de estilos generado el 28 de septiembre de 2025*
*Sistema de diseño Sillage v1.0*