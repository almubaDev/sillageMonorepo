import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { PerfumeCard } from '../../components/PerfumeCard';
import { ConfirmModal } from '../../components/ConfirmModal';
import { perfumeService, PerfumeInCollection, Perfume } from '../../services/perfumeService';
import { useFocusEffect } from '@react-navigation/native';
import { formatPerfumeName, formatBrand } from '../../utils/formatters';
import { useLanguageChange } from '../../hooks/useLanguageChange';

export const CollectionScreen = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Limpiar errores cuando cambia el idioma
  useLanguageChange(() => {
    setError(null);
    setCreateErrors({ nombre: '', marca: '' });
  });
  
  const [perfumes, setPerfumes] = useState<PerfumeInCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [perfumeToDelete, setPerfumeToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Perfume[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newPerfume, setNewPerfume] = useState({
    nombre: '',
    marca: '',
    perfumista: '',
    notas: '',
    acordes: '',
  });
  const [createErrors, setCreateErrors] = useState({
    nombre: '',
    marca: '',
  });

  // Cargar colección al montar el componente por primera vez
  useEffect(() => {
    loadCollection();
  }, []);

  // Recargar cuando volvemos a la pantalla (si ya se cargó antes)
  useFocusEffect(
    useCallback(() => {
      // Solo recargar si ya hemos cargado datos antes
      if (hasLoadedOnce) {
        loadCollection();
      }
    }, [hasLoadedOnce])
  );

  const loadCollection = async () => {
    try {
      setError(null);
      // Solo mostrar spinner de carga completo si no hay datos aún
      if (!hasLoadedOnce) {
        setLoading(true);
      }

      const data = await perfumeService.getMyCollection();
      setPerfumes(data);
      setHasLoadedOnce(true);
    } catch (error: any) {
      console.error('❌ Error cargando colección:', error);
      const errorMessage = error.response?.data?.detail || t('collection:error.loadFailed');
      setError(errorMessage);

      // Solo mostrar Alert si ya habíamos cargado antes y falló
      if (hasLoadedOnce) {
        Alert.alert(t('collection:error.title'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollection();
    setRefreshing(false);
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setSearching(true);
      const results = await perfumeService.search({ q: query, limit: 20 });
      setSearchResults(results);
    } catch (error: any) {
      console.error('Error en búsqueda:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToCollection = async (perfumeId: number) => {
    try {
      await perfumeService.addToCollection(perfumeId);
      setSearchModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      await loadCollection();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || t('collection:error.createFailed');
      Alert.alert(t('collection:error.title'), errorMsg);
    }
  };

  const handleRemoveFromCollection = (perfumeId: number) => {
    setPerfumeToDelete(perfumeId);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!perfumeToDelete) return;

    try {
      await perfumeService.removeFromCollection(perfumeToDelete);
      setDeleteModalVisible(false);
      setPerfumeToDelete(null);
      await loadCollection();
    } catch (error: any) {
      Alert.alert(t('collection:error.title'), error.response?.data?.detail || t('collection:error.deleteFailed'));
    }
  };

  const validateCreateForm = () => {
    let errors = { nombre: '', marca: '' };
    let isValid = true;

    if (!newPerfume.nombre.trim()) {
      errors.nombre = t('collection:create.errors.nameRequired');
      isValid = false;
    } else if (newPerfume.nombre.trim().length < 2) {
      errors.nombre = t('collection:create.errors.nameMinLength');
      isValid = false;
    }

    if (!newPerfume.marca.trim()) {
      errors.marca = t('collection:create.errors.brandRequired');
      isValid = false;
    } else if (newPerfume.marca.trim().length < 2) {
      errors.marca = t('collection:create.errors.brandMinLength');
      isValid = false;
    }

    setCreateErrors(errors);
    return isValid;
  };

  const handleCreatePerfume = async () => {
    // Validar formulario
    if (!validateCreateForm()) {
      return;
    }

    try {
      setCreating(true);
      const perfumeData = {
        nombre: newPerfume.nombre.trim(),
        marca: newPerfume.marca.trim(),
        perfumista: newPerfume.perfumista.trim() || undefined,
        notas: newPerfume.notas ? newPerfume.notas.split(',').map(n => n.trim()).filter(n => n) : [],
        acordes: newPerfume.acordes ? newPerfume.acordes.split(',').map(a => a.trim()).filter(a => a) : [],
      };

      await perfumeService.createPerfume(perfumeData);
      setCreateModalVisible(false);
      setNewPerfume({ nombre: '', marca: '', perfumista: '', notas: '', acordes: '' });
      setCreateErrors({ nombre: '', marca: '' });
      await loadCollection();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || t('collection:error.createFailed');
      if (errorMsg.toLowerCase().includes('ya existe')) {
        Alert.alert(t('collection:create.errors.duplicateTitle'), t('collection:create.errors.duplicateMessage'));
      } else {
        Alert.alert(t('collection:error.title'), errorMsg);
      }
    } finally {
      setCreating(false);
    }
  };

  const updateNewPerfumeField = (field: string, value: string) => {
    setNewPerfume({ ...newPerfume, [field]: value });
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (field === 'nombre' || field === 'marca') {
      setCreateErrors({ ...createErrors, [field]: '' });
    }
  };

  if (loading && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {t('collection:loading')}
        </Text>
      </View>
    );
  }

  // Mostrar error solo si falló la carga inicial
  if (error && !hasLoadedOnce) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={colors.secondary} />
        <Text style={[styles.errorText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {error}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.accent }]}
          onPress={loadCollection}
        >
          <MaterialCommunityIcons name="refresh" size={20} color={colors.bg} />
          <Text style={[styles.retryButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
            {t('collection:error.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {perfumes.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="flask-empty-outline" size={80} color={colors.secondary} />
          <Text style={[styles.emptyText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('collection:empty.title')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('collection:empty.subtitle')}
          </Text>
        </View>
      ) : (
        <View style={[styles.listContainer, isDesktop && styles.listContainerDesktop]}>
          <FlatList
            data={perfumes}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => (
              <PerfumeCard 
                perfume={item} 
                onRemove={handleRemoveFromCollection}
                showRemove={true}
              />
            )}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
          />
        </View>
      )}

      <View style={styles.fab}>
        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.accent }]}
          onPress={() => setSearchModalVisible(true)}
        >
          <MaterialCommunityIcons name="magnify" size={26} color={colors.bg} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabButton, { backgroundColor: colors.accent }]}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={26} color={colors.bg} />
        </TouchableOpacity>
      </View>

      <Modal
        isVisible={searchModalVisible}
        onBackdropPress={() => {
          setSearchModalVisible(false);
          setSearchQuery('');
          setSearchResults([]);
        }}
        style={styles.modalFullScreen}
        animationIn="slideInRight"
        animationOut="slideOutRight"
      >
        <View style={[styles.modalFullContent, { backgroundColor: colors.bg }]}>
          <View style={[styles.searchHeader, { backgroundColor: colors.bg, borderBottomColor: colors.accent + '30' }]}>
            <TouchableOpacity 
              onPress={() => {
                setSearchModalVisible(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.secondary} />
              <TextInput
                style={[styles.searchInputInline, { 
                  color: colors.text,
                  fontFamily: 'Lato-Regular'
                }]}
                placeholder={t('collection:search.placeholder')}
                placeholderTextColor={colors.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.secondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {searching && searchQuery.length >= 1 ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[styles.searchingText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                {t('collection:search.searching')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.resultItem, { borderBottomColor: colors.secondary + '15' }]}
                  onPress={() => handleAddToCollection(item.id)}
                >
                  <View style={styles.resultInfo}>
                    <Text style={[styles.resultName, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                      {formatPerfumeName(item.nombre)}
                    </Text>
                    <Text style={[styles.resultBrand, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                      {formatBrand(item.marca)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle" size={28} color={colors.accent} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 1 && !searching ? (
                  <View style={styles.emptySearch}>
                    <MaterialCommunityIcons name="flask-empty-off-outline" size={64} color={colors.secondary} />
                    <Text style={[styles.emptySearchText, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
                      {t('collection:search.noResults')}
                    </Text>
                    <Text style={[styles.emptySearchSubtext, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                      {t('collection:search.noResultsHint')}
                    </Text>
                  </View>
                ) : null
              }
              contentContainerStyle={styles.resultsList}
            />
          )}
        </View>
      </Modal>

      <Modal
        isVisible={createModalVisible}
        onBackdropPress={() => setCreateModalVisible(false)}
        style={styles.modal}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
              {t('collection:create.title')}
            </Text>
            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.helpText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('collection:create.helpText')}
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: createErrors.nombre ? '#EF4444' : colors.accent,
                fontFamily: 'Lato-Regular'
              }]}
              placeholder={t('collection:create.namePlaceholder')}
              placeholderTextColor={colors.secondary}
              value={newPerfume.nombre}
              onChangeText={(text) => updateNewPerfumeField('nombre', text)}
            />
            {createErrors.nombre ? (
              <Text style={[styles.fieldError, { color: '#EF4444' }]}>{createErrors.nombre}</Text>
            ) : null}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: createErrors.marca ? '#EF4444' : colors.accent,
                fontFamily: 'Lato-Regular'
              }]}
              placeholder={t('collection:create.brandPlaceholder')}
              placeholderTextColor={colors.secondary}
              value={newPerfume.marca}
              onChangeText={(text) => updateNewPerfumeField('marca', text)}
            />
            {createErrors.marca ? (
              <Text style={[styles.fieldError, { color: '#EF4444' }]}>{createErrors.marca}</Text>
            ) : null}
          </View>

          <TextInput
            style={[styles.input, {
              backgroundColor: colors.bg,
              color: colors.text,
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder={t('collection:create.perfumerPlaceholder')}
            placeholderTextColor={colors.secondary}
            value={newPerfume.perfumista}
            onChangeText={(text) => updateNewPerfumeField('perfumista', text)}
          />

          <TextInput
            style={[styles.input, {
              backgroundColor: colors.bg,
              color: colors.text,
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder={t('collection:create.accordsPlaceholder')}
            placeholderTextColor={colors.secondary}
            value={newPerfume.acordes}
            onChangeText={(text) => updateNewPerfumeField('acordes', text)}
            multiline
          />

          <TextInput
            style={[styles.input, {
              backgroundColor: colors.bg,
              color: colors.text,
              borderColor: colors.accent,
              fontFamily: 'Lato-Regular'
            }]}
            placeholder={t('collection:create.notesPlaceholder')}
            placeholderTextColor={colors.secondary}
            value={newPerfume.notas}
            onChangeText={(text) => updateNewPerfumeField('notas', text)}
            multiline
          />

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.accent }]}
            onPress={handleCreatePerfume}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={[styles.createButtonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
                {creating ? t('collection:create.creating') : t('collection:create.button')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteModalVisible}
        title={t('collection:delete.title')}
        message={t('collection:delete.message')}
        confirmText={t('collection:delete.confirm')}
        cancelText={t('collection:delete.cancel')}
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setPerfumeToDelete(null);
        }}
      />
    </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  listContainerDesktop: {
    maxWidth: 800,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    gap: 12,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalFullScreen: {
    margin: 0,
  },
  modalFullContent: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputInline: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    marginTop: 12,
    fontSize: 14,
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    marginBottom: 4,
  },
  resultBrand: {
    fontSize: 14,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptySearchText: {
    marginTop: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  emptySearchSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
  },
  input: {
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
  },
  createButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    fontSize: 16,
  },
  helpText: {
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  fieldError: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});