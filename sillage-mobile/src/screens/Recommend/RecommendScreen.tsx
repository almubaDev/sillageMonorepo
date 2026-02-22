// sillage-mobile/src/screens/Recommend/RecommendScreen.tsx

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Text } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';
import { useLanguageChange } from '../../hooks/useLanguageChange';
import { ProgressBar } from './ProgressBar';
import { FormNavigation } from './FormNavigation';
import { Step1Date } from './steps/Step1Date';
import { Step2Time } from './steps/Step2Time';
import { Step3PlaceType } from './steps/Step3PlaceType';
import { Step4Occasion } from './steps/Step4Occasion';
import { Step5Expectation } from './steps/Step5Expectation';
import { Step6Clothing } from './steps/Step6Clothing';
import { Step7Summary } from './steps/Step7Summary';
import { Step8Location } from './steps/Step8Location';
import { RecommendationFormData, INITIAL_FORM_DATA } from './types';
import { recommendationService } from '../../services/recommendationService';
import { CreateRecommendationRequest } from '../../schemas/recommendation';

const TOTAL_STEPS = 8;

interface Props {
  navigation: any;
}

export const RecommendScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { refreshUser } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RecommendationFormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpiar errores cuando cambia el idioma
  useLanguageChange(() => {
    setError(null);
  });

  const updateFormData = <K extends keyof RecommendationFormData>(
    field: K,
    value: RecommendationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.fecha !== null;
      case 2:
        return formData.hora !== null;
      case 3:
        return formData.tipoLugar !== null;
      case 4:
        return formData.ocasion.trim() !== '';
      case 5:
        return formData.expectativa.trim() !== '';
      case 6:
        return formData.vestimenta.trim() !== '';
      case 7:
        return true;
      case 8:
        return formData.ubicacion.latitud !== null && formData.ubicacion.longitud !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar que tengamos todos los datos necesarios
      if (!formData.fecha || !formData.hora || !formData.tipoLugar ||
          !formData.ubicacion.latitud || !formData.ubicacion.longitud) {
        setError(t('recommend:error.missingData'));
        setLoading(false);
        return;
      }

      // Preparar datos para el backend
      const recommendationData: CreateRecommendationRequest = {
        fecha_evento: formData.fecha.toISOString().split('T')[0], // YYYY-MM-DD
        hora_evento: formData.hora.toTimeString().slice(0, 5), // HH:MM
        latitud: formData.ubicacion.latitud,
        longitud: formData.ubicacion.longitud,
        lugar_nombre: formData.ubicacion.nombre,
        lugar_tipo: formData.tipoLugar,
        lugar_descripcion: formData.ubicacion.direccion,
        ocasion: formData.ocasion,
        expectativa: formData.expectativa,
        vestimenta: formData.vestimenta,
        idioma: i18n.language, // Enviar idioma actual del usuario
      };

      // console.log('📤 Enviando datos al backend:', recommendationData);

      // Llamar al backend (que consulta clima + IA)
      const result = await recommendationService.create(recommendationData);

      // console.log('✅ Recomendación recibida:', result);

      // Actualizar datos del usuario (incluyendo consultas restantes)
      await refreshUser();

      // Navegar a pantalla de resultado
      navigation.navigate('RecommendationResult', {
        recommendation: result,
      });

      // Resetear formulario
      setFormData(INITIAL_FORM_DATA);
      setCurrentStep(1);
      
    } catch (error: any) {
      console.error('❌ Error en recomendación:', error);
      
      // Mostrar error al usuario - asegurar que siempre sea string
      const rawMessage = error.detail || error.message || 'Hubo un problema al generar tu recomendación. Intenta nuevamente.';
      const errorMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage);
      setError(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Date
            value={formData.fecha}
            onChange={(date) => updateFormData('fecha', date)}
          />
        );
      case 2:
        return (
          <Step2Time
            value={formData.hora}
            onChange={(time) => updateFormData('hora', time)}
          />
        );
      case 3:
        return (
          <Step3PlaceType
            value={formData.tipoLugar}
            onChange={(type) => updateFormData('tipoLugar', type)}
          />
        );
      case 4:
        return (
          <Step4Occasion
            value={formData.ocasion}
            onChange={(occasion) => updateFormData('ocasion', occasion)}
          />
        );
      case 5:
        return (
          <Step5Expectation
            value={formData.expectativa}
            onChange={(expectation) => updateFormData('expectativa', expectation)}
          />
        );
      case 6:
        return (
          <Step6Clothing
            value={formData.vestimenta}
            onChange={(clothing) => updateFormData('vestimenta', clothing)}
          />
        );
      case 7:
        return <Step7Summary data={formData} onEdit={handleEdit} />;
      case 8:
        return (
          <Step8Location
            value={formData.ubicacion}
            onChange={(location) => updateFormData('ubicacion', location)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      
      {/* Mostrar error si existe */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
          <Text style={[styles.errorText, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>
            {error}
          </Text>
        </View>
      )}

      <View style={styles.stepContainer}>{renderStep()}</View>
      
      <FormNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        canGoNext={canGoNext() && !loading}
      />

      {/* Modal de carga */}
      <Modal
        isVisible={loading}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.8}
        style={styles.modal}
      >
        <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.loadingContent, { backgroundColor: colors.accent + '15' }]}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
              {t('recommend:loading.title')}
            </Text>
            <View style={styles.loadingSteps}>
              <View style={styles.loadingStep}>
                <MaterialCommunityIcons name="weather-cloudy" size={20} color={colors.accent} />
                <Text style={[styles.loadingStepText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('recommend:loading.checkingWeather')}
                </Text>
              </View>
              <View style={styles.loadingStep}>
                <MaterialCommunityIcons name="robot" size={20} color={colors.accent} />
                <Text style={[styles.loadingStepText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('recommend:loading.analyzingAI')}
                </Text>
              </View>
              <View style={styles.loadingStep}>
                <MaterialCommunityIcons name="bottle-tonic-plus" size={20} color={colors.accent} />
                <Text style={[styles.loadingStepText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {t('recommend:loading.selectingPerfume')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 32,
  },
  loadingContent: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  loadingTitle: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingSteps: {
    width: '100%',
    gap: 16,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingStepText: {
    fontSize: 14,
    flex: 1,
  },
});