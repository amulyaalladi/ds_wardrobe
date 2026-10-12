"use client"
import { useState } from "react"
import { sdk } from "@/lib/medusa"
import { errorMessage, formatDate, formatPrice } from "@/lib/format"
import OrderTimeline from "@/components/OrderTimeline"
import { Alert, Button } from "@/components/ui"

export default function TrackPage() {
  const [displayId, setDisplayId] = useState(""); const [email, setEmail] = useState("")
  const [order, setOrder] = useState<any>(null); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setOrder(null)
    try {
      const r = await sdk.client.fetch<{ order: any }>("/store/order-track", { query: { display_id: displayId.replace("#", ""), email } })
      setOrder(r.order)
    } catch (x) { setError(errorMessage(x, "We couldn't find that order. Check the number and email.")) }
    finally { setBusy(false) }
  }
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl">Track your order</h1>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="oid" className="label">Order number</label><input id="oid" required inputMode="numeric" className="field" value={displayId} onChange={(e) => setDisplayId(e.target.value)} /></div>
        <div><label htmlFor="oem" className="label">Email used at checkout</label><input id="oem" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Looking up…" : "Track order"}</Button></div>
      </form>
      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {order && (
        <div className="mt-10">
          <h2 className="font-display text-2xl">Order #{order.display_id}</h2>
          <p className="text-sm text-stone">Placed {formatDate(order.created_at)}</p>
          <div className="mt-5"><OrderTimeline order={order} /></div>
          <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
            {order.items?.map((i: any) => <li key={i.id} className="flex justify-between py-2"><span>{i.product_title} · {i.variant_title} × {i.quantity}</span><span>{formatPrice(i.unit_price * i.quantity, order.currency_code)}</span></li>)}
          </ul>
          {order.shipping_address && (
            <p className="mt-4 text-sm text-stone">Shipping to {order.shipping_address.first_name}, {order.shipping_address.address_1}, {order.shipping_address.city} {order.shipping_address.postal_code}
              {order.shipping_methods?.[0] ? ` · ${order.shipping_methods[0].name}` : ""}</p>
          )}
        </div>
      )}
    </div>
  )
}
