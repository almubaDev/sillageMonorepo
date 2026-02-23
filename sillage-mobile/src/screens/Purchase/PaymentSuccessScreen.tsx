/**
 * Pantalla de éxito de pago con verificación automática (polling)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { paymentService, VerificarPagoResponse } from '../../services/paymentService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PaymentSuccessScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  // @ts-ignore - customId viene del WebView, ref viene del linking (URL directa)
  const customId = route.params?.customId || route.params?.ref;

  const [status, setStatus] = useState<'verifying' | 'completed' | 'error'>('verifying');
  const [paymentData, setPaymentData] = useState<VerificarPagoResponse | null>(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 30; // 30 intentos * 2 segundos = 60 segundos máximo

  // Animación del check
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!customId) {
      setStatus('error');
      return;
    }

    verificarPago();
  }, [customId]);

  const verificarPago = async () => {
    try {
      // console.log(`🔍 Intento ${attempts + 1}/${maxAttempts} - Verificando pago: ${customId}`);

      const response = await paymentService.verificarPago(customId, 'paypal', 'completed');

      if (response.success && response.estado === 'completado') {
        // ✅ Pago completado
        // console.log('✅ Pago completado exitosamente');
        setPaymentData(response);
        setStatus('completed');

        // Animar el check
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (response.estado === 'pendiente') {
        // ⏳ Pago pendiente - Continuar polling
        // console.log('⏳ Pago pendiente, reintentando en 2 segundos...');
        setAttempts((prev) => prev + 1);

        if (attempts < maxAttempts) {
          setTimeout(verificarPago, 2000); // Reintentar en 2 segundos
        } else {
          // Timeout
          // console.log('⏰ Timeout: Máximo de intentos alcanzado');
          setStatus('error');
          setPaymentData({
            success: false,
            estado: 'timeout',
            error: 'Timeout verificando pago',
            mensaje: t('payments:errors.timeout'),
          });
        }
      } else {
        // ❌ Error o estado no esperado
        // console.log(`❌ Estado no esperado: ${response.estado}`);
        setStatus('error');
        setPaymentData(response);
      }
    } catch (error: any) {
      console.error('❌ Error verificando pago:', error);

      // Reintentar si no hemos alcanzado el máximo
      if (attempts < maxAttempts) {
        setAttempts((prev) => prev + 1);
        setTimeout(verificarPago, 2000);
      } else {
        setStatus('error');
        setPaymentData({
          success: false,
          estado: 'error',
          error: error.message,
          mensaje: t('payments:errors.verifyingPayment'),
        });
      }
    }
  };

  const handleContinue = () => {
    // Reset del stack para volver a ProfileMain
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ProfileMain' }],
      })
    );
  };

  const handleRetry = () => {
    setStatus('verifying');
    setAttempts(0);
    verificarPago();
  };

  // Estado: Verificando
  if (status === 'verifying') {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('payments:success.processing')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('payments:success.verifying')}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${(attempts / maxAttempts) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.attemptText, { color: colors.secondary }]}>
              {t('payments:success.attempt', { current: attempts + 1, max: maxAttempts })}
            </Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: colors.accent + '15' }]}>
            <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {t('payments:success.pleaseWait')}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Estado: Completado
  if (status === 'completed' && paymentData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              { backgroundColor: '#10b981' + '20' },
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={80} color="#10b981" />
          </Animated.View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('payments:success.title')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('payments:success.completed')}
          </Text>

          {/* Detalles del pago */}
          <View style={[styles.detailsCard, { backgroundColor: colors.cardBg }]}>
            <DetailRow
              icon="package-variant"
              label={t('payments:success.package')}
              value={paymentData.paquete_nombre || '-'}
              colors={colors}
            />
            <DetailRow
              icon="plus-circle"
              label={t('payments:success.consultationsAdded')}
              value={`${paymentData.consultas_agregadas || 0} ${t('payments:purchase.consultations')}`}
              colors={colors}
              highlighted
            />
            <DetailRow
              icon="checkbox-multiple-marked-circle"
              label={t('payments:success.totalConsultations')}
              value={`${paymentData.consultas_totales || 0} ${t('payments:purchase.consultations')}`}
              colors={colors}
            />
            <DetailRow
              icon="cash"
              label={t('payments:success.amount')}
              value={`$${paymentData.monto || '0.00'}`}
              colors={colors}
            />
          </View>

          {/* Botón continuar */}
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.accent }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>{t('payments:success.continue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Estado: Error
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#ef4444' + '20' }]}>
          <MaterialCommunityIcons name="alert-circle" size={80} color="#ef4444" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {t('payments:errors.title')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {paymentData?.mensaje || t('payments:errors.verifyingPayment')}
        </Text>

        {paymentData?.error && (
          <View style={[styles.errorBox, { backgroundColor: '#ef4444' + '15' }]}>
            <Text style={[styles.errorText, { color: '#ef4444' }]}>
              {paymentData.error}
            </Text>
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={handleRetry}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>{t('payments:errors.retry')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: colors.accent }]}>
              {t('common:back')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Componente de fila de detalle
const DetailRow = ({ icon, label, value, colors, highlighted = false }: any) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={highlighted ? colors.accent : colors.secondary}
      />
      <Text style={[styles.detailLabel, { color: colors.secondary }]}>{label}</Text>
    </View>
    <Text
      style={[
        styles.detailValue,
        { color: highlighted ? colors.accent : colors.text },
        highlighted && styles.detailValueHighlighted,
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  attemptText: {
    fontSize: 12,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  detailsCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailValueHighlighted: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
