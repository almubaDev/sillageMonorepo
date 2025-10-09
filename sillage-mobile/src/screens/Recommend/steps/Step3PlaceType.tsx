import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeProvider';

interface Step3PlaceTypeProps {
  value: 'abierto' | 'cerrado' | null;
  onChange: (type: 'abierto' | 'cerrado') => void;
}

export const Step3PlaceType: React.FC<Step3PlaceTypeProps> = ({ value, onChange }) => {
  const { colors } = useTheme();

  const options = [
    {
      id: 'abierto' as const,
      label: 'Lugar Abierto',
      icon: 'weather-sunny',
      description: 'Parque, terraza, exterior',
    },
    {
      id: 'cerrado' as const,
      label: 'Lugar Cerrado',
      icon: 'home',
      description: 'Oficina, restaurant, interior',
    },
  ];

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <MaterialCommunityIcons 
        name="map-marker" 
        size={64} 
        color={colors.accent} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        ¿Qué tipo de lugar es?
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        Esto nos ayuda a considerar el clima
      </Text>

      <View style={styles.options}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: value === option.id ? colors.accent + '20' : colors.bg,
                borderColor: value === option.id ? colors.accent : colors.secondary + '40',
              },
            ]}
            onPress={() => onChange(option.id)}
          >
            <MaterialCommunityIcons
              name={option.icon as any}
              size={48}
              color={value === option.id ? colors.accent : colors.secondary}
            />
            <Text
              style={[
                styles.optionLabel,
                {
                  color: value === option.id ? colors.text : colors.secondary,
                  fontFamily: 'Lato-Bold',
                },
              ]}
            >
              {option.label}
            </Text>
            <Text
              style={[
                styles.optionDescription,
                { color: colors.secondary, fontFamily: 'Lato-Regular' },
              ]}
            >
              {option.description}
            </Text>
            {value === option.id && (
              <View style={styles.checkContainer}>
                <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
              </View>
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
    paddingBottom: 40,
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
    gap: 16,
  },
  optionCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  optionLabel: {
    fontSize: 18,
    marginTop: 12,
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  checkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});