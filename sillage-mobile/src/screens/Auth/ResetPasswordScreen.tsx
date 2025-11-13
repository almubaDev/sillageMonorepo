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
  route: any;
}

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { email } = route.params || {};

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleResetPassword = async () => {
    // Limpiar errores
    setCodeError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validaciones
    let hasError = false;

    if (!code.trim()) {
      setCodeError(t('auth:resetPassword.errors.codeRequired'));
      hasError = true;
    } else if (code.trim().length !== 6) {
      setCodeError(t('auth:resetPassword.errors.codeInvalid'));
      hasError = true;
    } else if (!/^\d{6}$/.test(code.trim())) {
      setCodeError(t('auth:resetPassword.errors.codeInvalid'));
      hasError = true;
    }

    if (!newPassword) {
      setPasswordError(t('auth:resetPassword.errors.passwordRequired'));
      hasError = true;
    } else if (newPassword.length < 8) {
      setPasswordError(t('auth:resetPassword.errors.passwordMinLength'));
      hasError = true;
    } else if (!/[A-Z]/.test(newPassword)) {
      setPasswordError(t('auth:resetPassword.errors.passwordUppercase'));
      hasError = true;
    } else if (!/[0-9]/.test(newPassword)) {
      setPasswordError(t('auth:resetPassword.errors.passwordNumber'));
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('auth:resetPassword.errors.confirmRequired'));
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('auth:resetPassword.errors.passwordsDoNotMatch'));
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);
      await authService.resetPassword(email, code.trim(), newPassword);

      // Mostrar mensaje de éxito
      Alert.alert(
        t('auth:resetPassword.success.title'),
        t('auth:resetPassword.success.message'),
        [
          {
            text: 'OK',
            onPress: () => {
              // Volver al login
              navigation.navigate('Login');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error restableciendo contraseña:', error);

      const errorMessage = error.response?.data?.detail || t('auth:resetPassword.errors.resetFailed');

      // Identificar el tipo de error
      if (errorMessage.toLowerCase().includes('expirado')) {
        setCodeError(t('auth:resetPassword.errors.codeExpired'));
      } else if (errorMessage.toLowerCase().includes('inválido') || errorMessage.toLowerCase().includes('invalid')) {
        setCodeError(t('auth:resetPassword.errors.codeInvalid'));
      } else {
        Alert.alert(
          t('auth:resetPassword.errors.title'),
          errorMessage
        );
      }
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
            <MaterialCommunityIcons name="key" size={64} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('auth:resetPassword.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {t('auth:resetPassword.subtitle', { email })}
          </Text>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Código de 6 dígitos */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('auth:resetPassword.code')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.codeInput,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: codeError ? '#EF4444' : colors.accent,
                  },
                ]}
                placeholder="000000"
                placeholderTextColor={colors.secondary}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setCodeError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              {codeError ? (
                <Text style={[styles.fieldError, { color: '#EF4444' }]}>{codeError}</Text>
              ) : null}
            </View>

            {/* Nueva contraseña */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('auth:resetPassword.newPassword')}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInputField,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: passwordError ? '#EF4444' : colors.accent,
                    },
                  ]}
                  placeholder={t('auth:resetPassword.passwordPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setPasswordError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.fieldError, { color: '#EF4444' }]}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                {t('auth:resetPassword.confirmPassword')}
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInputField,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: confirmPasswordError ? '#EF4444' : colors.accent,
                    },
                  ]}
                  placeholder={t('auth:resetPassword.confirmPlaceholder')}
                  placeholderTextColor={colors.secondary}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color={colors.secondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.fieldError, { color: '#EF4444' }]}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Requisitos de contraseña */}
            <View style={[styles.requirementsBox, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.requirementsTitle, { color: colors.text }]}>
                {t('auth:resetPassword.requirements.title')}
              </Text>
              <Text style={[styles.requirementText, { color: colors.secondary }]}>
                • {t('auth:resetPassword.requirements.minLength')}
              </Text>
              <Text style={[styles.requirementText, { color: colors.secondary }]}>
                • {t('auth:resetPassword.requirements.uppercase')}
              </Text>
              <Text style={[styles.requirementText, { color: colors.secondary }]}>
                • {t('auth:resetPassword.requirements.number')}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.bg }]}>
                  {t('auth:resetPassword.resetButton')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.resendText, { color: colors.accent }]}>
                {t('auth:resetPassword.resendCode')}
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
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
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
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
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
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInputField: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  requirementsBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginBottom: 4,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
