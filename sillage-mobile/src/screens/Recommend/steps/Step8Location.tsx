import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeProvider';
import { reportMapsUsage } from '../../../services/api';

interface Step8LocationProps {
  value: {
    latitud: number | null;
    longitud: number | null;
    nombre: string;
    direccion: string;
  };
  onChange: (location: {
    latitud: number;
    longitud: number;
    nombre: string;
    direccion: string;
  }) => void;
}

export const Step8Location: React.FC<Step8LocationProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const defaultLocation = {
    latitude: value.latitud || -33.4489,
    longitude: value.longitud || -70.6693,
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&language=es`
      );
      const data = await response.json();

      // Reportar uso de Maps al backend para tracking
      reportMapsUsage('reverse_geocode');

      if (data.results && data.results[0]) {
        onChange({
          latitud: latitude,
          longitud: longitude,
          nombre: data.results[0].address_components?.[0]?.long_name || t('recommend:step8.selectLocation'),
          direccion: data.results[0].formatted_address,
        });
      } else {
        onChange({
          latitud: latitude,
          longitud: longitude,
          nombre: t('recommend:step8.selectLocation'),
          direccion: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      }
    } catch (error) {
      console.error('Error en geocodificación:', error);
      onChange({
        latitud: latitude,
        longitud: longitude,
        nombre: t('recommend:step8.selectLocation'),
        direccion: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert(t('recommend:step8.errors.searchFailed'), t('recommend:step8.searchPlaceholder'));
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&language=es`
      );
      const data = await response.json();

      // Reportar uso de Maps al backend para tracking
      reportMapsUsage('geocode');

      if (data.results && data.results.length > 0) {
        const location = data.results[0];
        onChange({
          latitud: location.geometry.location.lat,
          longitud: location.geometry.location.lng,
          nombre: location.address_components?.[0]?.long_name || searchQuery,
          direccion: location.formatted_address,
        });
        setSearchQuery('');
      } else {
        Alert.alert(t('recommend:step8.noResults'), t('recommend:step8.tryAgain'));
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      Alert.alert(t('recommend:step8.errors.searchFailed'), t('recommend:step8.tryAgain'));
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="map-marker-radius" 
          size={64} 
          color={colors.accent} 
        />
        
        <Text style={[styles.title, { color: colors.text, fontFamily: 'AlanSans-Bold' }]}>
          {t('recommend:step8.title')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.secondary, fontFamily: 'Lato-Regular' }]}>
          {t('recommend:step8.subtitle')}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={[styles.searchInput, {
            backgroundColor: colors.bg,
            color: colors.text,
            borderColor: colors.accent,
            fontFamily: 'Lato-Regular',
          }]}
          placeholder={t('recommend:step8.searchPlaceholder')}
          placeholderTextColor={colors.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: colors.accent }]}
          onPress={handleSearch}
          disabled={searching}
        >
          <MaterialCommunityIcons name="magnify" size={22} color={colors.bg} />
        </TouchableOpacity>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: defaultLocation.latitude,
          longitude: defaultLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={
          value.latitud && value.longitud
            ? {
                latitude: value.latitud,
                longitude: value.longitud,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }
            : undefined
        }
        onPress={handleMapPress}
      >
        {value.latitud && value.longitud && (
          <Marker
            coordinate={{
              latitude: value.latitud,
              longitude: value.longitud,
            }}
            title={value.nombre}
            description={value.direccion}
            draggable
            onDragEnd={handleMapPress}
          />
        )}
      </MapView>

      {value.latitud && value.longitud && (
        <View style={[styles.selectedContainer, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedName, { color: colors.text, fontFamily: 'Lato-Bold' }]}>
              {value.nombre}
            </Text>
            <Text style={[styles.selectedAddress, { color: colors.secondary, fontFamily: 'Lato-Regular' }]} numberOfLines={2}>
              {value.direccion}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    marginBottom: 4,
  },
  selectedAddress: {
    fontSize: 12,
  },
});