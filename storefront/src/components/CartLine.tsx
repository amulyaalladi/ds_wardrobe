"use client"
import Image from "next/image"
import Link from "next/link"
import type { HttpTypes } from "@medusajs/types"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/format"

export default function CartLine({ item, currency, readOnly }: { item: HttpTypes.StoreCartLineItem; currency: string; readOnly?: boolean }) {
  const { updateItem, removeItem, busy } = useCart()
  const max = item.variant?.manage_inventory && !item.variant.allow_backorder ? item.variant.inventory_quantity ?? 99 : 99
  return (
    <li className="flex gap-4 py-5">
      <div className="relative h-28 w-20 shrink-0 bg-line">
        {item.thumbnail && <Image src={item.thumbnail} alt="" fill sizes="80px" className="object-cover" />}
      </div>
      <div className="flex flex-1 flex-col justify-between text-sm">
        <div className="flex justify-between gap-3">
          <div>
            <Link href={`/products/${item.product_handle}`} className="font-medium hover:text-mulberry">{item.product_title ?? item.title}</Link>
            <p className="text-stone">{item.variant_title}</p>
          </div>
          <p>{formatPrice(item.total, currency)}</p>
        </div>
        {readOnly ? <p className="text-stone">Qty {item.quantity}</p> : (
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center border border-line bg-white">
              <button disabled={busy || item.quantity <= 1} onClick={() => updateItem(item.id, item.quantity - 1)} className="h-8 w-8 disabled:opacity-40" aria-label="Decrease quantity">−</button>
              <span className="w-8 text-center" aria-live="polite">{item.quantity}</span>
              <button disabled={busy || item.quantity >= max} onClick={() => updateItem(item.id, item.quantity + 1)} className="h-8 w-8 disabled:opacity-40" aria-label="Increase quantity">+</button>
            </div>
            <button disabled={busy} onClick={() => removeItem(item.id)} className="underline underline-offset-4">Remove</button>
          </div>
        )}
      </div>
    </li>
  )
}
