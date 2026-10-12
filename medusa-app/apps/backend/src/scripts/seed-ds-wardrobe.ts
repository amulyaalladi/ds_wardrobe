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
  // SAMPLE DATA: replace names, prices and photos with DS Wardrobe's real catalogue in Admin.
  { title: "Oversized Cotton Tee", handle: "oversized-cotton-tee", description: "Heavyweight cotton tee with a relaxed, dropped-shoulder fit.", category: "T-Shirts", collection: "New Arrivals", price: 799, colors: ["Black", "White", "Navy"], material: "240 GSM cotton" },
  { title: "Everyday Basic Tee", handle: "everyday-basic-tee", description: "Soft regular-fit tee for everyday wear.", category: "T-Shirts", collection: "Best Sellers", price: 599, salePrice: 499, colors: ["White", "Grey", "Olive"], material: "180 GSM cotton" },
  { title: "Polo Tee", handle: "polo-tee", description: "Classic collar tee with a clean, smart-casual look.", category: "T-Shirts", collection: "New Arrivals", price: 899, colors: ["Navy", "Black"], material: "Cotton pique" },
  { title: "Casual Cotton Shirt", handle: "casual-cotton-shirt", description: "Lightweight full-sleeve shirt that works from college to dinner.", category: "Shirts", collection: "Best Sellers", price: 1199, colors: ["White", "Sky Blue"], material: "Cotton poplin" },
  { title: "Linen Blend Shirt", handle: "linen-blend-shirt", description: "Breathable shirt for warm days.", category: "Shirts", collection: "New Arrivals", price: 1399, salePrice: 1199, colors: ["Sand", "Olive"], material: "Linen blend" },
  { title: "Straight Fit Jeans", handle: "straight-fit-jeans", description: "Mid-rise straight jeans with a bit of stretch.", category: "Pants", collection: "Best Sellers", price: 1599, colors: ["Indigo", "Black"], material: "Stretch denim" },
  { title: "Cargo Pants", handle: "cargo-pants", description: "Relaxed cargo pants with roomy side pockets.", category: "Pants", collection: "New Arrivals", price: 1499, colors: ["Olive", "Black"], material: "Cotton twill" },
  { title: "Everyday Joggers", handle: "everyday-joggers", description: "Comfortable joggers with a tapered leg.", category: "Pants", collection: "Best Sellers", price: 999, colors: ["Black", "Grey"], material: "Cotton fleece" },
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
