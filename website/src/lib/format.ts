// Display formatting. Change CURRENCY here to switch the whole app.
export const CURRENCY = 'INR'
const LOCALE = 'en-US' // thousands grouping per spec

const money = (fractionDigits: number) =>
  new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
const whole = money(0)
const cents = money(2)
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 })
const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: 'UTC' })

const roundCents = (n: number) => Math.round(n * 100) / 100

/** Thousands-grouped; no decimals at or above 1000, cents below only when present. */
export function formatCurrency(n: number): string {
  const r = roundCents(n)
  return Math.abs(r) >= 1000 || Number.isInteger(r) ? whole.format(r) : cents.format(r)
}

/** Always carries a sign character for non-zero values; zero renders as plain 0. */
export function formatSignedCurrency(n: number): string {
  const r = roundCents(n)
  if (r === 0) return formatCurrency(0)
  return `${r > 0 ? '+' : '−'}${formatCurrency(Math.abs(r))}`
}

export function formatShare(fraction: number): string {
  return percent.format(fraction)
}

/** Dates are stored at UTC midnight, so format in UTC to keep the calendar day. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}
