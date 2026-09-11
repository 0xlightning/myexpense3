// Fixed donut palette from project-spec.md. Slot order is never cycled;
// re-validate against both surfaces before changing any value.
export const DONUT_SLOTS = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
} as const

export const SLOT_COUNT = 8
export const OTHER_COLOR = '#898781'
export const SURFACE = { light: '#fcfcfb', dark: '#1a1a19' } as const

export type ColorScheme = keyof typeof SURFACE

/** Slot is a 0-based index; null means Other. */
export function slotColor(slot: number | null, scheme: ColorScheme): string {
  return slot === null ? OTHER_COLOR : DONUT_SLOTS[scheme][slot]
}
