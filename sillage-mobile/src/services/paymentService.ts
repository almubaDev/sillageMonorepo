/**
 * Servicio de pagos y compra de consultas
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface Paquete {
  id: number;
  nombre: string;
  descripcion: string;
  cantidad_consultas: number;
  precio: number;
  precio_anterior: number | null;
  moneda: string;
  destacado: boolean;
  precio_por_consulta: number;
  tiene_descuento: boolean;
  porcentaje_descuento: number;
  botones_pago: Array<{
    id: number;
    metodo_pago: {
      id: number;
      nombre: string;
      codigo: string;
      icono: string;
      color_boton: string;
    };
  }>;
}

interface MetodoPago {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  icono: string;
  color_boton: string;
}

interface PaquetesResponse {
  paquetes: Paquete[];
  metodos_pago: MetodoPago[];
}

interface FormularioPago {
  action: string;
  method: string;
  campos: Record<string, string>;
}

interface GenerarPagoResponse {
  success: boolean;
  tipo: string;
  formulario: FormularioPago;
  custom_id: string;
  paquete_nombre: string;
  monto: string;
  mensaje?: string;
}

interface VerificarPagoResponse {
  success: boolean;
  estado: string;
  paquete_nombre?: string;
  consultas_agregadas?: number;
  consultas_totales?: number;
  monto?: string;
  fecha_pago?: string;
  mensaje?: string;
  error?: string;
}

interface MisConsultasResponse {
  consultas_disponibles: number;
  historial_compras: Array<{
    id: number;
    custom_id: string;
    paquete_nombre: string;
    consultas: number;
    monto: number;
    moneda: string;
    estado: string;
    metodo_pago: string;
    fecha: string;
  }>;
  historial_transacciones: Array<{
    id: number;
    tipo: string;
    cantidad: number;
    descripcion: string;
    fecha: string;
  }>;
}

class PaymentService {
  /**
   * Obtener todos los paquetes disponibles
   */
  async getPaquetes(paisUsuario: string = 'US'): Promise<PaquetesResponse> {
    // console.log(`📦 Obteniendo paquetes para país: ${paisUsuario}`);
    try {
      const response = await api.get(`/payments/paquetes?pais_usuario=${paisUsuario}`);
      // console.log(`✅ Paquetes obtenidos: ${response.data.paquetes.length}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo paquetes:', error);
      throw error;
    }
  }

  /**
   * Generar formulario de pago PayPal
   */
  async generarPago(
    paqueteId: number,
    botonPagoId: number,
    paisUsuario: string = 'US'
  ): Promise<GenerarPagoResponse> {
    // console.log(`💳 Generando pago para paquete ${paqueteId}`);
    try {
      const response = await api.post('/payments/generar-pago', {
        paquete_id: paqueteId,
        boton_pago_id: botonPagoId,
        pais_usuario: paisUsuario,
      });
      // console.log(`✅ Formulario generado. Custom ID: ${response.data.custom_id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error generando pago:', error);
      throw error;
    }
  }

  /**
   * Verificar estado de un pago
   */
  async verificarPago(
    customId: string,
    source: string = 'paypal',
    status: string = 'completed'
  ): Promise<VerificarPagoResponse> {
    // console.log(`🔍 Verificando pago: ${customId}`);
    try {
      const response = await api.get(
        `/payments/verificar-pago?ref=${customId}&source=${source}&status=${status}`
      );
      // console.log(`✅ Estado del pago: ${response.data.estado}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error verificando pago:', error);
      throw error;
    }
  }

  /**
   * Obtener información de consultas del usuario
   */
  async getMisConsultas(): Promise<MisConsultasResponse> {
    // console.log('📊 Obteniendo mis consultas');
    try {
      const response = await api.get('/payments/mis-consultas');
      // console.log(`✅ Consultas disponibles: ${response.data.consultas_disponibles}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo consultas:', error);
      throw error;
    }
  }

  /**
   * Generar HTML del formulario para WebView
   */
  generateFormHTML(formulario: FormularioPago): string {
    const inputs = Object.entries(formulario.campos)
      .map(([name, value]) => `<input type="hidden" name="${name}" value="${value}">`)
      .join('\n        ');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirigiendo a PayPal...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .loader {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h1 {
      font-size: 18px;
      font-weight: 500;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h1>Redirigiendo a PayPal...</h1>

  <form id="paypalForm" action="${formulario.action}" method="${formulario.method}">
    ${inputs}
  </form>

  <script>
    // Auto-submit el formulario
    document.getElementById('paypalForm').submit();
  </script>
</body>
</html>
    `.trim();
  }
}

export const paymentService = new PaymentService();
export type {
  Paquete,
  MetodoPago,
  PaquetesResponse,
  FormularioPago,
  GenerarPagoResponse,
  VerificarPagoResponse,
  MisConsultasResponse,
};
