import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
  const { token, email } = route.params || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [success, setSuccess] = useState(false);

  // Si no hay token o email, mostrar error
  if (!token || !email) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
            <MaterialCommunityIcons name="link-off" size={64} color="#EF4444" />
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('auth:resetPassword.invalidLink')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('auth:resetPassword.invalidLinkDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
              {t('auth:resetPassword.requestNewLink')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backToLoginContainer}
            onPress={() => navigation.navigate('Login')}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.accent} />
            <Text style={[styles.backToLoginText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
              {t('auth:forgotPassword.backToLogin')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('auth:resetPassword.success.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('auth:resetPassword.success.message')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
              {t('auth:forgotPassword.backToLogin')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleResetPassword = async () => {
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

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
      await authService.resetPassword(email, token, newPassword);
      setSuccess(true);
    } catch (error: any) {
      console.error('Error restableciendo contraseña:', error);
      const errorMessage = error.response?.data?.detail || t('auth:resetPassword.errors.resetFailed');
      setPasswordError(errorMessage);
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
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
            <MaterialCommunityIcons name="key" size={64} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('auth:resetPassword.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('auth:resetPassword.subtitle', { email })}
          </Text>

          <View style={styles.form}>
            {/* Nueva contraseña */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
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
                      fontFamily: 'Lato-Regular',
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
                <Text style={[styles.fieldError, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
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
                      fontFamily: 'Lato-Regular',
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
                <Text style={[styles.fieldError, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Requisitos */}
            <View style={[styles.requirementsBox, { backgroundColor: colors.accent + '10' }]}>
              <Text style={[styles.requirementsTitle, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
                {t('auth:resetPassword.requirements.title')}
              </Text>
              <Text style={[styles.requirementText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                • {t('auth:resetPassword.requirements.minLength')}
              </Text>
              <Text style={[styles.requirementText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                • {t('auth:resetPassword.requirements.uppercase')}
              </Text>
              <Text style={[styles.requirementText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
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
                <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
                  {t('auth:resetPassword.resetButton')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
            >
              <Text style={[styles.backToLoginText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
                {t('auth:resetPassword.requestNewLink')}
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
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
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
  },
  fieldError: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  backToLoginContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  backToLoginText: {
    fontSize: 15,
  },
});
