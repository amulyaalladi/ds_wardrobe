"use client"
import { use, useEffect, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { formatPrice } from "@/lib/format"
import OrderTimeline from "@/components/OrderTimeline"
import { Button, ErrorState, Skeleton } from "@/components/ui"

export default function Confirmed({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    sdk.store.order.retrieve(id).then(({ order }) => setOrder(order)).catch(() => setFailed(true))
  }, [id])

  if (failed) return <ErrorState title="Order placed" text="We couldn't load the details here, but your order is confirmed. Track it any time with your order number and email." />
  if (!order) return <Skeleton className="h-64" />
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl">Thank you, order #{order.display_id} is confirmed</h1>
      <p className="mt-2 text-stone">We sent the details to {order.email}.</p>
      <div className="mt-8"><OrderTimeline order={order} /></div>
      <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
        {order.items?.map((i) => (
          <li key={i.id} className="flex justify-between py-3"><span>{i.product_title} · {i.variant_title} × {i.quantity}</span><span>{formatPrice(i.total, order.currency_code)}</span></li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between font-medium"><span>Total</span><span>{formatPrice(order.total, order.currency_code)}</span></p>
      <div className="mt-8"><Button href="/shop">Continue shopping</Button></div>
    </div>
  )
}
