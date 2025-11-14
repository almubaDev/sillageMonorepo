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
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal';
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
      const data = await adminPaymentService.getPaquetes(incluirInactivos);
      setPaquetes(data);
    } catch (error: any) {
      console.error('Error cargando paquetes:', error);
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
        // Actualizar
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
        // Crear
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
    <View key={paquete.id} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-gray-900">{paquete.nombre}</Text>
            {paquete.destacado && (
              <View className="ml-2 bg-purple-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-semibold text-purple-700">Popular</Text>
              </View>
            )}
            {!paquete.activo && (
              <View className="ml-2 bg-gray-100 px-2 py-1 rounded-full">
                <Text className="text-xs font-semibold text-gray-600">Inactivo</Text>
              </View>
            )}
          </View>
          {paquete.descripcion && (
            <Text className="text-sm text-gray-600 mt-1">{paquete.descripcion}</Text>
          )}
        </View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => openEditModal(paquete)}
            className="bg-blue-50 p-2 rounded-lg mr-2"
          >
            <Ionicons name="pencil" size={18} color="#3b82f6" />
          </TouchableOpacity>
          {paquete.activo && (
            <TouchableOpacity
              onPress={() => handleDelete(paquete)}
              className="bg-red-50 p-2 rounded-lg"
            >
              <Ionicons name="trash" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info */}
      <View className="flex-row justify-between items-center py-3 border-t border-gray-100">
        <View>
          <Text className="text-2xl font-bold text-purple-600">
            ${paquete.precio} {paquete.moneda}
          </Text>
          {paquete.tiene_descuento && paquete.precio_anterior && (
            <View className="flex-row items-center mt-1">
              <Text className="text-sm text-gray-400 line-through mr-2">
                ${paquete.precio_anterior}
              </Text>
              <Text className="text-xs font-semibold text-green-600">
                {paquete.porcentaje_descuento}% OFF
              </Text>
            </View>
          )}
        </View>
        <View className="items-end">
          <Text className="text-lg font-semibold text-gray-900">
            {paquete.cantidad_consultas} consultas
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            ${paquete.precio_por_consulta} por consulta
          </Text>
        </View>
      </View>

      {/* Botones de pago */}
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-xs font-semibold text-gray-500 mb-2">MÉTODOS DE PAGO:</Text>
        {paquete.botones_pago.map((boton) => (
          <View key={boton.id} className="flex-row items-center mb-1">
            <Ionicons
              name={boton.activo ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={boton.activo ? '#10b981' : '#ef4444'}
            />
            <Text className={`text-sm ml-2 ${boton.activo ? 'text-gray-700' : 'text-gray-400'}`}>
              {boton.metodo_pago}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#9333ea" />
        <Text className="text-gray-600 mt-4">Cargando paquetes...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-gray-900">Paquetes de Pago</Text>
          <TouchableOpacity
            onPress={openCreateModal}
            className="bg-purple-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-semibold ml-1">Crear</Text>
          </TouchableOpacity>
        </View>

        {/* Toggle inactivos */}
        <View className="flex-row items-center justify-between mt-3">
          <Text className="text-sm text-gray-600">Mostrar inactivos</Text>
          <Switch
            value={incluirInactivos}
            onValueChange={setIncluirInactivos}
            trackColor={{ false: '#d1d5db', true: '#9333ea' }}
          />
        </View>
      </View>

      {/* Lista */}
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {paquetes.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="cube-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4">No hay paquetes</Text>
            <Text className="text-gray-400 text-sm">Crea el primero</Text>
          </View>
        ) : (
          paquetes.map(renderPaquete)
        )}
      </ScrollView>

      {/* Modal Crear/Editar */}
      <Modal isVisible={showModal} onBackdropPress={() => setShowModal(false)}>
        <View className="bg-white rounded-xl p-6 max-h-[90%]">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            {editingPaquete ? 'Editar Paquete' : 'Crear Paquete'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nombre */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Nombre *</Text>
            <TextInput
              value={formData.nombre}
              onChangeText={(text) => setFormData({ ...formData, nombre: text })}
              placeholder="Ej: Paquete Premium"
              className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
            />

            {/* Descripción */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Descripción</Text>
            <TextInput
              value={formData.descripcion}
              onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
              placeholder="Breve descripción del paquete"
              multiline
              numberOfLines={3}
              className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
              style={{ textAlignVertical: 'top' }}
            />

            {/* Cantidad */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Cantidad de consultas *</Text>
            <TextInput
              value={formData.cantidad_consultas}
              onChangeText={(text) => setFormData({ ...formData, cantidad_consultas: text.replace(/[^0-9]/g, '') })}
              placeholder="30"
              keyboardType="numeric"
              className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
            />

            {/* Precio */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Precio *</Text>
            <TextInput
              value={formData.precio}
              onChangeText={(text) => setFormData({ ...formData, precio: text })}
              placeholder="9.99"
              keyboardType="decimal-pad"
              className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
            />

            {/* Precio anterior */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Precio anterior (opcional)</Text>
            <TextInput
              value={formData.precio_anterior}
              onChangeText={(text) => setFormData({ ...formData, precio_anterior: text })}
              placeholder="14.99"
              keyboardType="decimal-pad"
              className="bg-gray-100 px-4 py-3 rounded-lg mb-4"
            />

            {/* Moneda */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">Moneda</Text>
            <View className="flex-row mb-4">
              {['USD', 'CLP', 'EUR'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  onPress={() => setFormData({ ...formData, moneda: currency })}
                  className={`px-4 py-2 rounded-lg mr-2 ${
                    formData.moneda === currency ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`font-semibold ${formData.moneda === currency ? 'text-white' : 'text-gray-700'}`}
                  >
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Destacado */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-sm font-semibold text-gray-700">Marcar como Popular</Text>
              <Switch
                value={formData.destacado}
                onValueChange={(value) => setFormData({ ...formData, destacado: value })}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
              />
            </View>

            {/* Activo */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-sm font-semibold text-gray-700">Activo</Text>
              <Switch
                value={formData.activo}
                onValueChange={(value) => setFormData({ ...formData, activo: value })}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
              />
            </View>

            {/* Nota */}
            {!editingPaquete && (
              <View className="bg-blue-50 p-3 rounded-lg mb-4">
                <Text className="text-xs text-blue-700">
                  <Ionicons name="information-circle" size={12} /> Al crear el paquete, se vinculará automáticamente
                  con PayPal
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Botones */}
          <View className="flex-row mt-4">
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="flex-1 bg-gray-200 py-3 rounded-lg mr-2"
            >
              <Text className="text-center font-semibold text-gray-700">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} className="flex-1 bg-purple-600 py-3 rounded-lg ml-2">
              <Text className="text-center font-semibold text-white">
                {editingPaquete ? 'Actualizar' : 'Crear'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
