import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, PaletteName, Palette } from './colors';

interface ThemeContextType {
  currentPalette: PaletteName;
  colors: Palette;
  changePalette: (palette: PaletteName) => void;
  cyclePalette: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<PaletteName>('noir-chic');

  useEffect(() => {
    loadPalette();
  }, []);

  const loadPalette = async () => {
    try {
      const saved = await AsyncStorage.getItem('palette');
      if (saved && saved in palettes) {
        setCurrentPalette(saved as PaletteName);
      }
    } catch (error) {
      console.log('Error loading palette:', error);
    }
  };

  const changePalette = async (palette: PaletteName) => {
    try {
      setCurrentPalette(palette);
      await AsyncStorage.setItem('palette', palette);
    } catch (error) {
      console.log('Error saving palette:', error);
    }
  };

  const cyclePalette = () => {
    const paletteNames: PaletteName[] = ['noir-chic', 'violeta-sensual', 'minimal-light'];
    const currentIndex = paletteNames.indexOf(currentPalette);
    const nextIndex = (currentIndex + 1) % paletteNames.length;
    changePalette(paletteNames[nextIndex]);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentPalette,
        colors: palettes[currentPalette],
        changePalette,
        cyclePalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};