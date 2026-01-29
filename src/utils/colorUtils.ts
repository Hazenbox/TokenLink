/**
 * Color utility functions for converting between color formats
 */

/**
 * Convert HEX color to RGB
 * @param hex - Hex color string (e.g., "#FF5733" or "FF5733")
 * @returns RGB object or null if invalid
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');
  
  // Validate hex format
  if (!/^[0-9A-F]{6}$/i.test(cleanHex)) {
    return null;
  }
  
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Format a hex color value for display in multiple formats
 * @param hex - Hex color string (e.g., "#FF5733")
 * @returns Object with hex, rgb, and rgba formatted strings
 */
export function formatColorValue(hex: string): {
  hex: string;
  rgb: string;
  rgba: string;
} {
  const rgb = hexToRgb(hex);
  
  if (!rgb) {
    return {
      hex: hex.toUpperCase(),
      rgb: 'Invalid color',
      rgba: 'Invalid color',
    };
  }
  
  return {
    hex: hex.toUpperCase(),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
  };
}

/**
 * Check if a color is light (for determining if border is needed)
 * @param hex - Hex color string
 * @returns true if color is light
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  // Calculate relative luminance using sRGB colorspace
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  return luminance > 0.7;
}
