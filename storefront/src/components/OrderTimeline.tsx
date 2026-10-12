const STEPS = ["Order placed", "Payment confirmed", "Packed", "Shipped", "Delivered"] as const

/** Maps Medusa order statuses onto the customer-facing timeline. Returns index of the current step. */
export function timelineIndex(o: { status?: string; payment_status?: string; fulfillment_status?: string }) {
  if (o.fulfillment_status === "delivered") return 4
  if (o.fulfillment_status === "shipped" || o.fulfillment_status === "partially_shipped") return 3
  if (o.fulfillment_status === "fulfilled" || o.fulfillment_status === "partially_fulfilled") return 2
  if (o.payment_status === "captured" || o.payment_status === "authorized" || o.payment_status === "partially_captured") return 1
  return 0
}

export default function OrderTimeline({ order }: { order: any }) {
  if (order.status === "canceled") return <p className="text-sm text-sale">This order was cancelled.</p>
  const current = timelineIndex(order)
  return (
    <ol className="space-y-4">
      {STEPS.map((label, i) => {
        const done = i <= current
        return (
          <li key={label} className="flex items-center gap-3 text-sm" aria-current={i === current ? "step" : undefined}>
            <span className={`h-3 w-3 shrink-0 rounded-full ${done ? "bg-mulberry" : "border border-line bg-white"}`} />
            <span className={done ? "font-medium" : "text-stone"}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
