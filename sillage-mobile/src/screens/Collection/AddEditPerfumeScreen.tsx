import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StarRating } from '../../components/StarRating';
import { MultiSelectIcons, MOMENTO_OPTIONS, ESTACION_OPTIONS } from '../../components/MultiSelectIcons';
import { TagInput } from '../../components/TagInput';
import {
  coleccionService,
  PerfumeColeccionData,
  ReposicionData,
} from '../../services/coleccionService';
import type { CollectionStackParamList } from '../../navigation/types';

type RouteType = RouteProp<CollectionStackParamList, 'AddEditPerfume'>;

export const AddEditPerfumeScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const perfumeId = route.params?.perfumeId;
  const isEditing = !!perfumeId;

  // Form state
  const [nombre, setNombre] = useState('');
  const [marca, setMarca] = useState('');
  const [perfumistas, setPerfumistas] = useState<string[]>([]);
  const [concentracion, setConcentracion] = useState('');
  const [familiaOlfativa, setFamiliaOlfativa] = useState('');
  const [momentoDia, setMomentoDia] = useState('');
  const [estacion, setEstacion] = useState('');
  const [acordes, setAcordes] = useState<string[]>([]);
  const [notas, setNotas] = useState<string[]>([]);
  const [calificacion, setCalificacion] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [cantidadMl, setCantidadMl] = useState('');
  const [imagen, setImagen] = useState('');

  // Reposiciones (solo edicion)
  const [reposiciones, setReposiciones] = useState<ReposicionData[]>([]);
  const [newRepoMl, setNewRepoMl] = useState('');
  const [newRepoCosto, setNewRepoCosto] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string }>({});
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const toggleHint = (key: string) => {
    setActiveHint(activeHint === key ? null : key);
  };

  useEffect(() => {
    if (isEditing && perfumeId) {
      loadPerfume(perfumeId);
    }
  }, [perfumeId]);

  const loadPerfume = async (id: number) => {
    try {
      setLoading(true);
      const data = await coleccionService.getPerfume(id);
      setNombre(data.nombre);
      setMarca(data.marca || '');
      setPerfumistas(data.perfumistas || []);
      setConcentracion(data.concentracion || '');
      setFamiliaOlfativa(data.familia_olfativa || '');
      setMomentoDia(data.momento_dia || '');
      setEstacion(data.estacion || '');
      setAcordes(data.acordes || []);
      setNotas(data.notas || []);
      setCalificacion(data.calificacion);
      setPrecio(data.precio !== null && data.precio !== undefined ? String(data.precio) : '');
      setCantidadMl(data.cantidad_ml ? String(data.cantidad_ml) : '1');
      setImagen(data.imagen || '');
      setReposiciones(data.reposiciones || []);
    } catch (error: any) {
      Alert.alert(t('collection:error.title'), t('collection:error.loadFailed'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: { nombre?: string } = {};
    if (!nombre.trim()) {
      newErrors.nombre = t('collection:form.errors.nameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const data = {
        nombre: nombre.trim(),
        marca: marca.trim(),
        perfumistas,
        concentracion: concentracion.trim(),
        familia_olfativa: familiaOlfativa.trim(),
        momento_dia: momentoDia,
        estacion: estacion,
        acordes,
        notas,
        calificacion,
        precio: precio ? parseFloat(precio) : null,
        cantidad_ml: cantidadMl ? parseInt(cantidadMl, 10) : 1,
        imagen: imagen.trim(),
      };

      if (isEditing && perfumeId) {
        await coleccionService.updatePerfume(perfumeId, data);
      } else {
        await coleccionService.createPerfume(data);
      }

      navigation.goBack();
    } catch (error: any) {
      const msg = isEditing
        ? t('collection:error.updateFailed')
        : t('collection:error.createFailed');
      Alert.alert(t('collection:error.title'), error.response?.data?.detail || msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddReposicion = async () => {
    if (!perfumeId || !newRepoMl) return;

    try {
      const repo = await coleccionService.addReposicion(perfumeId, {
        cantidad_ml: parseInt(newRepoMl, 10),
        costo: newRepoCosto ? parseFloat(newRepoCosto) : 0,
      });
      setReposiciones([...reposiciones, repo]);
      setNewRepoMl('');
      setNewRepoCosto('');
    } catch (error: any) {
      Alert.alert(t('collection:error.title'), error.response?.data?.detail || 'Error');
    }
  };

  const handleDeleteReposicion = async (repoId: number) => {
    try {
      await coleccionService.deleteReposicion(repoId);
      setReposiciones(reposiciones.filter((r) => r.id !== repoId));
    } catch (error: any) {
      Alert.alert(t('collection:error.title'), error.response?.data?.detail || 'Error');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const renderLabel = (label: string, hintKey: string) => (
    <View style={styles.labelRow}>
      <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => toggleHint(hintKey)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialCommunityIcons
          name="help-circle-outline"
          size={16}
          color={activeHint === hintKey ? colors.accent : colors.secondary + '80'}
        />
      </TouchableOpacity>
    </View>
  );

  const renderHint = (hintKey: string) =>
    activeHint === hintKey ? (
      <View style={[styles.hintBox, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '30' }]}>
        <Text style={[styles.hintText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
          {t(`collection:form.hints.${hintKey}`)}
        </Text>
      </View>
    ) : null;

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    options?: { keyboardType?: 'default' | 'numeric' | 'decimal-pad'; error?: string; multiline?: boolean; hintKey?: string }
  ) => (
    <View style={styles.fieldContainer}>
      {options?.hintKey ? renderLabel(label, options.hintKey) : (
        <Text style={[styles.fieldLabel, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
          {label}
        </Text>
      )}
      {options?.hintKey && renderHint(options.hintKey)}
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: options?.error ? '#EF4444' : colors.secondary + '40',
            fontFamily: 'Lato-Regular',
          },
          options?.multiline && styles.inputMultiline,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          if (options?.error) setErrors({});
        }}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
      />
      {options?.error && (
        <Text style={[styles.errorField, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>
          {options.error}
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marca */}
        {renderInput(t('collection:form.brand'), marca, setMarca, t('collection:form.brandPlaceholder'), { hintKey: 'brand' })}

        {/* Nombre */}
        {renderInput(t('collection:form.name'), nombre, setNombre, t('collection:form.namePlaceholder'), {
          error: errors.nombre, hintKey: 'name',
        })}

        {/* Concentracion */}
        {renderInput(t('collection:form.concentration'), concentracion, setConcentracion, t('collection:form.concentrationPlaceholder'), { hintKey: 'concentration' })}

        {/* Familia olfativa */}
        {renderInput(t('collection:form.family'), familiaOlfativa, setFamiliaOlfativa, t('collection:form.familyPlaceholder'), { hintKey: 'family' })}

        {/* Momento del dia */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('collection:form.momentLabel'), 'moment')}
          {renderHint('moment')}
          <MultiSelectIcons
            options={MOMENTO_OPTIONS}
            selected={momentoDia}
            onChange={setMomentoDia}
          />
        </View>

        {/* Estacion */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('collection:form.seasonLabel'), 'season')}
          {renderHint('season')}
          <MultiSelectIcons
            options={ESTACION_OPTIONS}
            selected={estacion}
            onChange={setEstacion}
          />
        </View>

        {/* Cantidad ML */}
        {renderInput(t('collection:form.quantity'), cantidadMl, setCantidadMl, t('collection:form.quantityPlaceholder'), {
          keyboardType: 'numeric', hintKey: 'quantity',
        })}

        {/* Precio */}
        {renderInput(t('collection:form.price'), precio, setPrecio, t('collection:form.pricePlaceholder'), {
          keyboardType: 'decimal-pad', hintKey: 'price',
        })}

        {/* Calificacion */}
        <View style={styles.fieldContainer}>
          <View style={styles.ratingHeader}>
            {renderLabel(t('collection:form.rating'), 'rating')}
            {calificacion !== null && (
              <TouchableOpacity onPress={() => setCalificacion(null)}>
                <Text style={[styles.clearRating, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                  x {t('collection:form.ratingClear')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {renderHint('rating')}
          <StarRating value={calificacion} onChange={setCalificacion} size={26} />
        </View>

        {/* Imagen */}
        {renderInput(t('collection:form.imageUrl'), imagen, setImagen, t('collection:form.imageUrlPlaceholder'), { hintKey: 'image' })}

        {/* Perfumistas */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('collection:form.perfumer'), 'perfumer')}
          {renderHint('perfumer')}
          <TagInput
            tags={perfumistas}
            onChange={setPerfumistas}
            placeholder={t('collection:form.perfumerPlaceholder')}
          />
        </View>

        {/* Acordes */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('collection:form.accords'), 'accords')}
          {renderHint('accords')}
          <TagInput
            tags={acordes}
            onChange={setAcordes}
            placeholder={t('collection:form.accordPlaceholder')}
          />
        </View>

        {/* Notas */}
        <View style={styles.fieldContainer}>
          {renderLabel(t('collection:form.notes'), 'notes')}
          {renderHint('notes')}
          <TagInput
            tags={notas}
            onChange={setNotas}
            placeholder={t('collection:form.notePlaceholder')}
          />
        </View>

        {/* Reposiciones (solo edicion) */}
        {isEditing && (
          <View style={styles.fieldContainer}>
            <Text style={[styles.sectionTitle, { color: colors.accent, fontFamily: 'AlanSans-Bold' }]}>
              {t('collection:reposicion.title')}
            </Text>

            {reposiciones.length > 0 ? (
              reposiciones.map((repo) => (
                <View key={repo.id} style={[styles.repoItem, { borderColor: colors.secondary + '25' }]}>
                  <Text style={[styles.repoText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                    {repo.cantidad_ml}{t('collection:reposicion.ml')} · ${Number(repo.costo).toLocaleString('es-CL')}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteReposicion(repo.id)}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={[styles.repoEmpty, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                {t('collection:reposicion.empty')}
              </Text>
            )}

            <View style={styles.repoAddRow}>
              <TextInput
                style={[styles.repoInput, { color: colors.text, borderColor: colors.secondary + '40', fontFamily: 'Lato-Regular' }]}
                placeholder={t('collection:reposicion.mlPlaceholder')}
                placeholderTextColor={colors.secondary}
                value={newRepoMl}
                onChangeText={setNewRepoMl}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.repoInput, { color: colors.text, borderColor: colors.secondary + '40', fontFamily: 'Lato-Regular' }]}
                placeholder={t('collection:reposicion.costPlaceholder')}
                placeholderTextColor={colors.secondary}
                value={newRepoCosto}
                onChangeText={setNewRepoCosto}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={[styles.repoAddButton, { backgroundColor: colors.secondary + '30' }]}
                onPress={handleAddReposicion}
                disabled={!newRepoMl}
              >
                <Text style={[styles.repoAddText, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                  + {t('collection:reposicion.add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botones */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.accent, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color={colors.bg} />
                <Text style={[styles.saveButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
                  {t('collection:form.save')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.cancelText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
              {t('collection:form.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  contentDesktop: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
  },
  hintBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorField: {
    fontSize: 12,
    marginTop: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  clearRating: {
    fontSize: 12,
  },
  ratingHint: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  repoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 6,
  },
  repoText: {
    fontSize: 14,
  },
  repoEmpty: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  repoAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  repoInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  repoAddButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repoAddText: {
    fontSize: 13,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
  },
  cancelText: {
    fontSize: 15,
  },
});
