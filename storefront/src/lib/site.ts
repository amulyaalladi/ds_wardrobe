/** Brand facts from the @ds__wardrobe__ Instagram bio. Edit here, not in components. */
export const site = {
  name: "DS Wardrobe",
  tagline: "Your style is your personal brand.",
  subline: "Where fashion meets purpose.",
  instagramUrl: "https://www.instagram.com/ds__wardrobe__/",
  instagramHandle: "@ds__wardrobe__",
  followers: "13.4k",
  location: "Singarayakonda",
  phoneDisplay: "70329 32549",
  // Country code + number, digits only. Override with NEXT_PUBLIC_WHATSAPP_NUMBER.
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917032932549",
}

export function whatsappLink(text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : ""
  return `https://wa.me/${site.whatsapp}${q}`
}
