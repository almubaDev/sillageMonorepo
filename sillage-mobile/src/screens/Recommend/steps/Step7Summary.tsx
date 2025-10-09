import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeProvider';
import { RecommendationFormData } from '../types';

interface Step7SummaryProps {
  data: RecommendationFormData;
  onEdit: (step: number) => void;
}

export const Step7Summary: React.FC<Step7SummaryProps> = ({ data, onEdit }) => {
  const { colors } = useTheme();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const summaryItems = [
    {
      step: 1,
      icon: 'calendar',
      label: 'Fecha',
      value: data.fecha ? formatDate(data.fecha) : 'No definida',
    },
    {
      step: 2,
      icon: 'clock',
      label: 'Hora',
      value: data.hora ? formatTime(data.hora) : 'No definida',
    },
    {
      step: 3,
      icon: 'map-marker',
      label: 'Tipo de lugar',
      value: data.tipoLugar ? (data.tipoLugar === 'abierto' ? 'Lugar Abierto' : 'Lugar Cerrado') : 'No definido',
    },
    {
      step: 4,
      icon: 'calendar-star',
      label: 'Ocasión',
      value: data.ocasion || 'No definida',
    },
    {
      step: 5,
      icon: 'emoticon-happy',
      label: 'Expectativa',
      value: data.expectativa || 'No definida',
    },
    {
      step: 6,
      icon: 'tshirt-crew',
      label: 'Vestimenta',
      value: data.vestimenta || 'No definida',
    },
  ];

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <MaterialCommunityIcons 
        name="clipboard-check" 
        size={64} 
        color={colors.accent} 
        style={styles.icon}
      />
      
      <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
        Resumen de tu consulta
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
        Revisa los datos antes de obtener tu recomendación
      </Text>

      <View style={styles.list}>
        {summaryItems.map((item) => (
          <View
            key={item.step}
            style={[styles.summaryCard, { 
              backgroundColor: colors.bg, 
              borderColor: colors.accent + '30' 
            }]}
          >
            <View style={styles.cardContent}>
              <MaterialCommunityIcons 
                name={item.icon as any} 
                size={24} 
                color={colors.accent} 
              />
              <View style={styles.textContent}>
                <Text style={[styles.label, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  {item.label}
                </Text>
                <Text style={[styles.value, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                  {item.value}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.accent + '20' }]}
              onPress={() => onEdit(item.step)}
            >
              <MaterialCommunityIcons name="pencil" size={18} color={colors.accent} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[styles.infoBox, { backgroundColor: colors.accent + '10' }]}>
        <MaterialCommunityIcons name="information" size={20} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
          Consultaremos el clima y analizaremos tu colección para darte la mejor recomendación
        </Text>
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
  list: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  textContent: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});