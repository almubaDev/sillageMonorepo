// sillage-mobile/src/navigation/AppNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { RecommendStackParamList, ProfileStackParamList, RootTabParamList } from './types';

import { CollectionScreen } from '../screens/Collection/CollectionScreen';
import { RecommendScreen } from '../screens/Recommend/RecommendScreen';
import { RecommendationResultScreen } from '../screens/Recommend/RecommendationResultScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RecommendStack = createNativeStackNavigator<RecommendStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Stack Navigator para Recomendador (incluye la pantalla de resultado)
function RecommendStackNavigator() {
  const { colors } = useTheme();

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
        name="RecommendForm"
        component={RecommendScreen}
        options={{ headerShown: false }}
      />
      <RecommendStack.Screen
        name="RecommendationResult"
        component={RecommendationResultScreen}
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: 'Tu Recomendación',
        }}
      />
    </RecommendStack.Navigator>
  );
}

// Stack Navigator para Perfil (incluye historial y pantalla de resultado)
function ProfileStackNavigator() {
  const { colors } = useTheme();

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
        name="History"
        component={HistoryScreen}
        options={{
          headerShown: true,
          title: 'Historial de Consultas',
        }}
      />
      <ProfileStack.Screen
        name="RecommendationResult"
        component={RecommendationResultScreen}
        options={{
          headerShown: true,
          title: 'Detalle de Consulta',
        }}
      />
    </ProfileStack.Navigator>
  );
}

export const AppNavigator = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const iconSize = 28;

          if (route.name === 'Colección') {
            return <MaterialCommunityIcons name="view-agenda" size={iconSize} color={color} />;
          } else if (route.name === 'Recomendador') {
            return <MaterialCommunityIcons name="auto-fix" size={iconSize} color={color} />;
          } else if (route.name === 'Perfil') {
            return <MaterialCommunityIcons name={focused ? "account-circle" : "account-circle-outline"} size={iconSize} color={color} />;
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
        component={CollectionScreen}
        options={{ 
          tabBarLabel: 'Colección',
          title: 'Mi Colección'
        }}
      />
      <Tab.Screen 
        name="Recomendador" 
        component={RecommendStackNavigator}
        options={{ 
          tabBarLabel: 'Recomendador',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};