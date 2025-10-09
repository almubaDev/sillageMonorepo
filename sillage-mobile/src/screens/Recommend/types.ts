export interface RecommendationFormData {
  // Paso 1: Fecha
  fecha: Date | null;
  
  // Paso 2: Hora
  hora: Date | null;
  
  // Paso 3: Tipo de lugar
  tipoLugar: 'abierto' | 'cerrado' | null;
  
  // Paso 4: Ocasión
  ocasion: string;
  
  // Paso 5: Expectativa
  expectativa: string;
  
  // Paso 6: Vestimenta
  vestimenta: string;
  
  // Paso 7: Resumen
  
  // Paso 8: NUEVO - Ubicación
  ubicacion: {
    latitud: number | null;
    longitud: number | null;
    nombre: string;
    direccion: string;
  };
}

export const INITIAL_FORM_DATA: RecommendationFormData = {
  fecha: null,
  hora: null,
  tipoLugar: null,
  ocasion: '',
  expectativa: '',
  vestimenta: '',
  ubicacion: {
    latitud: null,
    longitud: null,
    nombre: '',
    direccion: '',
  },
};

export const OCASIONES = [
  { id: 'trabajo', label: 'Trabajo', icon: 'briefcase' },
  { id: 'cita', label: 'Cita Romántica', icon: 'heart' },
  { id: 'fiesta', label: 'Fiesta', icon: 'party-popper' },
  { id: 'casual', label: 'Casual', icon: 'account' },
  { id: 'formal', label: 'Evento Formal', icon: 'tuxedo' },
  { id: 'deportivo', label: 'Actividad Deportiva', icon: 'run' },
  { id: 'otro', label: 'Otro', icon: 'pencil' },
];

export const EXPECTATIVAS = [
  { id: 'confiado', label: 'Confiado', emoji: '💪', color: '#3B82F6' },
  { id: 'seductor', label: 'Seductor', emoji: '😏', color: '#EF4444' },
  { id: 'fresco', label: 'Fresco', emoji: '🌊', color: '#06B6D4' },
  { id: 'elegante', label: 'Elegante', emoji: '✨', color: '#8B5CF6' },
  { id: 'energico', label: 'Enérgico', emoji: '⚡', color: '#F59E0B' },
  { id: 'relajado', label: 'Relajado', emoji: '😌', color: '#10B981' },
  { id: 'profesional', label: 'Profesional', emoji: '💼', color: '#6B7280' },
  { id: 'creativo', label: 'Creativo', emoji: '🎨', color: '#EC4899' },
];

export const VESTIMENTAS = [
  { id: 'formal', label: 'Formal', icon: 'tuxedo', description: 'Traje, corbata' },
  { id: 'semiformal', label: 'Semi-formal', icon: 'tie', description: 'Smart casual' },
  { id: 'casual', label: 'Casual', icon: 'hanger', description: 'Ropa de diario' },
  { id: 'deportivo', label: 'Deportivo', icon: 'shoe-sneaker', description: 'Ropa deportiva' },
];