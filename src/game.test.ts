import { describe, expect, it } from 'vitest'
import { calculateRoundScore, hueDistance } from './game'

describe('colour scoring', () => {
  const target = { hue: 350, saturation: 65, value: 80 }
  it('gives a perfect score for a perfect guess', () => expect(calculateRoundScore(target, target)).toBe(1000))
  it('wraps hue error over the 0/360 boundary', () => expect(hueDistance(355, 5)).toBe(10))
  it('rewards a close guess above a distant guess', () => {
    expect(calculateRoundScore({ hue: 355, saturation: 68, value: 82 }, target)).toBeGreaterThan(calculateRoundScore({ hue: 170, saturation: 5, value: 20 }, target))
  })
})
