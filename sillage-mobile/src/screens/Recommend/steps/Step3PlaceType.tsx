import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { LUGAR_TIPOS } from '../types';

interface Step3PlaceTypeProps {
  value: 'abierto' | 'cerrado' | null;
  onChange: (type: 'abierto' | 'cerrado') => void;
}

export const Step3PlaceType: React.FC<Step3PlaceTypeProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const options = [
    { id: 'abierto' as const, label: t('recommend:step3.open'), color: LUGAR_TIPOS.find(l => l.id === 'abierto')?.color || '#06B6D4' },
    { id: 'cerrado' as const, label: t('recommend:step3.closed'), color: LUGAR_TIPOS.find(l => l.id === 'cerrado')?.color || '#8B5CF6' },
  ];

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step3.title')}
      </Text>

      <View style={styles.grid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.button,
              {
                backgroundColor: value === option.id ? option.color : colors.bg,
                borderColor: value === option.id ? option.color : colors.secondary + '60',
              },
            ]}
            onPress={() => onChange(option.id)}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: value === option.id ? '#FFFFFF' : colors.text,
                  fontFamily: 'Lato-Bold',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  grid: {
    width: '100%',
    maxWidth: 400,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  button: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
