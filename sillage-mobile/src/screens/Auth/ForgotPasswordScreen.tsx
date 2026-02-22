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
}

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError('');

    if (text && !text.includes('@')) {
      setEmailError(t('auth:forgotPassword.errors.emailInvalid'));
    }
  };

  const handleSendLink = async () => {
    setEmailError('');

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
      setSent(true);
    } catch (error: any) {
      console.error('Error solicitando recuperación:', error);
      setEmailError(
        error.response?.data?.detail || t('auth:forgotPassword.errors.sendFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.sentContent}>
          <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
            <MaterialCommunityIcons name="email-check" size={64} color="#10B981" />
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('auth:forgotPassword.success.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('auth:forgotPassword.success.message')}
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
            <MaterialCommunityIcons name="lock-reset" size={64} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
            {t('auth:forgotPassword.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
            {t('auth:forgotPassword.subtitle')}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                {t('auth:forgotPassword.email')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderColor: emailError ? '#EF4444' : colors.accent,
                    fontFamily: 'Lato-Regular',
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
                <Text style={[styles.fieldError, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>{emailError}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleSendLink}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.bg, fontFamily: 'Lato-Bold' }]}>
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
              <Text style={[styles.backToLoginText, { color: colors.accent, fontFamily: 'Lato-Bold' }]}>
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
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  sentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  },
  fieldError: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backToLoginText: {
    fontSize: 15,
  },
});
