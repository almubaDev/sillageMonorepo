/**
 * Pantalla de cancelación de pago
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const PaymentCancelScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  // @ts-ignore - customId viene del WebView, ref viene del linking (URL directa)
  const customId = route.params?.customId || route.params?.ref;

  const handleRetry = () => {
    // Volver a la pantalla de compra
    // @ts-ignore
    navigation.navigate('Purchase');
  };

  const handleGoBack = () => {
    // Reset del stack para volver a ProfileMain
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ProfileMain' }],
      })
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {/* Icono de cancelación */}
        <View style={[styles.iconContainer, { backgroundColor: '#f59e0b' + '20' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={80} color="#f59e0b" />
        </View>

        {/* Título */}
        <Text style={[styles.title, { color: colors.text }]}>
          {t('payments:cancel.title')}
        </Text>

        {/* Subtítulo */}
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {t('payments:cancel.message')}
        </Text>

        {/* Información */}
        <View style={[styles.infoBox, { backgroundColor: colors.cardBg }]}>
          <MaterialCommunityIcons name="information-outline" size={24} color={colors.accent} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              {t('payments:cancel.infoTitle')}
            </Text>
            <Text style={[styles.infoText, { color: colors.secondary }]}>
              {t('payments:cancel.infoText')}
            </Text>
          </View>
        </View>

        {customId && (
          <View style={[styles.referenceBox, { backgroundColor: colors.accent + '10' }]}>
            <Text style={[styles.referenceLabel, { color: colors.secondary }]}>
              {t('payments:cancel.reference')}
            </Text>
            <Text style={[styles.referenceValue, { color: colors.accent }]}>
              {customId}
            </Text>
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={handleRetry}
          >
            <MaterialCommunityIcons name="replay" size={20} color="white" />
            <Text style={styles.retryButtonText}>
              {t('payments:cancel.retry')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.accent }]}
            onPress={handleGoBack}
          >
            <Text style={[styles.backButtonText, { color: colors.accent }]}>
              {t('payments:cancel.goBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

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
  infoBox: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    width: '100%',
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  referenceBox: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  referenceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
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
