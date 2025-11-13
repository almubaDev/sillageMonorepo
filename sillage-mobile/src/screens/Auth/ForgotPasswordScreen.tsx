import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { authService } from '../../services/authService';

interface Props {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError('');

    if (text && !text.includes('@')) {
      setEmailError(t('auth:forgotPassword.errors.emailInvalid'));
    }
  };

  const handleSendCode = async () => {
    // Limpiar errores
    setEmailError('');

    // Validaciones
    if (!email.trim()) {
      setEmailError(t('auth:forgotPassword.errors.emailRequired'));
      return;
    }

    if (!email.includes('@')) {
      setEmailError(t('auth:forgotPassword.errors.emailInvalid'));
      return;
    }

    try {
      setLoading(true);
      await authService.requestPasswordReset(email.trim());

      // Mostrar mensaje de éxito
      Alert.alert(
        t('auth:forgotPassword.success.title'),
        t('auth:forgotPassword.success.message'),
        [
          {
            text: 'OK',
            onPress: () => {
              // Navegar a la pantalla de reset con el email
              navigation.navigate('ResetPassword', { email: email.trim() });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error solicitando recuperación:', error);
      Alert.alert(
        t('auth:forgotPassword.errors.title'),
        error.response?.data?.detail || t('auth:forgotPassword.errors.sendFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header con ícono */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
            <MaterialCommunityIcons name="lock-reset" size={64} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('auth:forgotPassword.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('auth:forgotPassword.subtitle')}
          </Text>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('auth:forgotPassword.email')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: emailError ? '#EF4444' : colors.accent,
                  },
                ]}
                placeholder={t('auth:forgotPassword.emailPlaceholder')}
                placeholderTextColor={colors.secondary}
                value={email}
                onChangeText={validateEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              {emailError ? (
                <Text style={[styles.fieldError, { color: '#EF4444' }]}>{emailError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.bg }]}>
                  {t('auth:forgotPassword.sendButton')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginContainer}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <MaterialCommunityIcons name="arrow-left" size={18} color={colors.accent} />
              <Text style={[styles.backToLoginText, { color: colors.accent }]}>
                {t('auth:forgotPassword.backToLogin')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 10,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldError: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
