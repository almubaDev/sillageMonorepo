import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
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
import { weatherService } from '../../services/weatherService';
import { recommendationService, CreateRecommendationRequest } from '../../services/recommendationService';

const TOTAL_STEPS = 8;

export const RecommendScreen = () => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RecommendationFormData>(INITIAL_FORM_DATA);

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
        return true; // Resumen siempre puede continuar
      case 8:
        return formData.ubicacion.latitud !== null && formData.ubicacion.longitud !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleEdit = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    try {
      // Validar que tengamos ubicación
      if (!formData.ubicacion.latitud || !formData.ubicacion.longitud) {
        Alert.alert('Error', 'Debes seleccionar una ubicación en el mapa');
        return;
      }

      // Consultar clima usando las coordenadas seleccionadas
      Alert.alert('Consultando clima', 'Obteniendo datos meteorológicos...');
      const weather = await weatherService.getWeather(
        formData.ubicacion.latitud, 
        formData.ubicacion.longitud
      );

      if (!weather) {
        Alert.alert('Error', 'No se pudo obtener el clima');
        return;
      }

      // Preparar datos para el backend
      const recommendationData: CreateRecommendationRequest = {
        fecha_evento: formData.fecha!.toISOString().split('T')[0],
        hora_evento: formData.hora!.toTimeString().slice(0, 5),
        latitud: formData.ubicacion.latitud,
        longitud: formData.ubicacion.longitud,
        lugar_nombre: formData.ubicacion.nombre,
        lugar_tipo: formData.tipoLugar!,
        ocasion: formData.ocasion,
        expectativa: formData.expectativa,
        vestimenta: formData.vestimenta,
      };

      // Enviar a backend (que consulta Gemini AI)
      Alert.alert('Procesando', 'Generando tu recomendación con IA...');
      const result = await recommendationService.create(recommendationData);

      // Mostrar resultado
      Alert.alert(
        '✨ Recomendación generada',
        `Te recomendamos: ${result.perfume_recomendado.nombre} de ${result.perfume_recomendado.marca}\n\nClima: ${weather.descripcion}, ${weather.temperatura}°C`,
        [{ text: 'Ver detalles' }]
      );

      // TODO: Navegar a pantalla de resultado
      console.log('📊 Resultado completo:', result);
      
    } catch (error: any) {
      console.error('❌ Error en recomendación:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.detail || 'Hubo un problema al generar tu recomendación'
      );
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

      <View style={styles.stepContainer}>{renderStep()}</View>

      <FormNavigation
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        canGoNext={canGoNext()}
      />
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
});