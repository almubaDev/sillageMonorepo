import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeProvider';
import { EXPECTATIVAS } from '../types';

interface Step5ExpectationProps {
  value: string;
  onChange: (expectation: string) => void;
}

export const Step5Expectation: React.FC<Step5ExpectationProps> = ({ value, onChange }) => {
  const { colors } = useTheme();

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <MaterialCommunityIcons 
        name="emoticon-happy-outline" 
        size={64} 
        color={colors.accent} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        ¿Cómo quieres sentirte?
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        Selecciona la emoción que buscas proyectar
      </Text>

      <View style={styles.grid}>
        {EXPECTATIVAS.map((expectativa) => (
          <TouchableOpacity
            key={expectativa.id}
            style={[
              styles.card,
              {
                backgroundColor: value === expectativa.id ? expectativa.color + '20' : colors.bg,
                borderColor: value === expectativa.id ? expectativa.color : colors.secondary + '40',
              },
            ]}
            onPress={() => onChange(expectativa.id)}
          >
            <Text style={styles.emoji}>{expectativa.emoji}</Text>
            <Text
              style={[
                styles.cardLabel,
                {
                  color: value === expectativa.id ? colors.text : colors.secondary,
                  fontFamily: 'Lato-Bold',
                },
              ]}
            >
              {expectativa.label}
            </Text>
            {value === expectativa.id && (
              <View style={styles.checkMark}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={expectativa.color} 
                />
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
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  checkMark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});