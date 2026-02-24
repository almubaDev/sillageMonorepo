/**
 * Pantalla de compra de paquetes de consultas
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { paymentService, Paquete, PaquetesResponse } from '../../services/paymentService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importar WebView solo en plataformas soportadas
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export const PurchaseScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [loading, setLoading] = useState(true);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [paymentHTML, setPaymentHTML] = useState<string | null>(null);
  const [customId, setCustomId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    loadPaquetes();
  }, []);

  const loadPaquetes = async () => {
    try {
      setLoading(true);
      const data: PaquetesResponse = await paymentService.getPaquetes('US');
      setPaquetes(data.paquetes);
    } catch (error: any) {
      console.error('Error loading packages:', error);
      Alert.alert(
        t('payments:errors.title'),
        t('payments:errors.loadingPackages'),
        [{ text: t('common:buttons.confirm'), onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (paquete: Paquete) => {
    try {
      setProcessingPayment(true);

      // Obtener el primer botón de pago (PayPal)
      const botonPago = paquete.botones_pago[0];
      if (!botonPago) {
        Alert.alert(
          t('payments:errors.title'),
          'No payment method available for this package'
        );
        return;
      }

      // Generar formulario de pago
      const paymentData = await paymentService.generarPago(
        paquete.id,
        botonPago.id,
        'US'
      );

      if (paymentData.success && paymentData.formulario) {
        // Guardar custom_id para después
        setCustomId(paymentData.custom_id);

        // console.log('Payment data received:', paymentData);
        // console.log('Formulario:', paymentData.formulario);

        if (Platform.OS === 'web') {
          // En web, crear formulario y enviarlo directamente
          submitPaymentFormWeb(paymentData.formulario);
        } else {
          // En mobile, usar WebView
          const html = paymentService.generateFormHTML(paymentData.formulario);
          setPaymentHTML(html);
        }
      } else {
        console.error('Payment data is invalid:', paymentData);
        Alert.alert(
          t('payments:errors.title'),
          'No se recibió el formulario de pago del servidor'
        );
      }
    } catch (error: any) {
      console.error('Error generating payment:', error);
      Alert.alert(
        t('payments:errors.title'),
        error.response?.data?.detail || t('payments:errors.generatingPayment')
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  const submitPaymentFormWeb = (formulario: any) => {
    try {
      // console.log('Formulario recibido:', formulario);

      // Crear formulario temporal en el DOM
      const form = document.createElement('form');
      form.method = formulario.method || 'POST';
      form.action = formulario.action || formulario.url;
      form.target = '_blank'; // Abrir en nueva pestaña

      // Agregar campos del formulario - pueden venir como 'fields' o 'campos'
      const campos = formulario.fields || formulario.campos || formulario;

      if (campos && typeof campos === 'object') {
        Object.entries(campos).forEach(([key, value]) => {
          // Saltar propiedades que no son campos del formulario
          if (key === 'action' || key === 'url' || key === 'method') {
            return;
          }

          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });
      }

      // Agregar al DOM, enviar y remover
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      // Informar al usuario
      Alert.alert(
        t('payments:purchase.redirecting'),
        'Se ha abierto una nueva pestaña con PayPal. Una vez completado el pago, cierra la pestaña y regresa aquí.',
        [
          {
            text: 'Verificar Pago',
            onPress: () => {
              if (customId) {
                // @ts-ignore
                navigation.navigate('PaymentSuccess', { customId });
              }
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error submitting payment form:', error);
      Alert.alert(
        t('payments:errors.title'),
        'Error al procesar el formulario de pago'
      );
    }
  };

  const handleWebViewNavigationChange = (navState: any) => {
    const { url } = navState;
    // console.log('WebView navigation:', url);

    // Detectar retorno exitoso de PayPal
    if (url.includes('/payment/success') && customId) {
      setPaymentHTML(null);
      // @ts-ignore - Navigation types
      navigation.navigate('PaymentSuccess', { customId });
    }

    // Detectar cancelación
    if (url.includes('/payment/cancel')) {
      setPaymentHTML(null);
      setCustomId(null);
      // Ya estamos en la pantalla de compra, solo cerrar el WebView
      // console.log('Pago cancelado por el usuario');
    }
  };

  if (paymentHTML && Platform.OS !== 'web' && WebView) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <WebView
          source={{ html: paymentHTML }}
          onNavigationStateChange={handleWebViewNavigationChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                {t('payments:purchase.redirecting')}
              </Text>
            </View>
          )}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {t('payments:purchase.loadingPackages')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('payments:purchase.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('payments:purchase.subtitle')}
          </Text>
        </View>

        {/* Paquetes */}
        <View style={[styles.packagesContainer, isDesktop && styles.packagesContainerDesktop]}>
          {paquetes.map((paquete, index) => (
            <PackageCard
              key={paquete.id}
              paquete={paquete}
              colors={colors}
              onPurchase={() => handlePurchase(paquete)}
              isProcessing={processingPayment}
              t={t}
              isDesktop={isDesktop}
            />
          ))}
        </View>

        {/* Información adicional */}
        <View style={[styles.infoBox, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
          <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {t('payments:purchase.info')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// Componente de Card de Paquete
const PackageCard = ({ paquete, colors, onPurchase, isProcessing, t, isDesktop }: any) => {
  const isPopular = paquete.destacado;

  return (
    <View
      style={[
        styles.packageCard,
        isDesktop && styles.packageCardDesktop,
        { backgroundColor: colors.cardBg, borderColor: colors.accent + '30' },
        isPopular && styles.popularCard,
      ]}
    >
      {/* Badge "Más Popular" - Solo desktop en posición absoluta */}
      {isPopular && isDesktop && (
        <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
          <MaterialCommunityIcons name="star" size={14} color="white" />
          <Text style={styles.popularText}>{t('payments:purchase.mostPopular')}</Text>
        </View>
      )}

      {/* Fila superior: Información del paquete */}
      <View style={styles.packageInfoSection}>
        {/* Nombre del paquete con badge en mobile */}
        <View style={styles.packageNameRow}>
          <Text style={{ fontFamily: 'Lato-Bold', fontSize: 18, color: colors.text, flex: 1 }}>
            {paquete.nombre}
          </Text>
          {isPopular && !isDesktop && (
            <View style={[styles.popularBadgeInline, { backgroundColor: colors.accent }]}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {'★ '}{t('payments:purchase.mostPopular')}
              </Text>
            </View>
          )}
        </View>

        {/* Segunda línea: consultas y precio */}
        <Text style={[styles.packageCompactInfo, { color: colors.text, fontFamily: 'Lato-Regular', marginTop: 8 }]}>
          <Text style={{ color: colors.accent, fontSize: 16 }}>{paquete.cantidad_consultas} {t('payments:purchase.consultations')}</Text>
          {' • '}
          <Text style={{ fontFamily: 'Lato-Bold', fontSize: 18 }}>${paquete.precio.toFixed(2)}</Text>
          {' '}
          <Text style={{ color: colors.secondary, fontSize: 14 }}>(${paquete.precio_por_consulta.toFixed(2)} {t('payments:purchase.perQuery')})</Text>
        </Text>
      </View>

      {/* Fila inferior: Botón de compra */}
      <View style={styles.packageButtonSection}>
        <TouchableOpacity
          style={[
            styles.buyButton,
            { backgroundColor: colors.accent },
            isProcessing && styles.buyButtonDisabled,
          ]}
          onPress={onPurchase}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="cart-plus" size={20} color="white" />
              <Text style={styles.buyButtonText}>
                {t('payments:purchase.buyButton')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  packagesContainer: {
    gap: 20,
  },
  packagesContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  packageCard: {
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  packageCardDesktop: {
    width: '31.5%',
    minWidth: 280,
    marginBottom: 0,
  },
  popularCard: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  popularBadgeInline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  packageInfoSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  packageNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageCompactInfo: {
    lineHeight: 26,
  },
  packageButtonSection: {
    width: '100%',
  },
  packageName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 4,
  },
  packageDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  consultasContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  consultasNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    lineHeight: 60,
  },
  consultasLabel: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 4,
  },
  priceContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  oldPrice: {
    fontSize: 20,
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricePerQuery: {
    fontSize: 13,
    opacity: 0.7,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buyButtonDisabled: {
    opacity: 0.5,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
