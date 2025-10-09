// sillage-mobile/src/utils/formatters.ts

/**
 * Formatea nombres de perfumes que vienen de la base de datos
 * Convierte "erba-pura" → "Erba Pura"
 * @param name - Nombre del perfume con guiones y en minúsculas
 * @returns Nombre formateado con espacios y capitalizado
 */
export const formatPerfumeName = (name: string): string => {
  if (!name) return '';

  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formatea marcas de perfumes
 * @param brand - Marca del perfume
 * @returns Marca formateada
 */
export const formatBrand = (brand: string): string => {
  if (!brand) return '';

  // Si la marca tiene guiones, aplicar el mismo formato
  if (brand.includes('-')) {
    return formatPerfumeName(brand);
  }

  // Si ya tiene el formato correcto, solo capitalizar primera letra de cada palabra
  return brand
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Formatea nombres de perfumistas
 * @param perfumista - Nombre del perfumista
 * @returns Nombre formateado
 */
export const formatPerfumista = (perfumista: string): string => {
  if (!perfumista) return '';

  if (perfumista.includes('-')) {
    return formatPerfumeName(perfumista);
  }

  return perfumista
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
