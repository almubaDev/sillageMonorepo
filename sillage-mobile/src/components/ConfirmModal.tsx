import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'danger',
}) => {
  const { colors } = useTheme();

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return { name: 'alert-circle', color: '#EF4444' };
      case 'warning':
        return { name: 'alert', color: '#F59E0B' };
      case 'info':
        return { name: 'information', color: colors.accent };
      default:
        return { name: 'help-circle', color: colors.accent };
    }
  };

  const icon = getIcon();

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0.6}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={icon.name as any} size={56} color={icon.color} />
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {title}
        </Text>

        <Text style={[styles.message, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {message}
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: colors.secondary }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.secondary, fontFamily: 'Lato-Bold' }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.confirmButton, { 
              backgroundColor: type === 'danger' ? '#EF4444' : colors.accent 
            }]}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Text style={[styles.confirmText, { color: '#FFFFFF', fontFamily: 'Lato-Bold' }]}>
              {confirmText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  cancelText: {
    fontSize: 16,
  },
  confirmText: {
    fontSize: 16,
  },
});