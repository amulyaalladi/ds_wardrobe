import Medusa from "@medusajs/js-sdk"

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: BACKEND_URL,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  debug: process.env.NODE_ENV === "development",
})

/**
 * Logs why a call to the Medusa backend failed (shows in Vercel > Logs).
 * Pages still show their friendly error state; this only makes the cause visible.
 * Never logs the full key: just whether one is set and its first characters.
 */
export function logApiError(where: string, e: unknown) {
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const err = e as any
  console.error(`[medusa] ${where} failed`, {
    message: err?.message ?? String(e),
    status: err?.status ?? err?.response?.status,
    backend: BACKEND_URL,
    publishableKey: key ? `${key.slice(0, 7)}... (${key.length} chars)` : "MISSING",
  })
}