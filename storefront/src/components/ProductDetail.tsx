"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { productGallery } from "@/lib/media"
import { useRouter } from "next/navigation"
import { Alert, Badge, Button, Price } from "./ui"
import WishlistButton from "./WishlistButton"
import { useCart } from "@/lib/cart-context"
import { whatsappLink } from "@/lib/site"
import { type Product, variantInStock, variantOptionMap, variantPrice } from "@/lib/product"

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter()
  const { addItem, busy, error } = useCart()
  const options = product.options ?? []
  const variants = product.variants ?? []

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    // Preselect the first in-stock variant so price/stock are never blank
    const first = variants.find(variantInStock) ?? variants[0]
    return first ? variantOptionMap(first) : {}
  })
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)

  const variant = useMemo(
    () => variants.find((v) => {
      const m = variantOptionMap(v)
      return options.every((o) => m[o.title] === selected[o.title])
    }),
    [variants, options, selected]
  )

  const inStock = variant ? variantInStock(variant) : false
  const price = variant ? variantPrice(variant) : null
  const maxQty = variant && variant.manage_inventory && !variant.allow_backorder
    ? Math.max(1, variant.inventory_quantity ?? 1) : 10
  const lowStock = variant?.manage_inventory && !variant.allow_backorder && (variant.inventory_quantity ?? 0) > 0 && (variant.inventory_quantity ?? 0) <= 5

  const images = productGallery(product)

  /** Is there any purchasable variant if we pick `value` for `title` while keeping other selections? */
  function valueAvailable(title: string, value: string) {
    return variants.some((v) => {
      const m = variantOptionMap(v)
      if (m[title] !== value) return false
      return options.every((o) => o.title === title || !selected[o.title] || m[o.title] === selected[o.title]) && variantInStock(v)
    })
  }

  async function add(buyNow = false) {
    if (!variant || !inStock) return
    const ok = await addItem(variant.id, qty)
    if (ok) {
      if (buyNow) router.push("/checkout")
      else { setAdded(true); setTimeout(() => setAdded(false), 2500) }
    }
  }

  function orderOnWhatsApp() {
    const opts = options.map((o) => `${o.title}: ${selected[o.title] ?? "-"}`).join(", ")
    const msg = `Hi DS Wardrobe! I'd like to order:\n${product.title} (${opts}) x${qty}\n${window.location.href}`
    window.open(whatsappLink(msg), "_blank", "noopener,noreferrer")
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
      <div>
        <div className="relative aspect-[3/4] bg-line">
          {images[activeImg] ? (
            <Image src={images[activeImg].url} alt={product.title} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-7xl text-stone/60">DS</div>
          )}
        </div>
        {images.length > 1 && (
          <ul className="mt-2 flex gap-2 overflow-x-auto">
            {images.map((im, i) => (
              <li key={im.id}>
                <button onClick={() => setActiveImg(i)} aria-label={`Show image ${i + 1}`} aria-current={i === activeImg}
                  className={`relative block h-20 w-16 bg-line ${i === activeImg ? "ring-2 ring-ink" : ""}`}>
                  <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-4xl">{product.title}</h1>
          <WishlistButton productId={product.id} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          {price && <Price size="lg" amount={price.amount} compareAt={price.compareAt} currency={price.currency} />}
          {price?.compareAt && <Badge tone="sale">Sale</Badge>}
        </div>

        <div className="mt-8 space-y-6">
          {options.map((o) => (
            <fieldset key={o.id}>
              <legend className="label">{o.title}: <span className="font-normal text-stone">{selected[o.title]}</span></legend>
              <div className="flex flex-wrap gap-2">
                {o.values?.map(({ value }) => {
                  const on = selected[o.title] === value
                  const ok = valueAvailable(o.title, value)
                  return (
                    <button key={value} type="button" aria-pressed={on}
                      onClick={() => setSelected((s) => ({ ...s, [o.title]: value }))}
                      className={`min-w-12 border px-4 py-2 text-sm ${on ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"} ${ok ? "" : "text-stone line-through opacity-60"}`}>
                      {value}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <div>
            <label htmlFor="qty" className="label">Quantity</label>
            <div className="inline-flex items-center border border-line bg-white">
              <button type="button" className="h-10 w-10" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span id="qty" className="w-10 text-center text-sm" aria-live="polite">{qty}</span>
              <button type="button" className="h-10 w-10" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(maxQty, q + 1))}>+</button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {!variant && <Alert>This combination isn&apos;t available. Pick another size or color.</Alert>}
          {variant && !inStock && <Alert>This size and color is out of stock.</Alert>}
          {lowStock && <p className="text-sm text-sale">Only {variant?.inventory_quantity} left.</p>}
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button full disabled={!inStock || busy} onClick={() => add(false)}>
              {!inStock ? "Out of stock" : busy ? "Adding…" : added ? "Added to bag" : "Add to cart"}
            </Button>
            <Button full variant="secondary" disabled={!inStock || busy} onClick={() => add(true)}>Buy now</Button>
          </div>
          <Button full variant="ghost" disabled={!variant || !inStock} onClick={orderOnWhatsApp}>Prefer to order on WhatsApp?</Button>
        </div>

        {product.description && <p className="mt-8 max-w-prose leading-relaxed text-ink/80">{product.description}</p>}

        <details className="mt-8 border-t border-line py-4">
          <summary className="cursor-pointer text-sm font-medium">Specifications</summary>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            {product.material && <><dt className="text-stone">Material</dt><dd>{product.material}</dd></>}
            {product.origin_country && <><dt className="text-stone">Made in</dt><dd>{product.origin_country.toUpperCase()}</dd></>}
            {variant?.sku && <><dt className="text-stone">SKU</dt><dd>{variant.sku}</dd></>}
          </dl>
        </details>
        <SizeGuide />
      </div>
    </div>
  )
}

function SizeGuide() {
  const rows = [["S", "36", "30"], ["M", "38", "32"], ["L", "40", "34"], ["XL", "42", "36"]]
  return (
    <details className="border-y border-line py-4">
      <summary className="cursor-pointer text-sm font-medium">Size guide</summary>
      <table className="mt-3 w-full text-left text-sm">
        <thead><tr className="text-stone"><th className="py-1 font-normal">Size</th><th className="font-normal">Chest (in)</th><th className="font-normal">Waist (in)</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]} className="border-t border-line"><td className="py-1.5">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody>
      </table>
      <p className="mt-2 text-xs text-stone">Sample measurements. Replace with DS Wardrobe&apos;s real size chart.</p>
    </details>
  )
}
