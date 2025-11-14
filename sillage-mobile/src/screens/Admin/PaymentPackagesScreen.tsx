/**
 * PaymentPackagesScreen - Gestión de paquetes de pago
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
import { adminStyles, AdminColors } from './adminStyles';
import adminPaymentService, { PaqueteAdmin, PaqueteCreate, PaqueteUpdate } from '../../services/adminPaymentService';

export default function PaymentPackagesScreen() {
  const [paquetes, setPaquetes] = useState<PaqueteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPaquete, setEditingPaquete] = useState<PaqueteAdmin | null>(null);
  const [incluirInactivos, setIncluirInactivos] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    cantidad_consultas: '',
    precio: '',
    precio_anterior: '',
    moneda: 'USD',
    destacado: false,
    activo: true,
  });

  const loadPaquetes = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando paquetes, incluirInactivos:', incluirInactivos);
      const data = await adminPaymentService.getPaquetes(incluirInactivos);
      console.log('✅ Paquetes recibidos:', data);
      console.log('📦 Total de paquetes:', data.length);
      setPaquetes(data);
    } catch (error: any) {
      console.error('❌ Error cargando paquetes:', error);
      console.error('📝 Error detail:', error.response?.data);
      console.error('🔴 Error status:', error.response?.status);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudieron cargar los paquetes');
    } finally {
      setLoading(false);
    }
  }, [incluirInactivos]);

  useEffect(() => {
    loadPaquetes();
  }, [loadPaquetes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaquetes();
    setRefreshing(false);
  };

  const openCreateModal = () => {
    setEditingPaquete(null);
    setFormData({
      nombre: '',
      descripcion: '',
      cantidad_consultas: '',
      precio: '',
      precio_anterior: '',
      moneda: 'USD',
      destacado: false,
      activo: true,
    });
    setShowModal(true);
  };

  const openEditModal = (paquete: PaqueteAdmin) => {
    setEditingPaquete(paquete);
    setFormData({
      nombre: paquete.nombre,
      descripcion: paquete.descripcion || '',
      cantidad_consultas: paquete.cantidad_consultas.toString(),
      precio: paquete.precio.toString(),
      precio_anterior: paquete.precio_anterior?.toString() || '',
      moneda: paquete.moneda,
      destacado: paquete.destacado,
      activo: paquete.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }

    if (!formData.cantidad_consultas || parseInt(formData.cantidad_consultas) <= 0) {
      Alert.alert('Error', 'La cantidad de consultas debe ser mayor a 0');
      return;
    }

    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    if (formData.precio_anterior && parseFloat(formData.precio_anterior) <= parseFloat(formData.precio)) {
      Alert.alert('Error', 'El precio anterior debe ser mayor que el precio actual');
      return;
    }

    try {
      if (editingPaquete) {
        const updateData: PaqueteUpdate = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          cantidad_consultas: parseInt(formData.cantidad_consultas),
          precio: parseFloat(formData.precio),
          precio_anterior: formData.precio_anterior ? parseFloat(formData.precio_anterior) : undefined,
          moneda: formData.moneda,
          destacado: formData.destacado,
          activo: formData.activo,
        };

        await adminPaymentService.updatePaquete(editingPaquete.id, updateData);
        Alert.alert('Éxito', 'Paquete actualizado correctamente');
      } else {
        const createData: PaqueteCreate = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          cantidad_consultas: parseInt(formData.cantidad_consultas),
          precio: parseFloat(formData.precio),
          precio_anterior: formData.precio_anterior ? parseFloat(formData.precio_anterior) : undefined,
          moneda: formData.moneda,
          destacado: formData.destacado,
          activo: formData.activo,
        };

        await adminPaymentService.createPaquete(createData);
        Alert.alert('Éxito', 'Paquete creado y vinculado con PayPal automáticamente');
      }

      setShowModal(false);
      loadPaquetes();
    } catch (error: any) {
      console.error('Error guardando paquete:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el paquete');
    }
  };

  const handleDelete = (paquete: PaqueteAdmin) => {
    Alert.alert(
      'Confirmar',
      `¿Desactivar el paquete "${paquete.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminPaymentService.deletePaquete(paquete.id);
              Alert.alert('Éxito', 'Paquete desactivado');
              loadPaquetes();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'No se pudo desactivar el paquete');
            }
          },
        },
      ]
    );
  };

  const renderPaquete = (paquete: PaqueteAdmin) => (
    <View key={paquete.id} style={adminStyles.card}>
      {/* Header */}
      <View style={adminStyles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={adminStyles.cardTitle}>{paquete.nombre}</Text>
            {paquete.destacado && (
              <View style={[adminStyles.badge, adminStyles.badgeWarning, { marginLeft: 8 }]}>
                <Text style={[adminStyles.badgeText, adminStyles.badgeWarningText]}>Popular</Text>
              </View>
            )}
            {!paquete.activo && (
              <View style={[adminStyles.badge, { backgroundColor: AdminColors.gray200, marginLeft: 8 }]}>
                <Text style={[adminStyles.badgeText, { color: AdminColors.gray600 }]}>Inactivo</Text>
              </View>
            )}
          </View>
          {paquete.descripcion && (
            <Text style={adminStyles.cardSubtitle}>{paquete.descripcion}</Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', marginLeft: 12 }}>
          <TouchableOpacity
            onPress={() => openEditModal(paquete)}
            style={{
              backgroundColor: AdminColors.infoLight,
              padding: 10,
              borderRadius: 8,
              marginRight: 8
            }}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={AdminColors.info} />
          </TouchableOpacity>
          {paquete.activo && (
            <TouchableOpacity
              onPress={() => handleDelete(paquete)}
              style={{
                backgroundColor: AdminColors.errorLight,
                padding: 10,
                borderRadius: 8
              }}
            >
              <MaterialCommunityIcons name="delete" size={20} color={AdminColors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Precio e info */}
      <View style={adminStyles.divider} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: AdminColors.primary }}>
            ${paquete.precio} {paquete.moneda}
          </Text>
          {paquete.tiene_descuento && paquete.precio_anterior && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 14, color: AdminColors.textLight, textDecorationLine: 'line-through', marginRight: 8 }}>
                ${paquete.precio_anterior}
              </Text>
              <View style={[adminStyles.badge, adminStyles.badgeSuccess]}>
                <Text style={[adminStyles.badgeText, adminStyles.badgeSuccessText]}>
                  {paquete.porcentaje_descuento}% OFF
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: AdminColors.textPrimary }}>
            {paquete.cantidad_consultas} consultas
          </Text>
          <Text style={{ fontSize: 12, color: AdminColors.textSecondary, marginTop: 2 }}>
            ${paquete.precio_por_consulta.toFixed(2)} c/u
          </Text>
        </View>
      </View>

      {/* Botones de pago */}
      <View style={adminStyles.divider} />
      <View>
        <Text style={{ fontSize: 12, fontWeight: '600', color: AdminColors.textLight, marginBottom: 8 }}>
          MÉTODOS DE PAGO
        </Text>
        {paquete.botones_pago.map((boton) => (
          <View key={boton.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <MaterialCommunityIcons
              name={boton.activo ? 'check-circle' : 'close-circle'}
              size={18}
              color={boton.activo ? AdminColors.success : AdminColors.error}
            />
            <Text style={{ fontSize: 14, color: AdminColors.textPrimary, marginLeft: 8 }}>
              {boton.metodo_pago}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={adminStyles.loadingContainer}>
        <ActivityIndicator size="large" color={AdminColors.primary} />
        <Text style={adminStyles.loadingText}>Cargando paquetes...</Text>
      </View>
    );
  }

  return (
    <View style={adminStyles.container}>
      {/* Header */}
      <View style={adminStyles.pageHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={adminStyles.pageTitle}>Paquetes de Pago</Text>
            <Text style={adminStyles.pageSubtitle}>Gestionar paquetes de consultas</Text>
          </View>
          <TouchableOpacity style={adminStyles.button} onPress={openCreateModal}>
            <MaterialCommunityIcons name="plus" size={20} color={AdminColors.white} />
            <Text style={adminStyles.buttonText}>Crear</Text>
          </TouchableOpacity>
        </View>

        {/* Toggle inactivos */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <Text style={{ fontSize: 14, color: AdminColors.textSecondary }}>Mostrar paquetes inactivos</Text>
          <Switch
            value={incluirInactivos}
            onValueChange={setIncluirInactivos}
            trackColor={{ false: AdminColors.gray300, true: AdminColors.primary }}
            thumbColor={AdminColors.white}
          />
        </View>
      </View>

      {/* Lista */}
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AdminColors.primary]} />}
      >
        {paquetes.length === 0 ? (
          <View style={adminStyles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color={AdminColors.gray300} />
            <Text style={adminStyles.emptyText}>No hay paquetes</Text>
            <Text style={{ fontSize: 14, color: AdminColors.textLight, marginTop: 4 }}>Crea el primero</Text>
          </View>
        ) : (
          paquetes.map(renderPaquete)
        )}
      </ScrollView>

      {/* Modal Crear/Editar */}
      <Modal isVisible={showModal} onBackdropPress={() => setShowModal(false)} style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}>
        <View style={adminStyles.modalContent}>
          <View style={adminStyles.modalHeader}>
            <Text style={adminStyles.modalTitle}>
              {editingPaquete ? 'Editar Paquete' : 'Crear Paquete'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={AdminColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={adminStyles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Nombre */}
            <Text style={adminStyles.inputLabel}>Nombre *</Text>
            <TextInput
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ej: Paquete Premium"
              style={adminStyles.input}
            />

            {/* Descripción */}
            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Descripción</Text>
            <TextInput
              value={formData.descripcion}
              onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
              placeholder="Breve descripción del paquete"
              multiline
              numberOfLines={3}
              style={[adminStyles.input, { height: 80, textAlignVertical: 'top' }]}
            />

            {/* Cantidad */}
            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Cantidad de consultas *</Text>
            <TextInput
              value={formData.cantidad_consultas}
              onChangeText={(text) => setFormData({ ...formData, cantidad_consultas: text.replace(/[^0-9]/g, '') })}
              placeholder="30"
              keyboardType="numeric"
              style={adminStyles.input}
            />

            {/* Precio */}
            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Precio *</Text>
            <TextInput
              value={formData.precio}
              onChangeText={(text) => setFormData({ ...formData, precio: text })}
              placeholder="9.99"
              keyboardType="decimal-pad"
              style={adminStyles.input}
            />

            {/* Precio anterior */}
            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Precio anterior (opcional)</Text>
            <TextInput
              value={formData.precio_anterior}
              onChangeText={(text) => setFormData({ ...formData, precio_anterior: text })}
              placeholder="14.99"
              keyboardType="decimal-pad"
              style={adminStyles.input}
            />

            {/* Moneda */}
            <Text style={[adminStyles.inputLabel, { marginTop: 16 }]}>Moneda</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              {['USD', 'CLP', 'EUR'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  onPress={() => setFormData({ ...formData, moneda: currency })}
                  style={[
                    {
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      borderRadius: 8,
                      marginRight: 8,
                      borderWidth: 1,
                    },
                    formData.moneda === currency
                      ? { backgroundColor: AdminColors.primary, borderColor: AdminColors.primary }
                      : { backgroundColor: AdminColors.white, borderColor: AdminColors.border }
                  ]}
                >
                  <Text style={{
                    fontWeight: '600',
                    color: formData.moneda === currency ? AdminColors.white : AdminColors.textPrimary
                  }}>
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Destacado */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <Text style={adminStyles.inputLabel}>Marcar como Popular</Text>
              <Switch
                value={formData.destacado}
                onValueChange={(value) => setFormData({ ...formData, destacado: value })}
                trackColor={{ false: AdminColors.gray300, true: AdminColors.primary }}
                thumbColor={AdminColors.white}
              />
            </View>

            {/* Activo */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <Text style={adminStyles.inputLabel}>Activo</Text>
              <Switch
                value={formData.activo}
                onValueChange={(value) => setFormData({ ...formData, activo: value })}
                trackColor={{ false: AdminColors.gray300, true: AdminColors.primary }}
                thumbColor={AdminColors.white}
              />
            </View>

            {/* Nota */}
            {!editingPaquete && (
              <View style={[adminStyles.badge, adminStyles.badgeInfo, { marginTop: 20, padding: 12, alignSelf: 'stretch' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="information" size={16} color={AdminColors.info} />
                  <Text style={{ fontSize: 12, color: AdminColors.info, marginLeft: 8, flex: 1 }}>
                    Al crear el paquete, se vinculará automáticamente con PayPal
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Botones */}
          <View style={adminStyles.modalFooter}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1, marginRight: 8 }]}
            >
              <Text style={[adminStyles.buttonText, adminStyles.buttonSecondaryText]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[adminStyles.button, { flex: 1, marginLeft: 8 }]}
            >
              <Text style={adminStyles.buttonText}>{editingPaquete ? 'Actualizar' : 'Crear'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
