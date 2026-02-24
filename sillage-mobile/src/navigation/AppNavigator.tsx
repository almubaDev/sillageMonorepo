// sillage-mobile/src/navigation/AppNavigator.tsx

import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthContext } from '../utils/AuthContext';
import { RecommendStackParamList, ProfileStackParamList, CollectionStackParamList, RootTabParamList } from './types';

import { CollectionScreen } from '../screens/Collection/CollectionScreen';
import { AddEditPerfumeScreen } from '../screens/Collection/AddEditPerfumeScreen';
import { RecommendLanding } from '../screens/Recommend/RecommendLanding';
import { RecommendScreen } from '../screens/Recommend/RecommendScreen';
import { RecommendationResultScreen } from '../screens/Recommend/RecommendationResultScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { PurchaseScreen } from '../screens/Purchase/PurchaseScreen';
import { PaymentSuccessScreen } from '../screens/Purchase/PaymentSuccessScreen';
import { PaymentCancelScreen } from '../screens/Purchase/PaymentCancelScreen';
import AdminScreen from '../screens/Admin/AdminScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Drawer = createDrawerNavigator<RootTabParamList>();
const RecommendStack = createNativeStackNavigator<RecommendStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const CollectionStack = createNativeStackNavigator<CollectionStackParamList>();

// Stack Navigator para Coleccion (lista + agregar/editar perfume)
function CollectionStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <CollectionStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'AlanSans-Bold',
        },
      }}
    >
      <CollectionStack.Screen
        name="CollectionMain"
        component={CollectionScreen}
        options={{ headerShown: false }}
      />
      <CollectionStack.Screen
        name="AddEditPerfume"
        component={AddEditPerfumeScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.perfumeId
            ? t('collection:form.editTitle')
            : t('collection:form.addTitle'),
        })}
      />
    </CollectionStack.Navigator>
  );
}

// Stack Navigator para Recomendador (incluye la pantalla de resultado)
function RecommendStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <RecommendStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'AlanSans-Bold',
        },
      }}
    >
      <RecommendStack.Screen
        name="RecommendLanding"
        component={RecommendLanding}
        options={{ headerShown: false }}
      />
      <RecommendStack.Screen
        name="RecommendForm"
        component={RecommendScreen}
        options={{ headerShown: false }}
      />
      <RecommendStack.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerShown: true,
          title: t('history:title'),
        }}
      />
      <RecommendStack.Screen
        name="RecommendationResult"
        component={RecommendationResultScreen}
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: t('result:title'),
        }}
      />
    </RecommendStack.Navigator>
  );
}

// Stack Navigator para Perfil (incluye historial y pantalla de resultado)
function ProfileStackNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'AlanSans-Bold',
        },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="RecommendationResult"
        component={RecommendationResultScreen}
        options={{
          headerShown: true,
          title: t('result:title'),
        }}
      />
      <ProfileStack.Screen
        name="Purchase"
        component={PurchaseScreen}
        options={{
          headerShown: true,
          title: t('payments:purchase.title'),
        }}
      />
      <ProfileStack.Screen
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: t('payments:success.title'),
        }}
      />
      <ProfileStack.Screen
        name="PaymentCancel"
        component={PaymentCancelScreen}
        options={{
          headerShown: true,
          title: t('payments:cancel.title'),
        }}
      />
    </ProfileStack.Navigator>
  );
}

// Drawer Navigator para Desktop
function DesktopDrawerNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuthContext();

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: 'permanent',
        headerShown: true,
        headerLeft: () => null, // Ocultar botón hamburguesa
        swipeEnabled: false,
        drawerStyle: {
          backgroundColor: colors.bg,
          width: 280,
          borderRightWidth: 1,
          borderRightColor: colors.accent + '40',
        },
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.secondary,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          fontFamily: 'Lato-Bold',
          marginLeft: 8, // Más espacio entre icono y texto
        },
        drawerItemStyle: {
          borderRadius: 8,
          marginVertical: 4,
          paddingVertical: 8,
          paddingHorizontal: 12,
        },
        drawerActiveBackgroundColor: colors.accent + '20',
        headerStyle: {
          backgroundColor: colors.bg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '40',
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'AlanSans-Bold',
        },
      }}
    >
      <Drawer.Screen
        name="Colección"
        component={CollectionStackNavigator}
        options={{
          drawerLabel: t('collection:tabLabel'),
          title: t('collection:title'),
          headerShown: false,
          drawerIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name="view-agenda"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Recomendador"
        component={RecommendStackNavigator}
        options={{
          drawerLabel: t('recommend:tabLabel'),
          headerShown: false,
          drawerIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name="auto-fix"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Comprar"
        component={PurchaseScreen}
        options={{
          drawerLabel: t('payments:purchase.tabLabel'),
          title: t('payments:purchase.title'),
          drawerIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name="cart-plus"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="Perfil"
        component={ProfileStackNavigator}
        options={{
          drawerLabel: t('profile:tabLabel'),
          headerShown: false,
          drawerIcon: ({ focused, color }) => (
            <MaterialCommunityIcons
              name={focused ? "account-circle" : "account-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {user?.is_superuser && (
        <Drawer.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            drawerLabel: 'Admin',
            headerShown: false,
            drawerIcon: ({ focused, color }) => (
              <MaterialCommunityIcons
                name="shield-crown"
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
}

// Tab Navigator para Mobile
function MobileTabNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const iconSize = 28;

          if (route.name === 'Colección') {
            return <MaterialCommunityIcons name="view-agenda" size={iconSize} color={color} />;
          } else if (route.name === 'Recomendador') {
            return <MaterialCommunityIcons name="auto-fix" size={iconSize} color={color} />;
          } else if (route.name === 'Comprar') {
            return <MaterialCommunityIcons name="cart-plus" size={iconSize} color={color} />;
          } else if (route.name === 'Perfil') {
            return <MaterialCommunityIcons name={focused ? "account-circle" : "account-circle-outline"} size={iconSize} color={color} />;
          } else if (route.name === 'Admin') {
            return <MaterialCommunityIcons name="shield-crown" size={iconSize} color={color} />;
          }

          return <MaterialCommunityIcons name="help-circle" size={iconSize} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.accent,
          borderTopWidth: 1,
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'Lato-Bold',
        },
        headerStyle: {
          backgroundColor: colors.bg,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.accent + '40',
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
          fontFamily: 'AlanSans-Bold',
        },
      })}
    >
      <Tab.Screen
        name="Colección"
        component={CollectionStackNavigator}
        options={{
          tabBarLabel: t('collection:tabLabel'),
          title: t('collection:title'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Recomendador"
        component={RecommendStackNavigator}
        options={{
          tabBarLabel: t('recommend:tabLabel'),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Comprar"
        component={PurchaseScreen}
        options={{
          tabBarLabel: t('payments:purchase.tabLabel'),
          title: t('payments:purchase.title')
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: t('profile:tabLabel'),
          headerShown: false,
        }}
      />
      {user?.is_superuser && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarLabel: 'Admin',
            headerShown: false,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Componente principal que decide qué navegador usar
export const AppNavigator = () => {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  // En desktop usar drawer (sidebar), en mobile usar tabs (bottom navigation)
  return isDesktop ? <DesktopDrawerNavigator /> : <MobileTabNavigator />;
};