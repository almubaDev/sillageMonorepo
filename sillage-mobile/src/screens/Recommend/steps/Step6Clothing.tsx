import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { VESTIMENTAS } from '../types';

interface Step6ClothingProps {
  value: string;
  onChange: (clothing: string) => void;
}

export const Step6Clothing: React.FC<Step6ClothingProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step6.title')}
      </Text>

      <View style={styles.grid}>
        {VESTIMENTAS.map((vestimenta) => (
          <TouchableOpacity
            key={vestimenta.id}
            style={[
              styles.button,
              {
                backgroundColor: value === vestimenta.id ? colors.accent : colors.bg,
                borderColor: value === vestimenta.id ? colors.accent : colors.secondary + '60',
              },
            ]}
            onPress={() => onChange(vestimenta.id)}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: value === vestimenta.id ? colors.bg : colors.text,
                  fontFamily: 'Lato-Bold',
                },
              ]}
            >
              {t(`recommend:step6.clothing.${vestimenta.id}`)}
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
