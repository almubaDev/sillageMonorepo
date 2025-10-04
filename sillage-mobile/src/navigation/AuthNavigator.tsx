import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { useTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.accent,
        headerShadowVisible: false,
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Registro',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};