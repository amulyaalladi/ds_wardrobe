/**
 * Seeds DS Wardrobe sample data: an India (INR) region, categories, collections
 * and products with Size/Color variants and stock.
 *
 * Run (from backend/):  npx medusa exec ./src/scripts/seed-ds-wardrobe.ts
 *
 * Assumes the default Medusa project already has a sales channel, a stock
 * location and a shipping profile (the create-medusa-app default seed provides
 * them; otherwise create them once in Admin > Settings).
 * The workflow names below follow Medusa v2 — check the current docs if a
 * newer version renamed anything.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"

const SIZES = ["S", "M", "L", "XL"]

type Seed = {
  title: string; handle: string; description: string
  category: string; collection: string
  price: number; salePrice?: number; colors: string[]
  material: string
}

const PRODUCTS: Seed[] = [
  { title: "Linen Co-ord Set", handle: "linen-coord-set", description: "Relaxed linen shirt and trouser set. Breathable and easy to dress up.", category: "Co-ords", collection: "New Arrivals", price: 3499, colors: ["Sand", "Olive"], material: "100% linen" },
  { title: "Everyday Oversized Tee", handle: "everyday-oversized-tee", description: "Heavyweight cotton tee with a dropped shoulder.", category: "Tops", collection: "Best Sellers", price: 1299, salePrice: 999, colors: ["Black", "White", "Mulberry"], material: "240 GSM cotton" },
  { title: "Satin Slip Dress", handle: "satin-slip-dress", description: "Bias-cut midi dress with adjustable straps.", category: "Dresses", collection: "New Arrivals", price: 2999, colors: ["Black", "Wine"], material: "Satin crepe" },
  { title: "Wide-Leg Trousers", handle: "wide-leg-trousers", description: "High-rise tailored trousers with a fluid drape.", category: "Bottoms", collection: "Best Sellers", price: 2499, colors: ["Black", "Stone"], material: "Viscose blend" },
  { title: "Cropped Denim Jacket", handle: "cropped-denim-jacket", description: "Structured denim jacket with a boxy cut.", category: "Outerwear", collection: "New Arrivals", price: 3999, salePrice: 3199, colors: ["Indigo"], material: "Rigid denim" },
  { title: "Ribbed Knit Top", handle: "ribbed-knit-top", description: "Soft stretch rib with a square neckline.", category: "Tops", collection: "Best Sellers", price: 1499, colors: ["Cream", "Black"], material: "Cotton-elastane rib" },
  { title: "Pleated Midi Skirt", handle: "pleated-midi-skirt", description: "Knife pleats with an elasticated waist.", category: "Bottoms", collection: "New Arrivals", price: 2199, colors: ["Olive", "Black"], material: "Recycled polyester" },
  { title: "Floral Wrap Dress", handle: "floral-wrap-dress", description: "Wrap silhouette with flutter sleeves.", category: "Dresses", collection: "Best Sellers", price: 2799, colors: ["Rose"], material: "Georgette" },
]

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: locations } = await query.graph({ entity: "stock_location", fields: ["id"] })
  if (!channels[0] || !profiles[0] || !locations[0]) {
    throw new Error("Need at least one sales channel, shipping profile and stock location. Create them in Admin first.")
  }

  logger.info("Region (India / INR)")
  const { data: existing } = await query.graph({ entity: "region", fields: ["id", "currency_code"] })
  if (!existing.some((r: any) => r.currency_code === "inr")) {
    await createRegionsWorkflow(container).run({
      input: { regions: [{ name: "India", currency_code: "inr", countries: ["in"], payment_providers: ["pp_system_default"] }] },
    })
  }

  logger.info("Categories + collections")
  const catNames = [...new Set(PRODUCTS.map((p) => p.category))]
  const { result: cats } = await createProductCategoriesWorkflow(container).run({
    input: { product_categories: catNames.map((name) => ({ name, is_active: true })) },
  })
  const { result: cols } = await createCollectionsWorkflow(container).run({
    input: { collections: [...new Set(PRODUCTS.map((p) => p.collection))].map((title) => ({ title })) },
  })
  const catId = (n: string) => cats.find((c: any) => c.name === n)!.id
  const colId = (t: string) => cols.find((c: any) => c.title === t)!.id

  logger.info("Products")
  await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((p) => ({
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        material: p.material,
        category_ids: [catId(p.category)],
        collection_id: colId(p.collection),
        shipping_profile_id: profiles[0].id,
        options: [
          { title: "Size", values: SIZES },
          { title: "Color", values: p.colors },
        ],
        variants: p.colors.flatMap((color) =>
          SIZES.map((size) => ({
            title: `${size} / ${color}`,
            sku: `${p.handle}-${size}-${color}`.toUpperCase().replace(/\s+/g, "-"),
            manage_inventory: true,
            options: { Size: size, Color: color },
            // v2 amounts are in major units (rupees), not paise
            prices: [{ amount: p.salePrice ?? p.price, currency_code: "inr" }],
            metadata: p.salePrice ? { compare_at_price: p.price } : {},
          }))
        ),
        sales_channels: [{ id: channels[0].id }],
      })),
    },
  })

  logger.info("Inventory levels")
  const { data: items } = await query.graph({ entity: "inventory_item", fields: ["id"] })
  const { data: levels } = await query.graph({ entity: "inventory_level", fields: ["inventory_item_id"] })
  const have = new Set(levels.map((l: any) => l.inventory_item_id))
  const missing = items.filter((i: any) => !have.has(i.id))
  if (missing.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: missing.map((i: any, idx: number) => ({
          inventory_item_id: i.id,
          location_id: locations[0].id,
          // a few variants deliberately at 0 to demo out-of-stock states
          stocked_quantity: idx % 11 === 0 ? 0 : 25,
        })),
      },
    })
  }
  logger.info("Seed complete. Link the sales channel to your publishable API key in Admin > Settings > Publishable API Keys.")
}
