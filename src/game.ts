export type HsvColor = { hue: number; saturation: number; value: number };
export type OklabColor = { L: number; a: number; b: number };

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function hueDistance(a: number, b: number) {
  const straight = Math.abs(a - b) % 360;
  return Math.min(straight, 360 - straight);
}

/** Convert HSV (0-360, 0-100, 0-100) to sRGB (0-1, 0-1, 0-1) */
export function hsvToRgb({ hue, saturation, value }: HsvColor): [number, number, number] {
  const s = saturation / 100;
  const v = value / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
      ? [x, c, 0]
      : hue < 180
      ? [0, c, x]
      : hue < 240
      ? [0, x, c]
      : hue < 300
      ? [x, 0, c]
      : [c, 0, x];
  return [r + m, g + m, b + m];
}

/** Convert sRGB (0-1) to OKLab (perceptually uniform color space) */
export function rgbToOklab(r: number, g: number, b: number): OklabColor {
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757693 * s_,
  };
}

export function hsvToOklab(hsv: HsvColor): OklabColor {
  const [r, g, b] = hsvToRgb(hsv);
  return rgbToOklab(r, g, b);
}

/** 
 * Calculates Accuracy Score Percentage (0.00% to 100.00%) using OKLab perceptual color distance.
 * 100.00 = Perfect match
 * 99.50+ = Visually identical / close match
 * < 20.00 = Major mismatch
 */
export function calculateAccuracyPercentage(guess: HsvColor, target: HsvColor): number {
  const lab1 = hsvToOklab(guess);
  const lab2 = hsvToOklab(target);

  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  const deltaE = Math.sqrt(dL * dL + da * da + db * db);

  // Maximum theoretical OKLab distance across standard gamut is ~0.42
  const normalizedError = clamp(deltaE / 0.42, 0, 1);
  
  // Power-curve exponent for intuitive perceptual scoring
  const scaledError = Math.pow(normalizedError, 1.45);
  
  const accuracy = (1 - scaledError) * 100;
  return clamp(accuracy, 0, 100);
}

/** Legacy round score (0-1000) for total match tally */
export function calculateRoundScore(guess: HsvColor, target: HsvColor): number {
  const accuracy = calculateAccuracyPercentage(guess, target);
  return Math.round(accuracy * 10);
}

export function hsvToHex({ hue, saturation, value }: HsvColor) {
  const [r, g, b] = hsvToRgb({ hue, saturation, value });
  return `#${[r, g, b]
    .map((c) => Math.round(clamp(c, 0, 1) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}
