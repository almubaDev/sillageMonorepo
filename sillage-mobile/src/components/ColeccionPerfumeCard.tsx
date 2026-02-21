import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { PerfumeColeccionData } from '../services/coleccionService';

interface ColeccionPerfumeCardProps {
  perfume: PerfumeColeccionData;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const MOMENTO_ICON_MAP: Record<string, { icon: string; color: string }> = {
  dia: { icon: 'weather-sunny', color: '#FBBF24' },
  noche: { icon: 'moon-waning-crescent', color: '#818CF8' },
};

const ESTACION_ICON_MAP: Record<string, { icon: string; color: string }> = {
  verano: { icon: 'waves', color: '#FB923C' },
  otono: { icon: 'leaf', color: '#D97706' },
  invierno: { icon: 'weather-rainy', color: '#22D3EE' },
  primavera: { icon: 'sprout', color: '#4ADE80' },
};

export const ColeccionPerfumeCard: React.FC<ColeccionPerfumeCardProps> = ({
  perfume,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const momentoValues = perfume.momento_dia ? perfume.momento_dia.split(',').filter(Boolean) : [];
  const estacionValues = perfume.estacion ? perfume.estacion.split(',').filter(Boolean) : [];

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return null;
    if (price === 0) return 'gift';
    return `$${Number(price).toLocaleString('es-CL')}`;
  };

  const allTags = [
    ...(perfume.acordes || []).map((a) => ({ text: a, type: 'acorde' as const })),
    ...(perfume.notas || []).map((n) => ({ text: n, type: 'nota' as const })),
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.bg, borderColor: colors.secondary + '25' }]}>
      <View style={styles.mainRow}>
        {/* Imagen */}
        <View style={styles.imageContainer}>
          {perfume.imagen ? (
            <Image
              source={{ uri: perfume.imagen }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.secondary + '15' }]}>
              <MaterialCommunityIcons name="spray" size={36} color={colors.secondary + '60'} />
            </View>
          )}
        </View>

        {/* Info central */}
        <View style={styles.infoContainer}>
          <Text style={[styles.name, { color: colors.text, fontFamily: 'AlanSans-Bold' }]} numberOfLines={1}>
            {perfume.nombre}
          </Text>

          {/* Marca · Concentracion · Familia · Iconos */}
          <View style={styles.metaRow}>
            {!!perfume.marca && (
              <Text style={[styles.metaText, { color: colors.accent, fontFamily: 'Lato-Regular' }]}>
                {perfume.marca}
              </Text>
            )}
            {!!perfume.concentracion && (
              <>
                <Text style={[styles.metaDot, { color: colors.secondary }]}> · </Text>
                <Text style={[styles.metaText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  {perfume.concentracion}
                </Text>
              </>
            )}
            {!!perfume.familia_olfativa && (
              <>
                <Text style={[styles.metaDot, { color: colors.secondary }]}> · </Text>
                <Text style={[styles.metaText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  {perfume.familia_olfativa}
                </Text>
              </>
            )}

            {/* Iconos momento y estacion inline */}
            {(momentoValues.length > 0 || estacionValues.length > 0) && (
              <>
                <Text style={[styles.metaDot, { color: colors.secondary }]}> · </Text>
                {momentoValues.map((val) => {
                  const config = MOMENTO_ICON_MAP[val];
                  return config ? (
                    <MaterialCommunityIcons key={val} name={config.icon as any} size={14} color={config.color} style={{ marginHorizontal: 1 }} />
                  ) : null;
                })}
                {momentoValues.length > 0 && estacionValues.length > 0 && (
                  <Text style={[styles.metaDot, { color: colors.secondary }]}> · </Text>
                )}
                {estacionValues.map((val) => {
                  const config = ESTACION_ICON_MAP[val];
                  return config ? (
                    <MaterialCommunityIcons key={val} name={config.icon as any} size={14} color={config.color} style={{ marginHorizontal: 1 }} />
                  ) : null;
                })}
              </>
            )}
          </View>

          {/* Perfumista */}
          {!!perfume.perfumista && (
            <View style={styles.perfumistaRow}>
              <MaterialCommunityIcons name="account-edit" size={12} color={colors.secondary} />
              <Text style={[styles.perfumistaText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]} numberOfLines={1}>
                {perfume.perfumista}
              </Text>
            </View>
          )}
          {!perfume.perfumista && (
            <View style={styles.perfumistaRow}>
              <MaterialCommunityIcons name="account-edit" size={12} color={colors.secondary + '60'} />
              <Text style={[styles.perfumistaText, { color: colors.secondary + '60', fontFamily: 'Lato-Regular', fontStyle: 'italic' }]}>
                {t('collection:card.undeclared')}
              </Text>
            </View>
          )}

          {/* Tags acordes + notas */}
          {allTags.length > 0 && (
            <View style={styles.tagsContainer}>
              {allTags.map((tag, i) => (
                <View
                  key={`${tag.text}-${i}`}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: tag.type === 'acorde'
                        ? colors.accent + '18'
                        : '#4ADE80' + '18',
                      borderColor: tag.type === 'acorde'
                        ? colors.accent + '35'
                        : '#4ADE80' + '35',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      {
                        color: tag.type === 'acorde' ? colors.accent : '#4ADE80',
                        fontFamily: 'Lato-Regular',
                      },
                    ]}
                  >
                    {tag.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats + Acciones */}
        <View style={styles.rightColumn}>
          {/* Calificacion */}
          {perfume.calificacion !== null && perfume.calificacion !== undefined && (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={14} color={colors.accent} />
              <Text style={[styles.ratingText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
                {Number(perfume.calificacion).toFixed(1)}{t('collection:card.rating')}
              </Text>
            </View>
          )}

          {/* Precio */}
          {perfume.precio !== null && perfume.precio !== undefined && (
            <View style={styles.statRow}>
              {Number(perfume.precio) === 0 ? (
                <MaterialCommunityIcons name="gift" size={14} color="#4ADE80" />
              ) : (
                <Text style={[styles.priceText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                  {formatPrice(perfume.precio)}
                </Text>
              )}
            </View>
          )}

          {/* ML */}
          <Text style={[styles.mlText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {perfume.cantidad_ml} {t('collection:card.ml')}
          </Text>

          {/* Reposiciones */}
          {perfume.reposiciones && perfume.reposiciones.length > 0 && (
            <View style={styles.reposicionesContainer}>
              {perfume.reposiciones.map((repo) => (
                <Text key={repo.id} style={[styles.repoText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  +{repo.cantidad_ml}ml·${Number(repo.costo).toLocaleString('es-CL')}
                </Text>
              ))}
            </View>
          )}

          {/* Botones editar/eliminar */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => onEdit(perfume.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="pencil" size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(perfume.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  mainRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 90,
    height: 90,
    alignSelf: 'flex-start',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
  },
  perfumistaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfumistaText: {
    fontSize: 11,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
  },
  statRow: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 12,
  },
  mlText: {
    fontSize: 11,
  },
  reposicionesContainer: {
    alignItems: 'flex-end',
  },
  repoText: {
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
