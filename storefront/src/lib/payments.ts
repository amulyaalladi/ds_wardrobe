/** Maps Medusa payment provider ids to what shoppers see. */
export const RAZORPAY_PROVIDER = "pp_razorpay_razorpay"
export const COD_PROVIDER = "pp_system_default"

export const isRazorpay = (id?: string | null) => !!id && id.startsWith("pp_razorpay")
export const isCod = (id?: string | null) => id === COD_PROVIDER

export function paymentLabel(id: string): { title: string; hint: string } {
  if (isRazorpay(id)) return { title: "Pay online", hint: "UPI, cards, netbanking and wallets via Razorpay" }
  if (isCod(id)) return { title: "Cash on delivery", hint: "Pay in cash when your order arrives" }
  return { title: id.replace(/^pp_/, "").replace(/_/g, " "), hint: "" }
}

/** Show online payment first, then COD. */
export function sortProviders<T extends { id: string }>(list: T[]): T[] {
  const rank = (id: string) => (isRazorpay(id) ? 0 : isCod(id) ? 1 : 2)
  return [...list].sort((a, b) => rank(a.id) - rank(b.id))
}
