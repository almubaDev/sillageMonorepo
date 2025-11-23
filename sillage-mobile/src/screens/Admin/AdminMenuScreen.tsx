/**
 * AdminMenuScreen - Menú principal del panel administrativo
 * Muestra 5 opciones principales
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { adminStyles, AdminColors } from './adminStyles';
import { AdminStackParamList } from './AdminScreen';

type NavigationProp = StackNavigationProp<AdminStackParamList, 'AdminMenu'>;

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  screen: keyof AdminStackParamList;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Estadísticas generales del sistema',
    icon: 'view-dashboard',
    iconColor: AdminColors.primary,
    screen: 'Dashboard',
  },
  {
    id: 'users',
    title: 'Gestión de Usuarios',
    description: 'Administrar usuarios y permisos',
    icon: 'account-group',
    iconColor: AdminColors.success,
    screen: 'Users',
  },
  {
    id: 'perfumes',
    title: 'Gestión de Perfumes',
    description: 'Crear, editar y eliminar perfumes',
    icon: 'flower',
    iconColor: '#EC4899',
    screen: 'Perfumes',
  },
  {
    id: 'consultations',
    title: 'Regalar Consultas',
    description: 'Otorgar consultas gratuitas a usuarios',
    icon: 'gift',
    iconColor: AdminColors.warning,
    screen: 'Consultations',
  },
  {
    id: 'coupons',
    title: 'Cupones',
    description: 'Crear y gestionar cupones de descuento',
    icon: 'ticket-percent',
    iconColor: '#8B5CF6',
    screen: 'Coupons',
  },
  {
    id: 'payment-packages',
    title: 'Paquetes de Pago',
    description: 'Gestionar paquetes de consultas y PayPal',
    icon: 'package-variant',
    iconColor: '#0070ba',
    screen: 'PaymentPackages',
  },
  {
    id: 'financial',
    title: 'Reportes Financieros',
    description: 'Ingresos, ventas y análisis financiero',
    icon: 'chart-line',
    iconColor: '#10B981',
    screen: 'FinancialReports',
  },
  {
    id: 'api-usage',
    title: 'Uso de APIs',
    description: 'Monitorear consumo de Gemini, OpenWeather y Maps',
    icon: 'api',
    iconColor: '#F97316',
    screen: 'APIUsage',
  },
  {
    id: 'admin-tools',
    title: 'Herramientas',
    description: 'Acciones de reseteo y mantenimiento',
    icon: 'wrench',
    iconColor: '#EF4444',
    screen: 'AdminTools',
  },
];

export default function AdminMenuScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={adminStyles.container}>
      <ScrollView
        style={adminStyles.scrollContainer}
        contentContainerStyle={adminStyles.scrollContent}
      >
        <View style={adminStyles.pageHeader}>
          <Text style={adminStyles.pageTitle}>Panel de Administración</Text>
          <Text style={adminStyles.pageSubtitle}>
            Selecciona una sección para gestionar
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={adminStyles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[adminStyles.menuItemIcon, { backgroundColor: `${item.iconColor}15` }]}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={28}
                  color={item.iconColor}
                />
              </View>
              <View style={adminStyles.menuItemContent}>
                <Text style={adminStyles.menuItemTitle}>{item.title}</Text>
                <Text style={adminStyles.menuItemDescription}>{item.description}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={AdminColors.gray400}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
