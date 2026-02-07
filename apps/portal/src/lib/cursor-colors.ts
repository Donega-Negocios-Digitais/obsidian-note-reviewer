/**
 * Cursor Color Utilities
 *
 * Generates consistent colors for users based on their username
 * using the color-hash library for deterministic color generation.
 */

import ColorHash from "color-hash";

/**
 * ColorHash instance configured for user presence colors
 *
 * - Full hue range (0-360) for variety
 * - High saturation (0.6-0.8) for vibrant colors
 * - Medium lightness (0.4-0.6) for visibility on both light/dark backgrounds
 */
const colorHash = new ColorHash({
  hue: { min: 0, max: 360 },
  saturation: [0.6, 0.8],
  lightness: [0.4, 0.6],
});

/**
 * Generate a consistent hex color for a user based on their name
 *
 * The same name will always generate the same color, enabling
 * consistent user identification across sessions.
 *
 * @param name - User's display name
 * @returns Hex color string (e.g., "#3B82F6")
 */
export function getCursorColor(name: string): string {
  return colorHash.hex(name);
}

/**
 * Generate avatar background color for a user
 *
 * Uses the same color generation as cursors for consistency.
 *
 * @param name - User's display name
 * @returns Hex color string
 */
export function getAvatarColor(name: string): string {
  const color = getCursorColor(name);
  return color;
}

/**
 * Generate text color for avatar based on background brightness
 *
 * Returns white for dark backgrounds, black for light backgrounds.
 *
 * @param name - User's display name
 * @returns Either "#FFFFFF" or "#000000"
 */
export function getAvatarTextColor(name: string): string {
  const hex = getCursorColor(name);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Calculate luminance (per ITU-R BT.709)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  return luminance > 128 ? "#000000" : "#FFFFFF";
}
