import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const { colors } = useTheme();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        Paso {currentStep} de {totalSteps}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.secondary + '30' }]}>
        <View 
          style={[
            styles.fill, 
            { backgroundColor: colors.accent, width: `${progress}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});