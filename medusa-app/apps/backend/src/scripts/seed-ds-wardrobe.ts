/**
 * Seeds DS Wardrobe sample data: an India (INR) region, categories, collections
 * and products with Size/Color variants and stock.
 *
 * Run (from apps/backend):  npx medusa exec ./src/scripts/seed-ds-wardrobe.ts
 *
 * Safe to run more than once and on a database that already has Medusa's
 * default demo data: existing categories, collections, products, the India
 * region and India shipping are reused, and only what's missing is created.
 *
 * Assumes the default Medusa project already has a sales channel, a stock
 * location and a shipping profile (the create-medusa-app default seed provides
 * them; otherwise create them once in Admin > Settings).
 * The workflow names below follow Medusa v2 — check the current docs if a
 * newer version renamed anything.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  updateRegionsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  updateStoresWorkflow,
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

const PAYMENT_PROVIDERS = ["pp_system_default", "pp_razorpay_razorpay"]
const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  const { data: channels } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "fulfillment_sets.id", "fulfillment_sets.type", "fulfillment_sets.service_zones.id", "fulfillment_sets.service_zones.name"],
  })
  if (!channels[0] || !profiles[0] || !locations[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Need at least one sales channel, shipping profile and stock location. Create them in Admin first."
    )
  }

  // ---- Store currency: INR as default ----
  logger.info("Store currency (INR default)")
  const { data: stores } = await query.graph({ entity: "store", fields: ["id", "supported_currencies.currency_code"] })
  if (stores[0]) {
    const others = (stores[0].supported_currencies ?? [])
      .map((c: any) => c.currency_code)
      .filter((c: string) => c && c !== "inr")
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: stores[0].id },
        update: {
          supported_currencies: [
            { currency_code: "inr", is_default: true },
            ...others.map((currency_code: string) => ({ currency_code, is_default: false })),
          ],
        },
      },
    })
  }

  // ---- Region: India / INR with Razorpay + cash on delivery ----
  logger.info("Region (India / INR)")
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "currency_code"] })
  let india: any = regions.find((r: any) => r.currency_code === "inr")
  if (!india) {
    const { result } = await createRegionsWorkflow(container).run({
      input: { regions: [{ name: "India", currency_code: "inr", countries: ["in"], payment_providers: PAYMENT_PROVIDERS }] },
    })
    india = result[0]
  } else {
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: india.id }, update: { payment_providers: PAYMENT_PROVIDERS } },
    })
  }

  const { data: taxRegions } = await query.graph({ entity: "tax_region", fields: ["id", "country_code"] })
  if (!taxRegions.some((t: any) => t.country_code === "in")) {
    await createTaxRegionsWorkflow(container).run({ input: [{ country_code: "in", provider_id: "tp_system" }] })
  }

  // ---- Shipping to India ----
  logger.info("Shipping (India)")
  const location: any = locations[0]
  let shippingSet = (location.fulfillment_sets ?? []).find((f: any) => f?.type === "shipping")
  if (!shippingSet) {
    shippingSet = await fulfillment.createFulfillmentSets({ name: `${location.name} delivery`, type: "shipping" })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: shippingSet.id },
    })
    shippingSet.service_zones = []
  }
  let indiaZone = (shippingSet.service_zones ?? []).find((z: any) => z?.name === "India")
  if (!indiaZone) {
    indiaZone = await fulfillment.createServiceZones({
      name: "India",
      fulfillment_set_id: shippingSet.id,
      geo_zones: [{ type: "country", country_code: "in" }],
    })
  }
  const providerLinks = await link.list({
    [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })
  if (!providerLinks.length) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
  }
  const { data: zoneOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id"],
    filters: { service_zone_id: indiaZone.id },
  })
  if (!zoneOptions.length) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: indiaZone.id,
          shipping_profile_id: profiles[0].id,
          type: { label: "Standard", description: "Delivered across India in 4-7 days.", code: "standard" },
          // Free shipping to start; change the price in Admin > Settings > Locations & Shipping.
          prices: [
            { currency_code: "inr", amount: 0 },
            { region_id: india.id, amount: 0 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
  }

  // ---- Categories + collections (reuse existing ones) ----
  logger.info("Categories + collections")
  const catNames = [...new Set(PRODUCTS.map((p) => p.category))]
  const { data: existingCats } = await query.graph({ entity: "product_category", fields: ["id", "name", "handle"] })
  const findCat = (n: string) =>
    existingCats.find((c: any) => c.handle === slug(n) || c.name.toLowerCase() === n.toLowerCase())
  const missingCats = catNames.filter((n) => !findCat(n))
  if (missingCats.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: missingCats.map((name) => ({ name, is_active: true })) },
    })
    existingCats.push(...(result as any[]))
  }

  const colTitles = [...new Set(PRODUCTS.map((p) => p.collection))]
  const { data: existingCols } = await query.graph({ entity: "product_collection", fields: ["id", "title", "handle"] })
  const findCol = (t: string) =>
    existingCols.find((c: any) => c.handle === slug(t) || c.title.toLowerCase() === t.toLowerCase())
  const missingCols = colTitles.filter((t) => !findCol(t))
  if (missingCols.length) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: { collections: missingCols.map((title) => ({ title })) },
    })
    existingCols.push(...(result as any[]))
  }

  // ---- Products (skip handles that already exist) ----
  logger.info("Products")
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: PRODUCTS.map((p) => p.handle) },
  })
  const have = new Set(existingProducts.map((p: any) => p.handle))
  const toCreate = PRODUCTS.filter((p) => !have.has(p.handle))
  if (toCreate.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: toCreate.map((p) => ({
          title: p.title,
          handle: p.handle,
          description: p.description,
          status: ProductStatus.PUBLISHED,
          material: p.material,
          category_ids: [findCat(p.category)!.id],
          collection_id: findCol(p.collection)!.id,
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
  }
  logger.info(`Products: ${toCreate.length} created, ${have.size} already existed`)

  // ---- Stock for any variant without an inventory level ----
  logger.info("Inventory levels")
  const { data: items } = await query.graph({ entity: "inventory_item", fields: ["id"] })
  const { data: levels } = await query.graph({ entity: "inventory_level", fields: ["inventory_item_id"] })
  const stocked = new Set(levels.map((l: any) => l.inventory_item_id))
  const missing = items.filter((i: any) => !stocked.has(i.id))
  if (missing.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: missing.map((i: any) => ({
          inventory_item_id: i.id,
          location_id: location.id,
          stocked_quantity: 25,
        })),
      },
    })
  }
  logger.info("Seed complete. Make sure your publishable API key is linked to the sales channel (Admin > Settings > Publishable API Keys).")
}
