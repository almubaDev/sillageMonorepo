import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AuthProvider } from './src/utils/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppContent() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'AlanSans-Regular': require('./assets/fonts/AlanSans-Regular.ttf'),
        'AlanSans-Bold': require('./assets/fonts/AlanSans-Bold.ttf'),
        'Lato-Regular': require('./assets/fonts/Lato-Regular.ttf'),
        'Lato-Bold': require('./assets/fonts/Lato-Bold.ttf'),
        'Lato-Italic': require('./assets/fonts/Lato-Italic.ttf'),
      });
      setFontsLoaded(true);
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}