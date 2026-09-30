export type ColorKey = 'offwhite' | 'sand' | 'sage' | 'blue' | 'black'

export const PALETTE: Record<ColorKey, { name: string; hex: string }> = {
  offwhite: { name: 'Off White', hex: '#F7F5EF' },
  sand: { name: 'Sand', hex: '#D9C9B1' },
  sage: { name: 'Sage', hex: '#8A9B8F' },
  blue: { name: 'Washed Blue', hex: '#5C7A8A' },
  black: { name: 'Washed Black', hex: '#2E2E2E' },
}

export const PALETTE_ORDER: ColorKey[] = ['offwhite', 'sand', 'sage', 'blue', 'black']
