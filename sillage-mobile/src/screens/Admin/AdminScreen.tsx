/**
 * AdminScreen - Stack Navigator para el panel administrativo
 * Solo accesible para superusuarios
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminMenuScreen from './AdminMenuScreen';
import DashboardScreen from './DashboardScreen';
import UsersScreen from './UsersScreen';
import PerfumesScreen from './PerfumesScreen';
import ConsultationsScreen from './ConsultationsScreen';
import FinancialReportsScreen from './FinancialReportsScreen';
import CouponsScreen from './CouponsScreen';
import PaymentPackagesScreen from './PaymentPackagesScreen';
import APIUsageScreen from './APIUsageScreen';
import { AdminColors } from './adminStyles';

export type AdminStackParamList = {
  AdminMenu: undefined;
  Dashboard: undefined;
  Users: undefined;
  Perfumes: undefined;
  Consultations: undefined;
  FinancialReports: undefined;
  Coupons: undefined;
  PaymentPackages: undefined;
  APIUsage: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminScreen() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: AdminColors.white,
          borderBottomWidth: 1,
          borderBottomColor: AdminColors.border,
        },
        headerTintColor: AdminColors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="AdminMenu"
        component={AdminMenuScreen}
        options={{ title: 'Panel de Administración' }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: 'Gestión de Usuarios' }}
      />
      <Stack.Screen
        name="Perfumes"
        component={PerfumesScreen}
        options={{ title: 'Gestión de Perfumes' }}
      />
      <Stack.Screen
        name="Consultations"
        component={ConsultationsScreen}
        options={{ title: 'Regalar Consultas' }}
      />
      <Stack.Screen
        name="FinancialReports"
        component={FinancialReportsScreen}
        options={{ title: 'Reportes Financieros' }}
      />
      <Stack.Screen
        name="Coupons"
        component={CouponsScreen}
        options={{ title: 'Cupones' }}
      />
      <Stack.Screen
        name="PaymentPackages"
        component={PaymentPackagesScreen}
        options={{ title: 'Paquetes de Pago' }}
      />
      <Stack.Screen
        name="APIUsage"
        component={APIUsageScreen}
        options={{ title: 'Uso de APIs' }}
      />
    </Stack.Navigator>
  );
}
