type RGB = [number, number, number]
type HSL = [number, number, number]

// Source: https://stackoverflow.com/a/9493060 .
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
export function hslToRgb([h, s, l]: HSL): RGB {
  h /= 360

  let r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r, g, b];
}

// Source: https://stackoverflow.com/a/23502424 .
export function rgbToHsl([r, g, b]: RGB): HSL {
  // r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  // eslint-disable-next-line prefer-const
  let h = 0, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d; break;
      case g: h = 2 + ((b - r) / d); break;
      case b: h = 4 + ((r - g) / d); break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

export function luminate(color: string, amount: number): string {
  // Convert the color from hex to RGB
  const rgb = hexToRgb(color);

  // Convert the RGB values to HSL
  const hsl = rgbToHsl(rgb);

  // Increase the lightness value by the specified amount
  hsl[2] += amount;

  // Clamp the lightness value between 0 and 1
  hsl[2] = Math.max(0, Math.min(1, hsl[2]));

  // Convert the HSL values back to RGB
  const newRgb = hslToRgb(hsl);

  // Convert the RGB values back to hex and return the result
  return rgbToHex(newRgb);
}

export function saturate(color: string, amount: number): string {
  // Convert the color from hex to RGB
  const rgb = hexToRgb(color);

  // Convert the RGB values to HSL
  const hsl = rgbToHsl(rgb);

  // Increase the saturation value by the specified amount
  hsl[1] += amount;

  // Clamp the saturation value between 0 and 1
  hsl[1] = Math.max(0, Math.min(1, hsl[1]));

  // Convert the HSL values back to RGB
  const newRgb = hslToRgb(hsl);

  // Convert the RGB values back to hex and return the result
  return rgbToHex(newRgb);
}

export function hexToRgb(hex: string): RGB {
  // Check if the hex string is in the short form (e.g. "#abc")
  if (hex.length === 4) {
    // Expand the short form hex string to the full form (e.g. "#aabbcc")
    hex = hex
      .split('')
      .map((x) => `${x}${x}`)
      .join('');
  }

  // Convert the hex string to an array of numbers
  const hexValues = hex
    .match(/[\da-f]{2}/gi)!.map((x) =>
      Math.max(0, Math.min(1, parseInt(x, 16) / 255))
    );

  // Extract the red, green, and blue values from the hex array
  const [r, g, b] = hexValues.slice(0, 3);

  // Return the RGB values as an array
  return [r, g, b];
}

export function rgbToHex(rgb: RGB): string {
  // Convert the RGB values to hexadecimal strings
  const hexValues = rgb.map((x) =>
    Math.max(0, Math.min(255, Math.round(x * 255)))
      .toString(16)
      .padStart(2, '0')
  );

  // Concatenate the hex strings into a single string and return the result
  return `#${hexValues.join('')}`;
}
