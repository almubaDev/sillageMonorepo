import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      <MaterialCommunityIcons 
        name="tshirt-crew" 
        size={64} 
        color={colors.accent} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        {t('recommend:step6.title')}
      </Text>

      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        {t('recommend:step6.subtitle')}
      </Text>

      <View style={styles.options}>
        {VESTIMENTAS.map((vestimenta) => (
          <TouchableOpacity
            key={vestimenta.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: value === vestimenta.id ? colors.accent + '20' : colors.bg,
                borderColor: value === vestimenta.id ? colors.accent : colors.secondary + '40',
              },
            ]}
            onPress={() => onChange(vestimenta.id)}
          >
            <MaterialCommunityIcons
              name={vestimenta.icon as any}
              size={40}
              color={value === vestimenta.id ? colors.accent : colors.secondary}
            />
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: value === vestimenta.id ? colors.text : colors.secondary,
                    fontFamily: 'Lato-Bold',
                  },
                ]}
              >
                {t(`recommend:step6.clothing.${vestimenta.id}`)}
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  { color: colors.secondary, fontFamily: 'Lato-Regular' },
                ]}
              >
                {t(`recommend:step6.clothing.${vestimenta.id}Desc`)}
              </Text>
            </View>
            {value === vestimenta.id && (
              <MaterialCommunityIcons 
                name="check-circle" 
                size={24} 
                color={colors.accent} 
              />
            )}
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
  icon: {
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  options: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
  },
});