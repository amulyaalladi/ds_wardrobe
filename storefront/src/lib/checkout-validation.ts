export type Form = {
  email: string; first_name: string; last_name: string; phone: string
  address_1: string; address_2: string; city: string; province: string; postal_code: string
}
export const EMPTY: Form = { email: "", first_name: "", last_name: "", phone: "", address_1: "", address_2: "", city: "", province: "", postal_code: "" }

/** Returns field -> message. Server-side validation in Medusa still applies. */
export function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {}
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Enter a valid email address."
  if (!f.first_name.trim()) e.first_name = "Enter your first name."
  if (!f.last_name.trim()) e.last_name = "Enter your last name."
  if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit Indian mobile number."
  if (f.address_1.trim().length < 5) e.address_1 = "Enter your street address."
  if (!f.city.trim()) e.city = "Enter your city."
  if (!f.province.trim()) e.province = "Enter your state."
  if (!/^\d{6}$/.test(f.postal_code)) e.postal_code = "Enter a 6-digit PIN code."
  return e
}

