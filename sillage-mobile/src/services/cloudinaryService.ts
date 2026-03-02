/**
 * Servicio para subir imágenes a Cloudinary
 */
import { Platform } from 'react-native';

const CLOUD_NAME = 'drdsrbx6n';
const UPLOAD_PRESET = 'sillage_perfumes';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const cloudinaryService = {
  /**
   * Sube una imagen a Cloudinary.
   * @param imageUri URI local de la imagen (desde expo-image-picker)
   * @returns URL segura de la imagen subida
   */
  async uploadImage(imageUri: string): Promise<string> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // En web, convertir la URI (blob/data URL) a un File real
      const res = await fetch(imageUri);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' });
      formData.append('file', file);
    } else {
      // En mobile nativo, usar el formato { uri, name, type }
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);
    }

    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al subir imagen: ${error}`);
    }

    const data: CloudinaryResponse = await response.json();
    return data.secure_url;
  },
};
