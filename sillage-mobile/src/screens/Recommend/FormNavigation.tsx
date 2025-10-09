import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canGoNext: boolean;
}

export const FormNavigation: React.FC<FormNavigationProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  canGoNext,
}) => {
  const { colors } = useTheme();
  const isLastStep = currentStep === totalSteps;

  return (
    <View style={styles.container}>
      {currentStep > 1 && (
        <TouchableOpacity
          style={[styles.button, styles.backButton, { borderColor: colors.secondary }]}
          onPress={onBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.secondary} />
          <Text style={[styles.backText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
            Atrás
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          styles.nextButton,
          { backgroundColor: canGoNext ? colors.accent : colors.secondary + '50' },
          currentStep === 1 && styles.fullWidth,
        ]}
        onPress={isLastStep ? onSubmit : onNext}
        disabled={!canGoNext}
      >
        <Text style={[styles.nextText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
          {isLastStep ? 'Obtener Recomendación' : 'Continuar'}
        </Text>
        {!isLastStep && (
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.bg} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingBottom: 30,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  nextButton: {
    // backgroundColor set dynamically
  },
  fullWidth: {
    flex: 1,
  },
  backText: {
    fontSize: 15,
  },
  nextText: {
    fontSize: 15,
  },
});