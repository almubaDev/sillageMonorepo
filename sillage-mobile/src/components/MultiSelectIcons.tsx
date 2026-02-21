import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export interface IconOption {
  value: string;
  icon: string;
  label: string;
  activeColor: string;
}

interface MultiSelectIconsProps {
  options: IconOption[];
  selected: string; // comma-separated: "dia,noche"
  onChange: (value: string) => void;
}

export const MOMENTO_OPTIONS: IconOption[] = [
  { value: 'dia', icon: 'weather-sunny', label: 'dia', activeColor: '#FBBF24' },
  { value: 'noche', icon: 'moon-waning-crescent', label: 'noche', activeColor: '#818CF8' },
];

export const ESTACION_OPTIONS: IconOption[] = [
  { value: 'verano', icon: 'waves', label: 'verano', activeColor: '#FB923C' },
  { value: 'otono', icon: 'leaf', label: 'otono', activeColor: '#D97706' },
  { value: 'invierno', icon: 'weather-rainy', label: 'invierno', activeColor: '#22D3EE' },
  { value: 'primavera', icon: 'sprout', label: 'primavera', activeColor: '#4ADE80' },
];

export const MultiSelectIcons: React.FC<MultiSelectIconsProps> = ({
  options,
  selected,
  onChange,
}) => {
  const { colors } = useTheme();
  const selectedValues = selected ? selected.split(',').filter(Boolean) : [];

  const toggleValue = (value: string) => {
    let newSelected: string[];
    if (selectedValues.includes(value)) {
      newSelected = selectedValues.filter((v) => v !== value);
    } else {
      newSelected = [...selectedValues, value];
    }
    onChange(newSelected.join(','));
  };

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = selectedValues.includes(option.value);
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.iconButton,
              {
                borderColor: isActive ? option.activeColor : colors.secondary + '40',
                backgroundColor: isActive ? option.activeColor + '15' : 'transparent',
              },
            ]}
            onPress={() => toggleValue(option.value)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={option.icon as any}
              size={22}
              color={isActive ? option.activeColor : colors.secondary}
            />
            <Text
              style={[
                styles.iconLabel,
                {
                  color: isActive ? option.activeColor : colors.secondary,
                  fontFamily: 'Lato-Regular',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    gap: 2,
  },
  iconLabel: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
});
