"use client"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import CartLine from "@/components/CartLine"
import CartSummary from "@/components/CartSummary"
import { Alert, Button, EmptyState, Skeleton } from "@/components/ui"
import { whatsappLink } from "@/lib/site"

export default function CartPage() {
  const { cart, loading, error, applyCode, removeCode, busy } = useCart()
  const [code, setCode] = useState("")

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-40" /><Skeleton className="h-40" /></div>
  if (!cart || !cart.items?.length)
    return <EmptyState title="Your bag is empty" text="Pieces you add will wait for you here." actionHref="/shop" actionLabel="Shop now" />

  return (
    <div>
      <h1 className="font-display text-4xl">Your bag</h1>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((i) => <CartLine key={i.id} item={i} currency={cart.currency_code} />)}
        </ul>
        <aside className="h-fit space-y-5 bg-white p-5">
          <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) { applyCode(code); setCode("") } }} className="flex gap-2">
            <label htmlFor="promo" className="sr-only">Discount code</label>
            <input id="promo" className="field" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Button type="submit" variant="secondary" disabled={busy}>Apply</Button>
          </form>
          {cart.promotions?.map((p) => (
            <p key={p.id} className="flex justify-between text-sm"><span>Code {p.code} applied</span>
              <button onClick={() => removeCode(p.code!)} className="underline underline-offset-4">Remove</button></p>
          ))}
          {error && <Alert>{error}</Alert>}
          <CartSummary cart={cart} />
          <Button href="/checkout" full>Checkout</Button>
          <a target="_blank" rel="noopener noreferrer" className="block text-center text-sm underline underline-offset-4"
            href={whatsappLink("Hi DS Wardrobe! I'd like to order:\n" + cart.items.map((i) => `${i.product_title} (${i.variant_title}) x${i.quantity}`).join("\n"))}>
            Or send this bag on WhatsApp
          </a>
        </aside>
      </div>
    </div>
  )
}
