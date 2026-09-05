export type HsvColor = { hue: number; saturation: number; value: number }

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function hueDistance(a: number, b: number) {
  const straight = Math.abs(a - b) % 360
  return Math.min(straight, 360 - straight)
}

/** Returns a transparent 0–1000 score from circular hue and HSV channel error. */
export function calculateRoundScore(guess: HsvColor, target: HsvColor) {
  const hueError = hueDistance(guess.hue, target.hue) / 180
  const saturationError = Math.abs(guess.saturation - target.saturation) / 100
  const valueError = Math.abs(guess.value - target.value) / 100
  const weightedError = Math.sqrt(0.58 * hueError ** 2 + 0.24 * saturationError ** 2 + 0.18 * valueError ** 2)
  return Math.round(1000 * (1 - clamp(weightedError, 0, 1)))
}

export function hsvToHex({ hue, saturation, value }: HsvColor) {
  const s = saturation / 100
  const v = value / 100
  const c = v * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x]
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`
}
