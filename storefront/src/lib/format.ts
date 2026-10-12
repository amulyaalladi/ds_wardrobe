export function formatPrice(amount: number | null | undefined, currency = "inr") {
  if (amount == null) return ""
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string | Date) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  if (e instanceof Error && e.message) return e.message
  return fallback
}
