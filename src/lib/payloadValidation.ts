const editableCurrencyCodes = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const

type NumberRangeOptions = {
  integer?: boolean
  label: string
  max: number
  min: number
}

export function validateNumberRange({ integer = false, label, max, min }: NumberRangeOptions) {
  return (value: unknown) => {
    const numeric = Number(value)

    if (!Number.isFinite(numeric)) {
      return `${label} must be a valid number.`
    }

    if (integer && !Number.isInteger(numeric)) {
      return `${label} must be a whole number.`
    }

    if (numeric < min || numeric > max) {
      return `${label} must be between ${min} and ${max}.`
    }

    return true
  }
}

export const validatePositivePrice = (label = 'Price') =>
  validateNumberRange({
    label,
    max: 100_000,
    min: 0.5,
  })

export const validatePositiveCredits = (label = 'Credits') =>
  validateNumberRange({
    integer: true,
    label,
    max: 10_000_000,
    min: 1,
  })

export const validateNonNegativeCredits = (label = 'Credits') =>
  validateNumberRange({
    integer: true,
    label,
    max: 10_000_000,
    min: 0,
  })

export function validateCurrencyCode(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (editableCurrencyCodes.includes(normalized as (typeof editableCurrencyCodes)[number])) {
    return true
  }

  return `Currency must be one of ${editableCurrencyCodes.join(', ')}.`
}
