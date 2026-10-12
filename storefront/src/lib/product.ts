import type { HttpTypes } from "@medusajs/types"

export type Product = HttpTypes.StoreProduct
export type Variant = HttpTypes.StoreProductVariant

export const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,*categories,*collection,*options,*options.values,*images"

export function variantInStock(v: Variant): boolean {
  if (v.manage_inventory === false || v.allow_backorder) return true
  return (v.inventory_quantity ?? 0) > 0
}

export function productInStock(p: Product): boolean {
  return (p.variants ?? []).some(variantInStock)
}

export function variantPrice(v: Variant) {
  const cp = v.calculated_price
  const amount = cp?.calculated_amount ?? null
  const original = cp?.original_amount ?? null
  const onSale = amount != null && original != null && amount < original
  // Fallback: seed stores the "was" price in metadata when no price list is used
  const meta = Number((v.metadata as any)?.compare_at_price)
  const compareAt = onSale ? original : meta > (amount ?? 0) ? meta : null
  return {
    amount,
    compareAt,
    currency: cp?.currency_code ?? "inr",
  }
}

export function minPrice(p: Product) {
  const prices = (p.variants ?? [])
    .map(variantPrice)
    .filter((x) => x.amount != null)
    .sort((a, b) => a.amount! - b.amount!)
  return prices[0] ?? { amount: null, compareAt: null, currency: "inr" }
}

export function optionValues(p: Product, title: string): string[] {
  const opt = p.options?.find((o) => o.title.toLowerCase() === title.toLowerCase())
  return opt?.values?.map((v) => v.value) ?? []
}

export function variantOptionMap(v: Variant): Record<string, string> {
  const out: Record<string, string> = {}
  for (const o of v.options ?? []) {
    const title = (o as any).option?.title ?? (o as any).option_title
    if (title) out[title] = o.value
  }
  return out
}
