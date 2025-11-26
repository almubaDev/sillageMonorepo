/**
 * PerfumesScreen - Gestión completa de perfumes (CRUD)
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, AdminPerfume } from '../../services/adminService';

// Función para formatear nombres (capitalizar y reemplazar guiones)
const formatName = (name: string): string => {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function PerfumesScreen() {
  const { t } = useTranslation();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [perfumes, setPerfumes] = useState<AdminPerfume[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Estados de modales
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);

  // Estados de formulario
  const [selectedPerfume, setSelectedPerfume] = useState<AdminPerfume | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    marca: '',
    perfumista: '',
    notas: '',
    acordes: '',
    is_private: false,
  });
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    marca: '',
  });
  const [saving, setSaving] = useState(false);

  // Estado bulk import
  const [bulkData, setBulkData] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  useEffect(() => {
    loadPerfumes();
  }, [search]);

  const loadPerfumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.listPerfumes({ search, limit: 100 });
      setPerfumes(data.items);
      setTotal(data.total);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al cargar perfumes';
      setError(errorMsg);
      console.error('Error cargando perfumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPerfumes();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      marca: '',
      perfumista: '',
      notas: '',
      acordes: '',
      is_private: false,
    });
    setFormErrors({ nombre: '', marca: '' });
    setSelectedPerfume(null);
  };

  const validateForm = (): boolean => {
    let errors = { nombre: '', marca: '' };
    let isValid = true;

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
      isValid = false;
    }

    if (!formData.marca.trim()) {
      errors.marca = 'La marca es obligatoria';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateModalVisible(true);
  };

  const handleOpenEdit = (perfume: AdminPerfume) => {
    setSelectedPerfume(perfume);
    setFormData({
      nombre: perfume.nombre,
      marca: perfume.marca,
      perfumista: perfume.perfumista || '',
      notas: perfume.notas ? (typeof perfume.notas === 'string' ? perfume.notas : JSON.stringify(perfume.notas)) : '',
      acordes: perfume.acordes ? perfume.acordes.join(', ') : '',
      is_private: perfume.is_private,
    });
    setEditModalVisible(true);
  };

  const handleOpenDelete = (perfume: AdminPerfume) => {
    setSelectedPerfume(perfume);
    setDeleteModalVisible(true);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Procesar notas
      let notasParsed: any = null;
      if (formData.notas.trim()) {
        try {
          notasParsed = JSON.parse(formData.notas);
        } catch {
          // Si no es JSON válido, convertir a array de strings
          notasParsed = formData.notas.split(',').map(n => n.trim()).filter(n => n);
        }
      }

      // Procesar acordes
      const acordesParsed = formData.acordes.trim()
        ? formData.acordes.split(',').map(a => a.trim()).filter(a => a)
        : [];

      const newPerfume = {
        nombre: formData.nombre.trim(),
        marca: formData.marca.trim(),
        perfumista: formData.perfumista.trim() || undefined,
        notas: notasParsed,
        acordes: acordesParsed.length > 0 ? acordesParsed : undefined,
        is_private: formData.is_private,
      };

      await adminService.createPerfume(newPerfume);
      Alert.alert('Éxito', 'Perfume creado correctamente');
      setCreateModalVisible(false);
      resetForm();
      await loadPerfumes();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al crear perfume';
      Alert.alert('Error', errorMsg);
      console.error('Error creando perfume:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !selectedPerfume) return;

    try {
      setSaving(true);

      // Procesar notas
      let notasParsed: any = null;
      if (formData.notas.trim()) {
        try {
          notasParsed = JSON.parse(formData.notas);
        } catch {
          notasParsed = formData.notas.split(',').map(n => n.trim()).filter(n => n);
        }
      }

      // Procesar acordes
      const acordesParsed = formData.acordes.trim()
        ? formData.acordes.split(',').map(a => a.trim()).filter(a => a)
        : [];

      const updateData = {
        nombre: formData.nombre.trim(),
        marca: formData.marca.trim(),
        perfumista: formData.perfumista.trim() || undefined,
        notas: notasParsed,
        acordes: acordesParsed.length > 0 ? acordesParsed : undefined,
        is_private: formData.is_private,
      };

      await adminService.updatePerfume(selectedPerfume.id, updateData);
      Alert.alert('Éxito', 'Perfume actualizado correctamente');
      setEditModalVisible(false);
      resetForm();
      await loadPerfumes();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al actualizar perfume';
      Alert.alert('Error', errorMsg);
      console.error('Error actualizando perfume:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPerfume) return;

    try {
      setSaving(true);
      await adminService.deletePerfume(selectedPerfume.id);
      Alert.alert('Éxito', 'Perfume eliminado correctamente');
      setDeleteModalVisible(false);
      setSelectedPerfume(null);
      await loadPerfumes();
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Error al eliminar perfume';
      Alert.alert('Error', errorMsg);
      console.error('Error eliminando perfume:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkData.trim()) {
      Alert.alert('Error', 'Debes ingresar datos para importar');
      return;
    }

    try {
      setBulkImporting(true);
      const perfumesArray = JSON.parse(bulkData);

      if (!Array.isArray(perfumesArray)) {
        throw new Error('El JSON debe ser un array de perfumes');
      }

      const result = await adminService.bulkImportPerfumes(perfumesArray);

      Alert.alert(
        'Importación completada',
        `Éxitos: ${result.success_count}\nErrores: ${result.error_count}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setBulkModalVisible(false);
              setBulkData('');
              loadPerfumes();
            }
          }
        ]
      );
    } catch (err: any) {
      const errorMsg = err.message || err.response?.data?.detail || 'Error al importar perfumes';
      Alert.alert('Error', errorMsg);
      console.error('Error importando perfumes:', err);
    } finally {
      setBulkImporting(false);
    }
  };

  const handleCsvUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setLoading(true);
      const file = result.assets[0];

      // Crear FormData
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: 'text/csv',
        name: file.name,
      } as any);

      const response = await adminService.uploadCsvPerfumes(formData);

      Alert.alert(
        t('admin:tools.uploadCsvSimple.successTitle'),
        t('admin:tools.uploadCsvSimple.successMessage', {
          success: response.success_count,
          errors: response.error_count,
        })
      );

      // Recargar lista de perfumes
      await loadPerfumes();
    } catch (error: any) {
      Alert.alert(t('common:error'), error.message || 'Error al cargar archivo');
    } finally {
      setLoading(false);
    }
  };

  if (loading && perfumes.length === 0) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando perfumes...</Text>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      {/* Header con búsqueda y botones */}
      <View style={{
        padding: 20,
        backgroundColor: AdminColors.white,
        borderBottomWidth: 1,
        borderBottomColor: AdminColors.border
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={adminStyles.pageTitle}>Perfumes</Text>
            <Text style={adminStyles.cardSubtitle}>Total: {total} perfumes</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary]}
              onPress={() => setBulkModalVisible(true)}
            >
              <MaterialCommunityIcons name="file-upload" size={20} color={AdminColors.textPrimary} />
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Importar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.button, { backgroundColor: '#EC4899' }]}
              onPress={handleCsvUpload}
            >
              <MaterialCommunityIcons name="file-upload" size={20} color={AdminColors.white} />
              <Text style={adminStyles.buttonText}>{t('admin:tools.uploadCsvSimple.title')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={adminStyles.button} onPress={handleOpenCreate}>
              <MaterialCommunityIcons name="plus" size={20} color={AdminColors.white} />
              <Text style={adminStyles.buttonText}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={adminStyles.input}
          placeholder="Buscar por nombre o marca..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={AdminColors.gray400}
        />
      </View>

      {/* Lista de perfumes */}
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <View style={adminStyles.card}>
            <Text style={{ color: AdminColors.error }}>{error}</Text>
          </View>
        )}

        {perfumes.length === 0 && !loading && (
          <View style={adminStyles.emptyContainer}>
            <MaterialCommunityIcons name="flower-outline" size={64} color={AdminColors.gray300} />
            <Text style={adminStyles.emptyText}>No se encontraron perfumes</Text>
            <TouchableOpacity style={[adminStyles.button, { marginTop: 16 }]} onPress={handleOpenCreate}>
              <MaterialCommunityIcons name="plus" size={20} color={AdminColors.white} />
              <Text style={adminStyles.buttonText}>Crear primer perfume</Text>
            </TouchableOpacity>
          </View>
        )}

        {perfumes.map((perfume) => (
          <View key={perfume.id} style={adminStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={adminStyles.cardTitle}>{formatName(perfume.nombre)}</Text>
                <Text style={adminStyles.cardSubtitle}>{formatName(perfume.marca)}</Text>
                {perfume.perfumista && (
                  <Text style={[adminStyles.cardSubtitle, { fontSize: 12, marginTop: 4 }]}>
                    Por: {formatName(perfume.perfumista)}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[adminStyles.badge, perfume.is_private ? adminStyles.badgeWarning : adminStyles.badgeSuccess]}>
                  <Text style={[adminStyles.badgeText, perfume.is_private ? adminStyles.badgeWarningText : adminStyles.badgeSuccessText]}>
                    {perfume.is_private ? 'Privado' : 'Público'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleOpenEdit(perfume)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: AdminColors.primaryLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color={AdminColors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleOpenDelete(perfume)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: AdminColors.errorLight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="delete" size={20} color={AdminColors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {perfume.acordes && perfume.acordes.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {perfume.acordes.slice(0, 5).map((acorde, index) => (
                  <View key={index} style={[adminStyles.badge, { backgroundColor: AdminColors.gray100 }]}>
                    <Text style={[adminStyles.badgeText, { color: AdminColors.textSecondary }]}>{formatName(acorde)}</Text>
                  </View>
                ))}
                {perfume.acordes.length > 5 && (
                  <View style={[adminStyles.badge, { backgroundColor: AdminColors.gray100 }]}>
                    <Text style={[adminStyles.badgeText, { color: AdminColors.textSecondary }]}>
                      +{perfume.acordes.length - 5}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modal Crear Perfume */}
      <Modal
        isVisible={createModalVisible}
        onBackdropPress={() => !saving && setCreateModalVisible(false)}
        onBackButtonPress={() => !saving && setCreateModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: AdminColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <Text style={adminStyles.pageTitle}>Crear Perfume</Text>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={adminStyles.inputLabel}>Nombre *</Text>
            <TextInput
              style={[adminStyles.input, formErrors.nombre ? adminStyles.inputError : null]}
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ej: Sauvage"
              editable={!saving}
            />
            {formErrors.nombre ? <Text style={adminStyles.inputErrorText}>{formErrors.nombre}</Text> : null}

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Marca *</Text>
            <TextInput
              style={[adminStyles.input, formErrors.marca ? adminStyles.inputError : null]}
              value={formData.marca}
              onChangeText={(text) => setFormData({ ...formData, marca: text })}
              placeholder="Ej: Dior"
              editable={!saving}
            />
            {formErrors.marca ? <Text style={adminStyles.inputErrorText}>{formErrors.marca}</Text> : null}

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Perfumista</Text>
            <TextInput
              style={adminStyles.input}
              value={formData.perfumista}
              onChangeText={(text) => setFormData({ ...formData, perfumista: text })}
              placeholder="Ej: François Demachy"
              editable={!saving}
            />

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Acordes (separados por comas)</Text>
            <TextInput
              style={adminStyles.input}
              value={formData.acordes}
              onChangeText={(text) => setFormData({ ...formData, acordes: text })}
              placeholder="Ej: fresco, amaderado, cítrico"
              editable={!saving}
            />

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Notas (JSON o lista separada por comas)</Text>
            <TextInput
              style={[adminStyles.input, { minHeight: 80 }]}
              value={formData.notas}
              onChangeText={(text) => setFormData({ ...formData, notas: text })}
              placeholder='{"salida":["bergamota","pimienta"],"corazon":["lavanda"],"fondo":["ambroxan"]}'
              multiline
              numberOfLines={4}
              editable={!saving}
            />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 }}
              onPress={() => setFormData({ ...formData, is_private: !formData.is_private })}
              disabled={saving}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: formData.is_private ? AdminColors.primary : AdminColors.gray400,
                backgroundColor: formData.is_private ? AdminColors.primary : 'transparent',
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {formData.is_private && (
                  <MaterialCommunityIcons name="check" size={16} color={AdminColors.white} />
                )}
              </View>
              <Text style={adminStyles.inputLabel}>Perfume privado</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: AdminColors.border, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
              onPress={() => setCreateModalVisible(false)}
              disabled={saving}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.button, { flex: 1 }, saving && adminStyles.buttonDisabled]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={AdminColors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={AdminColors.white} />
                  <Text style={adminStyles.buttonText}>Crear</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Perfume */}
      <Modal
        isVisible={editModalVisible}
        onBackdropPress={() => !saving && setEditModalVisible(false)}
        onBackButtonPress={() => !saving && setEditModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: AdminColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <Text style={adminStyles.pageTitle}>Editar Perfume</Text>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <Text style={adminStyles.inputLabel}>Nombre *</Text>
            <TextInput
              style={[adminStyles.input, formErrors.nombre ? adminStyles.inputError : null]}
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ej: Sauvage"
              editable={!saving}
            />
            {formErrors.nombre ? <Text style={adminStyles.inputErrorText}>{formErrors.nombre}</Text> : null}

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Marca *</Text>
            <TextInput
              style={[adminStyles.input, formErrors.marca ? adminStyles.inputError : null]}
              value={formData.marca}
              onChangeText={(text) => setFormData({ ...formData, marca: text })}
              placeholder="Ej: Dior"
              editable={!saving}
            />
            {formErrors.marca ? <Text style={adminStyles.inputErrorText}>{formErrors.marca}</Text> : null}

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Perfumista</Text>
            <TextInput
              style={adminStyles.input}
              value={formData.perfumista}
              onChangeText={(text) => setFormData({ ...formData, perfumista: text })}
              placeholder="Ej: François Demachy"
              editable={!saving}
            />

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Acordes (separados por comas)</Text>
            <TextInput
              style={adminStyles.input}
              value={formData.acordes}
              onChangeText={(text) => setFormData({ ...formData, acordes: text })}
              placeholder="Ej: fresco, amaderado, cítrico"
              editable={!saving}
            />

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Notas (JSON o lista separada por comas)</Text>
            <TextInput
              style={[adminStyles.input, { minHeight: 80 }]}
              value={formData.notas}
              onChangeText={(text) => setFormData({ ...formData, notas: text })}
              placeholder='{"salida":["bergamota","pimienta"],"corazon":["lavanda"],"fondo":["ambroxan"]}'
              multiline
              numberOfLines={4}
              editable={!saving}
            />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8 }}
              onPress={() => setFormData({ ...formData, is_private: !formData.is_private })}
              disabled={saving}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: formData.is_private ? AdminColors.primary : AdminColors.gray400,
                backgroundColor: formData.is_private ? AdminColors.primary : 'transparent',
                marginRight: 12,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {formData.is_private && (
                  <MaterialCommunityIcons name="check" size={16} color={AdminColors.white} />
                )}
              </View>
              <Text style={adminStyles.inputLabel}>Perfume privado</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: AdminColors.border, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
              onPress={() => setEditModalVisible(false)}
              disabled={saving}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.button, { flex: 1 }, saving && adminStyles.buttonDisabled]}
              onPress={handleEdit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={AdminColors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color={AdminColors.white} />
                  <Text style={adminStyles.buttonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Eliminar Perfume */}
      <Modal
        isVisible={deleteModalVisible}
        onBackdropPress={() => !saving && setDeleteModalVisible(false)}
        onBackButtonPress={() => !saving && setDeleteModalVisible(false)}
      >
        <View style={[adminStyles.card, { margin: 20 }]}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <MaterialCommunityIcons name="alert-circle" size={64} color={AdminColors.error} />
            <Text style={[adminStyles.pageTitle, { marginTop: 16, textAlign: 'center' }]}>
              ¿Eliminar perfume?
            </Text>
            {selectedPerfume && (
              <View style={{ marginTop: 12 }}>
                <Text style={[adminStyles.cardTitle, { textAlign: 'center' }]}>
                  {selectedPerfume.nombre}
                </Text>
                <Text style={[adminStyles.cardSubtitle, { textAlign: 'center' }]}>
                  {selectedPerfume.marca}
                </Text>
              </View>
            )}
            <Text style={[adminStyles.cardSubtitle, { marginTop: 12, textAlign: 'center' }]}>
              Esta acción no se puede deshacer
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
              onPress={() => setDeleteModalVisible(false)}
              disabled={saving}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonDanger, { flex: 1 }, saving && adminStyles.buttonDisabled]}
              onPress={handleDelete}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={AdminColors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="delete" size={20} color={AdminColors.white} />
                  <Text style={adminStyles.buttonText}>Eliminar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Importación Masiva */}
      <Modal
        isVisible={bulkModalVisible}
        onBackdropPress={() => !bulkImporting && setBulkModalVisible(false)}
        onBackButtonPress={() => !bulkImporting && setBulkModalVisible(false)}
        style={{ margin: 0, justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: AdminColors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: AdminColors.border }}>
            <Text style={adminStyles.pageTitle}>Importación Masiva</Text>
            <Text style={adminStyles.cardSubtitle}>Pega un array JSON con perfumes para importar</Text>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <View style={[adminStyles.card, { backgroundColor: AdminColors.gray50 }]}>
              <Text style={[adminStyles.inputLabel, { marginBottom: 8 }]}>Ejemplo de formato:</Text>
              <Text style={{ fontFamily: 'monospace', fontSize: 12, color: AdminColors.textSecondary }}>
                {`[
  {
    "nombre": "Sauvage",
    "marca": "Dior",
    "perfumista": "François Demachy",
    "acordes": ["fresco", "amaderado"],
    "notas": {"salida": ["bergamota"]},
    "is_private": false
  }
]`}
              </Text>
            </View>

            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>JSON de perfumes</Text>
            <TextInput
              style={[adminStyles.input, { minHeight: 200, fontFamily: 'monospace', fontSize: 12 }]}
              value={bulkData}
              onChangeText={setBulkData}
              placeholder="Pega aquí el JSON..."
              multiline
              numberOfLines={10}
              editable={!bulkImporting}
            />
          </ScrollView>

          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: AdminColors.border, flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
              onPress={() => setBulkModalVisible(false)}
              disabled={bulkImporting}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[adminStyles.button, adminStyles.buttonSuccess, { flex: 1 }, bulkImporting && adminStyles.buttonDisabled]}
              onPress={handleBulkImport}
              disabled={bulkImporting}
            >
              {bulkImporting ? (
                <ActivityIndicator color={AdminColors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="upload" size={20} color={AdminColors.white} />
                  <Text style={adminStyles.buttonText}>Importar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
