import { sdk } from "./medusa"
import { PRODUCT_FIELDS, minPrice, productInStock, variantOptionMap, type Product } from "./product"
import type { HttpTypes } from "@medusajs/types"

/** Server-side data access. Every function throws on API failure; pages catch it and show <ErrorState/>. */

export async function getRegion(): Promise<HttpTypes.StoreRegion> {
  const { regions } = await sdk.store.region.list()
  const region = regions.find((r) => r.currency_code === "inr") ?? regions[0]
  if (!region) throw new Error("No region configured in the backend.")
  return region
}

export async function getCategories() {
  const { product_categories } = await sdk.store.category.list({ fields: "id,name,handle", limit: 50 })
  return product_categories
}

export async function getCollections() {
  const { collections } = await sdk.store.collection.list({ limit: 50 })
  return collections
}

export type ShopQuery = {
  q?: string
  category?: string // category handle
  collection?: string // collection handle
  sort?: "newest" | "price-asc" | "price-desc"
  size?: string
  color?: string
  min?: number
  max?: number
  inStock?: boolean
  page?: number
}
export const PAGE_SIZE = 12

export async function getProducts(opts: Partial<ShopQuery> & { limit?: number } = {}) {
  const region = await getRegion()
  const query: Record<string, any> = {
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    limit: 100,
    order: "-created_at",
  }
  if (opts.q) query.q = opts.q
  if (opts.category) {
    const { product_categories } = await sdk.store.category.list({ handle: opts.category, fields: "id" })
    if (!product_categories[0]) return { products: [] as Product[], total: 0, all: [] as Product[] }
    query.category_id = [product_categories[0].id]
  }
  if (opts.collection) {
    const { collections } = await sdk.store.collection.list({ handle: opts.collection })
    if (!collections[0]) return { products: [] as Product[], total: 0, all: [] as Product[] }
    query.collection_id = [collections[0].id]
  }

  const { products: all } = await sdk.store.product.list(query)

  // The Store API cannot filter on variant options, so these run here.
  // For large catalogues move this into a search engine (see docs/ARCHITECTURE.md).
  let list = all.filter((p) => {
    const variants = p.variants ?? []
    const match = variants.some((v) => {
      const o = variantOptionMap(v)
      if (opts.size && o["Size"] !== opts.size) return false
      if (opts.color && o["Color"] !== opts.color) return false
      return true
    })
    if (!match && (opts.size || opts.color)) return false
    const price = minPrice(p).amount
    if (opts.min != null && (price ?? 0) < opts.min) return false
    if (opts.max != null && (price ?? Infinity) > opts.max) return false
    if (opts.inStock && !productInStock(p)) return false
    return true
  })

  if (opts.sort === "price-asc") list = [...list].sort((a, b) => (minPrice(a).amount ?? 0) - (minPrice(b).amount ?? 0))
  if (opts.sort === "price-desc") list = [...list].sort((a, b) => (minPrice(b).amount ?? 0) - (minPrice(a).amount ?? 0))

  const total = list.length
  const limit = opts.limit ?? PAGE_SIZE
  const start = ((opts.page ?? 1) - 1) * limit
  return { products: list.slice(start, start + limit), total, all }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const region = await getRegion()
  const { products } = await sdk.store.product.list({
    handle,
    region_id: region.id,
    fields: PRODUCT_FIELDS + ",+metadata",
    limit: 1,
  })
  return products[0] ?? null
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  const region = await getRegion()
  const categoryIds = product.categories?.map((c) => c.id)
  const { products } = await sdk.store.product.list({
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    limit: limit + 1,
    ...(categoryIds?.length ? { category_id: categoryIds } : {}),
  })
  return products.filter((p) => p.id !== product.id).slice(0, limit)
}
