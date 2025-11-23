/**
 * AdminToolsScreen - Herramientas administrativas con acciones críticas
 * Requiere confirmación de contraseña para operaciones sensibles
 */
import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import { adminService, ResetResponse } from '../../services/adminService';

type ToolAction = 'reset_gifted_consultations' | 'reset_api_usage_all' | 'reset_api_usage_gemini' | 'reset_api_usage_openweather' | 'reset_api_usage_google_maps';

interface ToolConfig {
  id: ToolAction;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  warningLevel: 'medium' | 'high';
  category: 'consultations' | 'api';
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
];

export default function AdminToolsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleToolPress = (tool: ToolConfig) => {
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
                <Text style={adminStyles.cardTitle}>{tool.title}</Text>
                <Text style={adminStyles.cardSubtitle}>{tool.description}</Text>
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
                <Text style={adminStyles.cardTitle}>{tool.title}</Text>
                <Text style={adminStyles.cardSubtitle}>{tool.description}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={AdminColors.gray400} />
            </View>
          </TouchableOpacity>
        ))}
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
