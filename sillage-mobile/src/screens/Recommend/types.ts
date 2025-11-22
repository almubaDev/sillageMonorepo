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
  { id: 'trabajo', label: 'Trabajo', color: '#6B7280' },
  { id: 'cita', label: 'Cita Romántica', color: '#EF4444' },
  { id: 'fiesta', label: 'Fiesta', color: '#8B5CF6' },
  { id: 'casual', label: 'Casual', color: '#10B981' },
  { id: 'formal', label: 'Evento Formal', color: '#1E3A5F' },
  { id: 'deportivo', label: 'Actividad Deportiva', color: '#F59E0B' },
];

export const EXPECTATIVAS = [
  { id: 'confiado', label: 'Confiado', color: '#3B82F6' },
  { id: 'seductor', label: 'Seductor', color: '#EF4444' },
  { id: 'fresco', label: 'Fresco', color: '#06B6D4' },
  { id: 'elegante', label: 'Elegante', color: '#8B5CF6' },
  { id: 'energico', label: 'Enérgico', color: '#F59E0B' },
  { id: 'relajado', label: 'Relajado', color: '#10B981' },
  { id: 'profesional', label: 'Profesional', color: '#6B7280' },
  { id: 'creativo', label: 'Creativo', color: '#EC4899' },
];

export const VESTIMENTAS = [
  { id: 'formal', label: 'Formal', color: '#1E3A5F' },
  { id: 'semiformal', label: 'Semi-formal', color: '#6B7280' },
  { id: 'casual', label: 'Casual', color: '#10B981' },
  { id: 'deportivo', label: 'Deportivo', color: '#F59E0B' },
];

export const LUGAR_TIPOS = [
  { id: 'abierto', color: '#06B6D4' },
  { id: 'cerrado', color: '#8B5CF6' },
];