/**
 * PerfumeImagePicker - Componente para seleccionar y subir imagen de perfume
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { cloudinaryService } from '../services/cloudinaryService';

interface PerfumeImagePickerProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export const PerfumeImagePicker: React.FC<PerfumeImagePickerProps> = ({
  imageUrl,
  onImageChange,
}) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    try {
      setError('');

      // Pedir permisos
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Se necesitan permisos para acceder a la galería');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setUploading(true);

      const secureUrl = await cloudinaryService.uploadImage(uri);
      onImageChange(secureUrl);
    } catch (err: any) {
      setError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    onImageChange('');
  };

  return (
    <View>
      {imageUrl ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={[styles.preview, { borderColor: colors.secondary + '40' }]}
          />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary + '20' }]}
              onPress={pickImage}
              disabled={uploading}
            >
              <MaterialCommunityIcons name="image-edit" size={18} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text, fontFamily: 'Lato-Regular' }]}>
                Cambiar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
              onPress={removeImage}
              disabled={uploading}
            >
              <MaterialCommunityIcons name="delete-outline" size={18} color="#EF4444" />
              <Text style={[styles.actionText, { color: '#EF4444', fontFamily: 'Lato-Regular' }]}>
                Quitar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, { borderColor: colors.secondary + '40' }]}
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.uploadText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Subiendo...
              </Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="camera-plus" size={32} color={colors.secondary} />
              <Text style={[styles.uploadText, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
                Agregar foto
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {error ? (
        <Text style={[styles.errorText, { fontFamily: 'Lato-Regular' }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    width: 150,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
  },
  uploadButton: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 6,
  },
});
