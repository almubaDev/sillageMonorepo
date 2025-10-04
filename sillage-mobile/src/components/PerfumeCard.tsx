import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface PerfumeCardProps {
  perfume: {
    id: number;
    nombre: string;
    marca: string;
    perfumista?: string;
    acordes?: string[];
    notas?: string[];
  };
  onRemove?: (id: number) => void;
  showRemove?: boolean;
}

export const PerfumeCard: React.FC<PerfumeCardProps> = ({ 
  perfume, 
  onRemove, 
  showRemove = true 
}) => {
  const { colors } = useTheme();

  const handleRemove = () => {
    if (onRemove && perfume.id) {
      onRemove(perfume.id);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.accent }]}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {perfume.nombre}
          </Text>
          <Text style={[styles.brand, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {perfume.marca}
          </Text>
        </View>

        {showRemove && onRemove && (
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: colors.secondary + '20' }]}
            onPress={handleRemove}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color={colors.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontSize: 16,
    marginBottom: 3,
  },
  brand: {
    fontSize: 13,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});