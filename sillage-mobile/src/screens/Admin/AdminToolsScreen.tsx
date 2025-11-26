/**
 * AdminToolsScreen - Herramientas administrativas con acciones críticas
 * Requiere confirmación de contraseña para operaciones sensibles
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, ResetResponse, FinancialSnapshot } from '../../services/adminService';

type ToolAction = 'reset_gifted_consultations' | 'reset_api_usage_all' | 'reset_api_usage_gemini' | 'reset_api_usage_openweather' | 'reset_api_usage_google_maps' | 'upload_csv_simple';

interface ToolConfig {
  id: ToolAction;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  warningLevel: 'low' | 'medium' | 'high';
  category: 'consultations' | 'api' | 'perfumes';
  requiresPassword?: boolean;
}

const TOOLS: ToolConfig[] = [
  {
    id: 'reset_gifted_consultations',
    title: 'Resetear Historial de Regalos',
    description: 'Elimina el historial de consultas regaladas (no afecta consultas de usuarios)',
    icon: 'gift-off',
    iconColor: AdminColors.warning,
    warningLevel: 'medium',
    category: 'consultations',
  },
  {
    id: 'reset_api_usage_all',
    title: 'Resetear Uso de Todas las APIs',
    description: 'Elimina TODOS los registros históricos de uso de APIs',
    icon: 'database-remove',
    iconColor: AdminColors.error,
    warningLevel: 'high',
    category: 'api',
  },
  {
    id: 'reset_api_usage_gemini',
    title: 'Resetear Uso de Gemini',
    description: 'Elimina solo los registros de uso de Google Gemini',
    icon: 'robot-off',
    iconColor: '#4285F4',
    warningLevel: 'medium',
    category: 'api',
  },
  {
    id: 'reset_api_usage_openweather',
    title: 'Resetear Uso de OpenWeather',
    description: 'Elimina solo los registros de uso de OpenWeather',
    icon: 'weather-cloudy-alert',
    iconColor: '#EB6E4B',
    warningLevel: 'medium',
    category: 'api',
  },
  {
    id: 'reset_api_usage_google_maps',
    title: 'Resetear Uso de Google Maps',
    description: 'Elimina solo los registros de uso de Google Maps',
    icon: 'map-marker-off',
    iconColor: '#34A853',
    warningLevel: 'medium',
    category: 'api',
  },
  {
    id: 'upload_csv_simple',
    title: 'Carga Simple CSV',  // Será reemplazado por traducción
    description: 'Cargar perfumes desde archivo CSV',
    icon: 'file-upload',
    iconColor: '#EC4899',  // Rosa/Pink
    warningLevel: 'low',
    category: 'perfumes',
    requiresPassword: false,
  },
];

export default function AdminToolsScreen() {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Financial Snapshots
  const [snapshots, setSnapshots] = useState<FinancialSnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSnapshots = async () => {
    try {
      const data = await adminService.getFinancialSnapshots(30);
      setSnapshots(data);
    } catch (error) {
      console.error('Error loading snapshots:', error);
    } finally {
      setSnapshotsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSnapshots();
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

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
    } catch (error: any) {
      Alert.alert(t('common:error'), error.message || 'Error al cargar archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleToolPress = (tool: ToolConfig) => {
    // Si es CSV upload, ejecutar directamente sin modal
    if (tool.id === 'upload_csv_simple') {
      handleCsvUpload();
      return;
    }

    setSelectedTool(tool);
    setPassword('');
    setModalVisible(true);
  };

  const executeAction = async () => {
    if (!selectedTool || !password.trim()) {
      Alert.alert('Error', 'Debes ingresar tu contraseña');
      return;
    }

    setLoading(true);

    try {
      let response: ResetResponse;

      switch (selectedTool.id) {
        case 'reset_gifted_consultations':
          response = await adminService.resetGiftedConsultations(password);
          break;
        case 'reset_api_usage_all':
          response = await adminService.resetAPIUsage(password);
          break;
        case 'reset_api_usage_gemini':
          response = await adminService.resetAPIUsage(password, 'gemini');
          break;
        case 'reset_api_usage_openweather':
          response = await adminService.resetAPIUsage(password, 'openweather');
          break;
        case 'reset_api_usage_google_maps':
          response = await adminService.resetAPIUsage(password, 'google_maps');
          break;
        default:
          throw new Error('Acción no reconocida');
      }

      if (response.success) {
        closeModal();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Error al ejecutar la operación';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTool(null);
    setPassword('');
  };

  return (
    <View style={adminStyles.container}>
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={adminStyles.pageHeader}>
          <Text style={adminStyles.pageTitle}>Herramientas de Admin</Text>
          <Text style={adminStyles.pageSubtitle}>
            Acciones críticas que requieren confirmación
          </Text>
        </View>

        {/* Warning Banner */}
        <View style={[adminStyles.card, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="alert" size={24} color="#D97706" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '600', color: '#92400E', marginBottom: 4 }}>
                Zona de Precaución
              </Text>
              <Text style={{ fontSize: 13, color: '#92400E' }}>
                Estas acciones son irreversibles. Requieren tu contraseña de superusuario para ejecutarse.
              </Text>
            </View>
          </View>
        </View>

        {/* Consultas Section */}
        <Text style={[adminStyles.sectionTitle, { marginTop: 8, marginBottom: 12 }]}>
          Historial de Consultas Regaladas
        </Text>

        {TOOLS.filter(t => t.category === 'consultations').map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[adminStyles.card, { marginBottom: 12 }]}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[
                adminStyles.menuItemIcon,
                { backgroundColor: tool.warningLevel === 'high' ? '#FEE2E2' : '#FEF3C7' }
              ]}>
                <MaterialCommunityIcons name={tool.icon} size={24} color={tool.iconColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={adminStyles.cardTitle}>
                  {tool.id === 'upload_csv_simple' ? t('admin:tools.uploadCsvSimple.title') : tool.title}
                </Text>
                <Text style={adminStyles.cardSubtitle}>
                  {tool.id === 'upload_csv_simple' ? t('admin:tools.uploadCsvSimple.description') : tool.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={AdminColors.gray400} />
            </View>
          </TouchableOpacity>
        ))}

        {/* API Usage Section */}
        <Text style={[adminStyles.sectionTitle, { marginTop: 16, marginBottom: 12 }]}>
          Seguimiento de APIs
        </Text>

        {TOOLS.filter(t => t.category === 'api').map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[adminStyles.card, { marginBottom: 12 }]}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[
                adminStyles.menuItemIcon,
                { backgroundColor: tool.warningLevel === 'high' ? '#FEE2E2' : '#FEF3C7' }
              ]}>
                <MaterialCommunityIcons name={tool.icon} size={24} color={tool.iconColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={adminStyles.cardTitle}>
                  {tool.id === 'upload_csv_simple' ? t('admin:tools.uploadCsvSimple.title') : tool.title}
                </Text>
                <Text style={adminStyles.cardSubtitle}>
                  {tool.id === 'upload_csv_simple' ? t('admin:tools.uploadCsvSimple.description') : tool.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={AdminColors.gray400} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Perfumes Section */}
        <Text style={[adminStyles.sectionTitle, { marginTop: 16, marginBottom: 12 }]}>
          Gestión de Perfumes
        </Text>

        {TOOLS.filter(t => t.category === 'perfumes').map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[adminStyles.card, { marginBottom: 12 }]}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[
                adminStyles.menuItemIcon,
                { backgroundColor: 'rgba(236, 72, 153, 0.1)' }  // Rosa claro para perfumes
              ]}>
                <MaterialCommunityIcons name={tool.icon} size={24} color={tool.iconColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={adminStyles.cardTitle}>
                  {tool.id === 'upload_csv_simple' ? t('admin:tools.uploadCsvSimple.title') : tool.title}
                </Text>
                <Text style={adminStyles.cardSubtitle}>
                  {tool.id === 'upload_csv_simple' ? t('admin:tools.uploadCsvSimple.description') : tool.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={AdminColors.gray400} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Financial Logs Section */}
        <Text style={[adminStyles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>
          Historial Financiero Diario
        </Text>

        <View style={[adminStyles.card, { padding: 0, overflow: 'hidden' }]}>
          {/* Table Header */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: AdminColors.gray100,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderBottomWidth: 1,
            borderBottomColor: AdminColors.gray200,
          }}>
            <Text style={{ flex: 1.2, fontSize: 12, fontWeight: '600', color: AdminColors.textSecondary }}>
              Fecha
            </Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: AdminColors.textSecondary, textAlign: 'right' }}>
              Ingresos
            </Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: AdminColors.textSecondary, textAlign: 'right' }}>
              Gastos
            </Text>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: AdminColors.textSecondary, textAlign: 'right' }}>
              Margen
            </Text>
          </View>

          {/* Table Body */}
          {snapshotsLoading ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={AdminColors.primary} />
              <Text style={{ marginTop: 8, fontSize: 13, color: AdminColors.textSecondary }}>
                Cargando historial...
              </Text>
            </View>
          ) : snapshots.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <MaterialCommunityIcons name="calendar-blank" size={32} color={AdminColors.gray400} />
              <Text style={{ marginTop: 8, fontSize: 13, color: AdminColors.textSecondary }}>
                No hay registros aún
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: AdminColors.gray400, textAlign: 'center' }}>
                Los snapshots se generan automáticamente cada día
              </Text>
            </View>
          ) : (
            snapshots.map((snapshot, index) => {
              const marginColor = snapshot.margin >= 0 ? AdminColors.success : AdminColors.error;
              return (
                <View
                  key={snapshot.date}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: index % 2 === 0 ? AdminColors.white : AdminColors.gray50,
                    borderBottomWidth: index < snapshots.length - 1 ? 1 : 0,
                    borderBottomColor: AdminColors.gray100,
                  }}
                >
                  <Text style={{ flex: 1.2, fontSize: 13, color: AdminColors.textPrimary }}>
                    {new Date(snapshot.date + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 13, color: AdminColors.success, textAlign: 'right', fontWeight: '500' }}>
                    ${snapshot.revenue.toFixed(2)}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 13, color: AdminColors.error, textAlign: 'right', fontWeight: '500' }}>
                    ${snapshot.api_costs_total.toFixed(2)}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 13, color: marginColor, textAlign: 'right', fontWeight: '600' }}>
                    ${snapshot.margin.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Info Note */}
        <View style={{ marginTop: 12, marginBottom: 24 }}>
          <Text style={{ fontSize: 12, color: AdminColors.gray400, textAlign: 'center' }}>
            Los snapshots se generan automáticamente al acceder al panel de admin
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: AdminColors.white,
            borderRadius: 16,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: selectedTool?.warningLevel === 'high' ? '#FEE2E2' : '#FEF3C7',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <MaterialCommunityIcons
                  name={selectedTool?.icon || 'alert'}
                  size={32}
                  color={selectedTool?.iconColor || AdminColors.warning}
                />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: AdminColors.textPrimary, textAlign: 'center' }}>
                {selectedTool?.title}
              </Text>
              <Text style={{ fontSize: 14, color: AdminColors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                {selectedTool?.description}
              </Text>
            </View>

            {/* Warning */}
            {selectedTool?.warningLevel === 'high' && (
              <View style={{
                backgroundColor: '#FEE2E2',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 13, color: '#991B1B', textAlign: 'center' }}>
                  Esta acción es IRREVERSIBLE y afectará a todos los registros.
                </Text>
              </View>
            )}

            {/* Password Input */}
            <Text style={[adminStyles.label, { marginBottom: 8 }]}>
              Confirma tu contraseña de superusuario:
            </Text>
            <TextInput
              style={[adminStyles.input, { marginBottom: 16 }]}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor={AdminColors.gray400}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              autoCapitalize="none"
            />

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[adminStyles.button, adminStyles.buttonSecondary, { flex: 1 }]}
                onPress={closeModal}
                disabled={loading}
              >
                <Text style={adminStyles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  adminStyles.button,
                  { flex: 1, backgroundColor: selectedTool?.warningLevel === 'high' ? AdminColors.error : AdminColors.warning },
                  (loading || !password.trim()) && { opacity: 0.5 }
                ]}
                onPress={executeAction}
                disabled={loading || !password.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={AdminColors.white} />
                ) : (
                  <Text style={adminStyles.buttonText}>Ejecutar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
