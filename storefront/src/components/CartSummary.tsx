import type { HttpTypes } from "@medusajs/types"
import { formatPrice } from "@/lib/format"

export default function CartSummary({ cart }: { cart: HttpTypes.StoreCart }) {
  const c = cart.currency_code
  const row = (label: string, value: React.ReactNode, strong = false) => (
    <div className={`flex justify-between ${strong ? "border-t border-line pt-3 text-base font-medium" : ""}`}><dt>{label}</dt><dd>{value}</dd></div>
  )
  return (
    <dl className="space-y-2 text-sm">
      {row("Subtotal", formatPrice(cart.item_subtotal ?? cart.subtotal, c))}
      {cart.discount_total > 0 && row("Discount", `−${formatPrice(cart.discount_total, c)}`)}
      {row("Shipping", cart.shipping_methods?.length ? formatPrice(cart.shipping_total, c) : "Calculated at checkout")}
      {row("Total", formatPrice(cart.total, c), true)}
    </dl>
  )
}
