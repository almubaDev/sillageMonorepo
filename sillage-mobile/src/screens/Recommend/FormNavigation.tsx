import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
            {t('recommend:navigation.back')}
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
        <View style={styles.buttonContent}>
          <Text style={[styles.nextText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {isLastStep ? t('recommend:navigation.submit') : t('recommend:navigation.continue')}
          </Text>
          {!isLastStep && (
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.bg} />
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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