import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { PerfumeColeccionData } from '../services/coleccionService';

interface ColeccionPerfumeCardProps {
  perfume: PerfumeColeccionData;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const MOMENTO_ICON_MAP: Record<string, { icon: string; color: string; label: string }> = {
  dia: { icon: 'weather-sunny', color: '#FBBF24', label: 'Dia' },
  noche: { icon: 'moon-waning-crescent', color: '#818CF8', label: 'Noche' },
};

const ESTACION_ICON_MAP: Record<string, { icon: string; color: string; label: string }> = {
  verano: { icon: 'waves', color: '#FB923C', label: 'Verano' },
  otono: { icon: 'leaf', color: '#D97706', label: 'Otoño' },
  invierno: { icon: 'weather-rainy', color: '#22D3EE', label: 'Invierno' },
  primavera: { icon: 'sprout', color: '#4ADE80', label: 'Primavera' },
};

export const ColeccionPerfumeCard: React.FC<ColeccionPerfumeCardProps> = ({
  perfume,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const momentoValues = perfume.momento_dia ? perfume.momento_dia.split(',').filter(Boolean) : [];
  const estacionValues = perfume.estacion ? perfume.estacion.split(',').filter(Boolean) : [];

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return null;
    if (price === 0) return 'gift';
    return `$${Number(price).toLocaleString('es-CL')}`;
  };

  const acordesTags = (perfume.acordes || []).map((a) => ({ text: a, type: 'acorde' as const }));
  const notasTags = (perfume.notas || []).map((n) => ({ text: n, type: 'nota' as const }));
  const allTags = [...acordesTags, ...notasTags];
  const hasIcons = momentoValues.length > 0 || estacionValues.length > 0;

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
          {/* Nombre - sin truncar */}
          <Text style={[styles.name, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {perfume.nombre}
          </Text>

          {/* Marca · Concentracion · Familia */}
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
          </View>

          {/* Iconos momento y estacion en su propia linea */}
          {hasIcons && (
            <View style={styles.iconsRow}>
              {momentoValues.map((val) => {
                const config = MOMENTO_ICON_MAP[val];
                return config ? (
                  <View key={val} style={styles.iconChip}>
                    <MaterialCommunityIcons name={config.icon as any} size={13} color={config.color} />
                    <Text style={[styles.iconChipText, { color: config.color, fontFamily: 'Lato-Regular' }]}>
                      {config.label}
                    </Text>
                  </View>
                ) : null;
              })}
              {estacionValues.map((val) => {
                const config = ESTACION_ICON_MAP[val];
                return config ? (
                  <View key={val} style={styles.iconChip}>
                    <MaterialCommunityIcons name={config.icon as any} size={13} color={config.color} />
                    <Text style={[styles.iconChipText, { color: config.color, fontFamily: 'Lato-Regular' }]}>
                      {config.label}
                    </Text>
                  </View>
                ) : null;
              })}
            </View>
          )}

          {/* Perfumistas */}
          {perfume.perfumistas && perfume.perfumistas.length > 0 ? (
            <View style={styles.perfumistaRow}>
              <MaterialCommunityIcons name="account-edit" size={12} color="#7DD3FC" />
              {perfume.perfumistas.map((p, i) => (
                <View key={`${p}-${i}`} style={[styles.perfumistaTag, { backgroundColor: '#7DD3FC18', borderColor: '#7DD3FC35' }]}>
                  <Text style={[styles.perfumistaTagText, { color: '#7DD3FC', fontFamily: 'Lato-Regular' }]}>
                    {p}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.perfumistaRow}>
              <MaterialCommunityIcons name="account-edit" size={12} color={colors.secondary + '60'} />
              <Text style={[styles.perfumistaText, { color: colors.secondary + '60', fontFamily: 'Lato-Regular', fontStyle: 'italic' }]}>
                {t('collection:card.undeclared')}
              </Text>
            </View>
          )}

          {/* Tags acordes + notas - desplegable */}
          {allTags.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.tagsToggle}
                onPress={() => setTagsExpanded(!tagsExpanded)}
              >
                <Text style={[styles.tagsToggleText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  {t('collection:form.accords')} & {t('collection:form.notes')} ({allTags.length})
                </Text>
                <MaterialCommunityIcons
                  name={tagsExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.secondary}
                />
              </TouchableOpacity>
              {tagsExpanded && (
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
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  iconChipText: {
    fontSize: 10,
  },
  perfumistaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  perfumistaText: {
    fontSize: 11,
  },
  perfumistaTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  perfumistaTagText: {
    fontSize: 10,
  },
  tagsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tagsToggleText: {
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
