import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export const RecommendScreen = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        Recomendador
      </Text>
      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        Obtén recomendaciones personalizadas
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});