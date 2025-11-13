// sillage-mobile/src/components/HistoryCard.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { formatPerfumeName, formatBrand } from '../utils/formatters';

interface HistoryCardProps {
  recommendation: {
    id: number;
    fecha_evento: string;
    hora_evento: string;
    lugar_nombre: string;
    clima_descripcion: string;
    temperatura: number;
    perfume_recomendado?: {
      nombre: string;
      marca: string;
    } | null;
    created_at: string;
  };
  onPress?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ recommendation, onPress }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = i18n.language === 'en' ? 'en-US' : 'es-ES';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getWeatherIcon = (temp: number) => {
    if (temp < 10) return 'snowflake';
    if (temp < 20) return 'weather-cloudy';
    if (temp < 28) return 'weather-partly-cloudy';
    return 'weather-sunny';
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.accent + '30' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Perfume recomendado */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="bottle-tonic-plus" size={24} color={colors.accent} />
        <View style={styles.perfumeInfo}>
          {recommendation.perfume_recomendado ? (
            <>
              <Text style={[styles.perfumeName, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {formatPerfumeName(recommendation.perfume_recomendado.nombre)}
              </Text>
              <Text style={[styles.perfumeBrand, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                {formatBrand(recommendation.perfume_recomendado.marca)}
              </Text>
            </>
          ) : (
            <Text style={[styles.perfumeName, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              {t('components:historyCard.noPerfume')}
            </Text>
          )}
        </View>
      </View>

      {/* Información de la consulta */}
      <View style={styles.infoGrid}>
        {/* Fecha y hora */}
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.secondary} />
          <Text style={[styles.infoText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            {formatDate(recommendation.fecha_evento)} • {recommendation.hora_evento}
          </Text>
        </View>

        {/* Ubicación */}
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color={colors.secondary} />
          <Text
            style={[styles.infoText, { color: colors.text, fontFamily: 'Lato-Regular' }]}
            numberOfLines={1}
          >
            {recommendation.lugar_nombre}
          </Text>
        </View>

        {/* Clima */}
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name={getWeatherIcon(recommendation.temperatura)}
            size={16}
            color={colors.secondary}
          />
          <Text style={[styles.infoText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
            {recommendation.temperatura}°C • {recommendation.clima_descripcion}
          </Text>
        </View>
      </View>

      {/* Indicador de ver más */}
      <View style={styles.footer}>
        <Text style={[styles.viewMore, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
          {t('components:historyCard.viewDetails')}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.accent} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  perfumeInfo: {
    flex: 1,
  },
  perfumeName: {
    fontSize: 16,
    marginBottom: 2,
  },
  perfumeBrand: {
    fontSize: 13,
  },
  infoGrid: {
    gap: 10,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  viewMore: {
    fontSize: 13,
  },
});
