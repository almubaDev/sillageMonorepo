// sillage-mobile/src/screens/Recommend/RecommendationResultScreen.tsx

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuthContext } from '../../utils/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RecommendStackParamList } from '../../navigation/types';
import { formatPerfumeName, formatBrand, formatPerfumista } from '../../utils/formatters';

type Props = NativeStackScreenProps<RecommendStackParamList, 'RecommendationResult'>;

export const RecommendationResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user, refreshUser } = useAuthContext();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { recommendation } = route.params;

  // Usar consultas restantes de la recomendación si existe, sino del usuario actual
  const consultasRestantes = recommendation.consultas_restantes !== undefined
    ? recommendation.consultas_restantes
    : user?.consultas_restantes;

  useEffect(() => {
    // Si no hay consultas_restantes en la recomendación, refrescar usuario
    if (recommendation.consultas_restantes === undefined) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => null,
      headerTitle: 'Tu Recomendación',
    });
  }, [navigation]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getWeatherIcon = (temp: number) => {
    if (temp < 10) return 'snowflake';
    if (temp < 20) return 'weather-cloudy';
    if (temp < 28) return 'weather-partly-cloudy';
    return 'weather-sunny';
  };

  const cleanAIResponse = (response: string): string => {
    // Dividir por líneas
    const lines = response.split('\n');

    // Filtrar líneas vacías del inicio
    const nonEmptyLines = lines.filter(line => line.trim() !== '');

    if (nonEmptyLines.length === 0) return response;

    // La primera línea no vacía generalmente es el nombre del perfume
    // Verificar si contiene el nombre del perfume (con o sin guiones)
    const firstLine = nonEmptyLines[0].toLowerCase().trim();
    const perfumeName = recommendation.perfume_recomendado?.nombre?.toLowerCase();

    // Si la primera línea contiene el nombre del perfume, eliminarla
    if (perfumeName && (
      firstLine.includes(perfumeName) ||
      firstLine.includes(perfumeName.replace(/-/g, ' '))
    )) {
      // Quitar la primera línea y retornar el resto
      const remainingLines = nonEmptyLines.slice(1);
      return remainingLines.join('\n').trim();
    }

    return response.trim();
  };

  const handleNewRecommendation = () => {
    navigation.navigate('RecommendForm');
  };

  const handleGoToCollection = () => {
    // @ts-ignore - Navegar a otro stack
    navigation.navigate('Colección');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
    >
      {/* Header con icono de éxito */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
          <MaterialCommunityIcons name="check-circle" size={64} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          ¡Tenemos tu perfume ideal!
        </Text>
      </View>

      {/* Card principal del perfume */}
      {recommendation.perfume_recomendado ? (
        <View style={[styles.perfumeCard, { 
          backgroundColor: colors.accent + '15',
          borderColor: colors.accent
        }]}>
          <View style={styles.perfumeIcon}>
            <MaterialCommunityIcons name="bottle-tonic-plus" size={48} color={colors.accent} />
          </View>
          
          <Text style={[styles.perfumeName, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {formatPerfumeName(recommendation.perfume_recomendado.nombre)}
          </Text>

          <Text style={[styles.perfumeBrand, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
            {formatBrand(recommendation.perfume_recomendado.marca)}
          </Text>

          {recommendation.perfume_recomendado.perfumista && (
            <Text style={[styles.perfumista, { color: colors.secondary, fontFamily: 'Lato-Italic' }]}>
              por {formatPerfumista(recommendation.perfume_recomendado.perfumista)}
            </Text>
          )}

          {/* Acordes */}
          {recommendation.perfume_recomendado.acordes && 
           recommendation.perfume_recomendado.acordes.length > 0 && (
            <View style={styles.acordesContainer}>
              <Text style={[styles.sectionLabel, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
                Acordes principales
              </Text>
              <View style={styles.tags}>
                {recommendation.perfume_recomendado.acordes.slice(0, 5).map((acorde, index) => (
                  <View key={index} style={[styles.tag, {
                    backgroundColor: colors.bg,
                    borderColor: colors.accent
                  }]}>
                    <Text style={[styles.tagText, { color: colors.accent, fontFamily: 'Lato-Regular' }]}>
                      {formatPerfumeName(acorde)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.perfumeCard, { 
          backgroundColor: colors.secondary + '15',
          borderColor: colors.secondary
        }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.secondary} />
          <Text style={[styles.perfumeName, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
            No se pudo determinar el perfume
          </Text>
          <Text style={[styles.perfumeBrand, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            Intenta nuevamente con más información
          </Text>
        </View>
      )}

      {/* Explicación de la IA */}
      <View style={[styles.section, { backgroundColor: colors.bg, borderColor: colors.accent + '30' }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="robot" size={24} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            ¿Por qué este perfume?
          </Text>
        </View>
        <Text style={[styles.explanation, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
          {cleanAIResponse(recommendation.respuesta_ia)}
        </Text>
      </View>

      {/* Contexto del evento */}
      <View style={[styles.section, { backgroundColor: colors.bg, borderColor: colors.accent + '30' }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="information" size={24} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            Contexto del evento
          </Text>
        </View>

        <View style={styles.contextGrid}>
          <View style={styles.contextItem}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.accent} />
            <View style={styles.contextText}>
              <Text style={[styles.contextLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Fecha
              </Text>
              <Text style={[styles.contextValue, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {formatDate(recommendation.fecha_evento)}
              </Text>
            </View>
          </View>

          <View style={styles.contextItem}>
            <MaterialCommunityIcons name="map-marker" size={20} color={colors.accent} />
            <View style={styles.contextText}>
              <Text style={[styles.contextLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Lugar
              </Text>
              <Text style={[styles.contextValue, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {recommendation.lugar_nombre}
              </Text>
            </View>
          </View>

          <View style={styles.contextItem}>
            <MaterialCommunityIcons 
              name={getWeatherIcon(recommendation.temperatura)} 
              size={20} 
              color={colors.accent} 
            />
            <View style={styles.contextText}>
              <Text style={[styles.contextLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Clima
              </Text>
              <Text style={[styles.contextValue, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {recommendation.temperatura}°C - {recommendation.clima_descripcion}
              </Text>
            </View>
          </View>

          <View style={styles.contextItem}>
            <MaterialCommunityIcons name="calendar-star" size={20} color={colors.accent} />
            <View style={styles.contextText}>
              <Text style={[styles.contextLabel, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Ocasión
              </Text>
              <Text style={[styles.contextValue, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {recommendation.ocasion}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Consultas restantes */}
      {consultasRestantes !== undefined && consultasRestantes !== null && (
        <View style={[styles.consultasBox, {
          backgroundColor: (consultasRestantes ?? 0) > 5
            ? colors.accent + '10'
            : '#EF444420',
          borderColor: (consultasRestantes ?? 0) > 5
            ? colors.accent
            : '#EF4444'
        }]}>
          <MaterialCommunityIcons
            name="counter"
            size={20}
            color={(consultasRestantes ?? 0) > 5 ? colors.accent : '#EF4444'}
          />
          <Text style={[styles.consultasText, {
            color: colors.text,
            fontFamily: 'Lato-Regular'
          }]}>
            Te quedan <Text style={{ fontFamily: 'Lato-Bold' }}>
              {consultasRestantes} {consultasRestantes === 1 ? 'consulta' : 'consultas'}
            </Text> este mes
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={handleNewRecommendation}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={colors.bg} />
          <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            Nueva Recomendación
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, { borderColor: colors.accent }]}
          onPress={handleGoToCollection}
        >
          <MaterialCommunityIcons name="view-agenda" size={22} color={colors.accent} />
          <Text style={[styles.buttonText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
            Ver mi Colección
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  contentDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
  },
  perfumeCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
  },
  perfumeIcon: {
    marginBottom: 16,
  },
  perfumeName: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  perfumeBrand: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 4,
  },
  perfumista: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  acordesContainer: {
    width: '100%',
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tagText: {
    fontSize: 12,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
  },
  explanation: {
    fontSize: 15,
    lineHeight: 24,
  },
  contextGrid: {
    gap: 16,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contextText: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  contextValue: {
    fontSize: 14,
  },
  consultasBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  consultasText: {
    fontSize: 14,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
  },
  primaryButton: {},
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
  },
});