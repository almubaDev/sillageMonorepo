import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Platform, StyleSheet, View, Image, TouchableOpacity, Linking, Text } from 'react-native';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  onOpenExternal?: () => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  zoom = 14,
  onOpenExternal,
}) => {
  const safeZoom = clamp(zoom, 3, 18);

  const staticMapUrl = useMemo(() => {
    const roundedLat = latitude.toFixed(6);
    const roundedLon = longitude.toFixed(6);
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${roundedLat},${roundedLon}&zoom=${safeZoom}&size=800x450&markers=${roundedLat},${roundedLon},lightblue1`;
  }, [latitude, longitude, safeZoom]);

  const embedUrl = useMemo(() => {
    const latRange = 0.02 * (14 / safeZoom);
    const lonRange = 0.02 * (14 / safeZoom);
    const minLon = longitude - lonRange;
    const minLat = latitude - latRange;
    const maxLon = longitude + lonRange;
    const maxLat = latitude + latRange;

    const bbox = `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  }, [latitude, longitude, safeZoom]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <iframe
          title="Mapa de ubicación"
          src={embedUrl}
          loading="lazy"
          style={{ border: 'none', width: '100%', height: '100%' }}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </View>
    );
  }

  const handleOpenExternal = () => {
    const externalUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${safeZoom}/${latitude}/${longitude}`;
    Linking.openURL(externalUrl).catch(() => {
      // No action needed if the device cannot open the link
    });
    onOpenExternal?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.mobileContainer}
      onPress={handleOpenExternal}
    >
      <Image source={{ uri: staticMapUrl }} style={styles.mapImage} resizeMode="cover" />
      <View style={styles.mobileOverlay} pointerEvents="none">
        <Text style={styles.overlayText}>Toca para abrir el mapa interactivo</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1c1c1c',
  },
  mobileContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1c1c1c',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mobileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  overlayText: {
    color: '#F5F5F5',
    fontSize: 12,
    textAlign: 'center',
  },
});
