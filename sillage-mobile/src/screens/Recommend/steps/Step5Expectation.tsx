import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { EXPECTATIVAS } from '../types';

interface Step5ExpectationProps {
  value: string;
  onChange: (expectation: string) => void;
}

export const Step5Expectation: React.FC<Step5ExpectationProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step5.title')}
      </Text>

      <View style={styles.grid}>
        {EXPECTATIVAS.map((expectativa) => (
          <TouchableOpacity
            key={expectativa.id}
            style={[
              styles.button,
              {
                backgroundColor: value === expectativa.id ? expectativa.color : colors.bg,
                borderColor: value === expectativa.id ? expectativa.color : colors.secondary + '60',
              },
            ]}
            onPress={() => onChange(expectativa.id)}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: value === expectativa.id ? '#FFFFFF' : colors.text,
                  fontFamily: 'Lato-Bold',
                },
              ]}
            >
              {t(`recommend:step5.expectations.${expectativa.id}`)}
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
    fontSize: 14,
    textAlign: 'center',
  },
});
