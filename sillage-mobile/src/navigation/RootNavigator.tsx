import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../utils/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useTheme } from '../theme/ThemeProvider';

export const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuthContext();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
};