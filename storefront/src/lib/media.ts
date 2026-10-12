/**
 * Storefront imagery. Edit here, not in components.
 *
 * These are SAMPLE photos from Unsplash (free licence) and a clip from Mixkit (free licence),
 * loaded from their servers. Replace them with DS Wardrobe's own photos before launch:
 * put files in /public (e.g. /public/hero.mp4) and change the paths below to "/hero.mp4".
 *
 * Product photos uploaded in Medusa Admin always win; the fallbacks below are only used
 * when a product has no image of its own.
 */

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`

export const hero = {
  // "T-shirts on hangers at fashion store" from mixkit.co. Muted, looped, no audio.
  video: "https://assets.mixkit.co/videos/34707/34707-720.mp4",
  // Shown while the video loads, on slow connections, and when reduced motion is on.
  poster: unsplash("1679212622264-646085f5653f", 1920),
  posterAlt: "A rack of shirts hanging in a clothing store",
}

/** Category tiles on the home page, keyed by category handle. */
export const categoryImages: Record<string, string> = {
  "t-shirts": unsplash("1562157873-818bc0726f68", 900),
  shirts: unsplash("1642764873654-9eef0467b342", 900),
  pants: unsplash("1473966968600-fa801b869a1a", 900),
}

/** Sample product photos keyed by product handle. The first one is the main image. */
export const productImages: Record<string, string[]> = {
  "oversized-cotton-tee": [unsplash("1627225925683-1da7021732ea"), unsplash("1571455786673-9d9d6c194f90")],
  "everyday-basic-tee": [unsplash("1521572163474-6864f9cf17ab"), unsplash("1581655353564-df123a1eb820")],
  "polo-tee": [unsplash("1623658580851-3b25bf83b4ea")],
  "casual-cotton-shirt": [unsplash("1602810316693-3667c854239a"), unsplash("1621072156002-e2fccdc0b176")],
  "linen-blend-shirt": [unsplash("1627686011747-74adda3d2343"), unsplash("1602810318383-e386cc2a3ccf")],
  "straight-fit-jeans": [unsplash("1624378439575-d8705ad7ae80"), unsplash("1605518216938-7c31b7b14ad0")],
  "cargo-pants": [unsplash("1511794322962-129ddbd0af38")],
  "everyday-joggers": [unsplash("1552902875-9ac1f9fe0c07")],
}

/** Used for products without their own photo and without a sample photo above. */
const categoryFallback: Record<string, string> = {
  "t-shirts": unsplash("1523381294911-8d3cead13475"),
  shirts: unsplash("1596755094514-f87e34085b2c"),
  pants: unsplash("1584865288642-42078afe6942"),
}

type HasImages = {
  handle?: string | null
  thumbnail?: string | null
  images?: { id?: string; url: string }[] | null
  categories?: { handle?: string | null }[] | null
}

/** Every image to show for a product: its own uploads first, then the sample set. */
export function productGallery(p: HasImages): { id: string; url: string }[] {
  if (p.images?.length) return p.images.map((im, i) => ({ id: im.id ?? String(i), url: im.url }))
  if (p.thumbnail) return [{ id: "t", url: p.thumbnail }]
  const sample = (p.handle && productImages[p.handle]) || []
  if (sample.length) return sample.map((url, i) => ({ id: `s${i}`, url }))
  const cat = p.categories?.map((c) => c.handle && categoryFallback[c.handle]).find(Boolean)
  return cat ? [{ id: "c", url: cat }] : []
}

export function productImage(p: HasImages): string | null {
  return p.thumbnail || productGallery(p)[0]?.url || null
}
