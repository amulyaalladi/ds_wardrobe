/**
 * Gives the sample DS Wardrobe products photos, so the storefront, cart and Admin show images.
 * Only touches products that have NO image yet, so photos you uploaded in Admin are never overwritten.
 *
 * Run (from apps/backend):  npx medusa exec ./src/scripts/set-sample-images.ts
 *
 * The photos are free Unsplash images used as placeholders. Replace them with real
 * product photos in Admin > Products before launch.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=75`

const IMAGES: Record<string, string[]> = {
  "oversized-cotton-tee": ["1627225925683-1da7021732ea", "1571455786673-9d9d6c194f90"],
  "everyday-basic-tee": ["1521572163474-6864f9cf17ab", "1581655353564-df123a1eb820"],
  "polo-tee": ["1623658580851-3b25bf83b4ea"],
  "casual-cotton-shirt": ["1602810316693-3667c854239a", "1621072156002-e2fccdc0b176"],
  "linen-blend-shirt": ["1627686011747-74adda3d2343", "1602810318383-e386cc2a3ccf"],
  "straight-fit-jeans": ["1624378439575-d8705ad7ae80", "1605518216938-7c31b7b14ad0"],
  "cargo-pants": ["1511794322962-129ddbd0af38"],
  "everyday-joggers": ["1552902875-9ac1f9fe0c07"],
}

export default async function setSampleImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "images.id"],
    filters: { handle: Object.keys(IMAGES) },
  })

  const updates = products
    .filter((p: any) => !p.thumbnail && !(p.images?.length))
    .map((p: any) => {
      const urls = IMAGES[p.handle].map(unsplash)
      return { id: p.id, thumbnail: urls[0], images: urls.map((url) => ({ url })) }
    })

  if (!updates.length) {
    logger.info("Nothing to do: these products already have images (or don't exist).")
    return
  }

  for (const u of updates) {
    await updateProductsWorkflow(container).run({
      input: { selector: { id: u.id }, update: { thumbnail: u.thumbnail, images: u.images } },
    })
  }
  logger.info(`Added sample photos to ${updates.length} product(s).`)
}
