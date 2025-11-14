/**
 * Servicio para administración de paquetes de pago
 */
import api from './api';

export interface BotonPagoInfo {
  id: number;
  metodo_pago: string;
  codigo_metodo: string;
  activo: boolean;
}

export interface PaqueteAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  cantidad_consultas: number;
  precio: number;
  precio_anterior: number | null;
  precio_por_consulta: number;
  tiene_descuento: boolean;
  porcentaje_descuento: number;
  moneda: string;
  destacado: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string | null;
  botones_pago: BotonPagoInfo[];
}

export interface PaqueteCreate {
  nombre: string;
  descripcion?: string;
  cantidad_consultas: number;
  precio: number;
  precio_anterior?: number;
  moneda?: string;
  destacado?: boolean;
  activo?: boolean;
}

export interface PaqueteUpdate {
  nombre?: string;
  descripcion?: string;
  cantidad_consultas?: number;
  precio?: number;
  precio_anterior?: number;
  moneda?: string;
  destacado?: boolean;
  activo?: boolean;
}

export interface PagoHistorialItem {
  id: number;
  custom_id: string;
  usuario_email: string;
  paquete_nombre: string;
  cantidad_consultas: number;
  monto: number;
  moneda: string;
  estado: string;
  metodo_pago: string | null;
  referencia_externa: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PagoHistorialResponse {
  total: number;
  pagina: number;
  por_pagina: number;
  paginas_totales: number;
  pagos: PagoHistorialItem[];
}

export interface EstadisticasPaquete {
  paquete_nombre: string;
  cantidad_ventas: number;
  total_recaudado: number;
  porcentaje_ventas: number;
}

export interface EstadisticasVentas {
  total_ventas: number;
  total_transacciones: number;
  total_consultas_vendidas: number;
  pagos_completados: number;
  pagos_pendientes: number;
  pagos_fallidos: number;
  paquete_mas_vendido: string | null;
  top_paquetes: EstadisticasPaquete[];
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
}

const adminPaymentService = {
  /**
   * Obtener todos los paquetes (incluyendo inactivos)
   */
  async getPaquetes(incluirInactivos: boolean = true): Promise<PaqueteAdmin[]> {
    const response = await api.get('/admin/payments/paquetes', {
      params: { incluir_inactivos: incluirInactivos }
    });
    return response.data;
  },

  /**
   * Crear un nuevo paquete (se vincula automáticamente con PayPal)
   */
  async createPaquete(data: PaqueteCreate): Promise<PaqueteAdmin> {
    const response = await api.post('/admin/payments/paquetes', data);
    return response.data;
  },

  /**
   * Actualizar un paquete existente
   */
  async updatePaquete(id: number, data: PaqueteUpdate): Promise<PaqueteAdmin> {
    const response = await api.put(`/admin/payments/paquetes/${id}`, data);
    return response.data;
  },

  /**
   * Desactivar un paquete (soft delete)
   */
  async deletePaquete(id: number): Promise<void> {
    await api.delete(`/admin/payments/paquetes/${id}`);
  },

  /**
   * Obtener historial de pagos con filtros
   */
  async getPagosHistorial(params: {
    pagina?: number;
    por_pagina?: number;
    estado?: string;
    paquete_id?: number;
    usuario_email?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<PagoHistorialResponse> {
    const response = await api.get('/admin/payments/pagos', { params });
    return response.data;
  },

  /**
   * Obtener estadísticas de ventas
   */
  async getEstadisticas(): Promise<EstadisticasVentas> {
    const response = await api.get('/admin/payments/estadisticas');
    return response.data;
  },
};

export default adminPaymentService;
