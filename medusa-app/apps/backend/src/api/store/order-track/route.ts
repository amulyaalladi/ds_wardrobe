import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /store/order-track?display_id=12&email=a@b.com
// Guests prove ownership with order number + email. Returns a limited view only.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const displayId = Number(req.query.display_id)
  const email = String(req.query.email ?? "").trim().toLowerCase()

  if (!Number.isInteger(displayId) || displayId < 1 || !email.includes("@")) {
    return res
      .status(400)
      .json({ message: "Provide a valid order number and email." })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "status", "created_at", "currency_code",
      "total", "subtotal", "shipping_total", "discount_total",
      "payment_status", "fulfillment_status",
      "items.id", "items.title", "items.product_title", "items.variant_title",
      "items.quantity", "items.unit_price", "items.thumbnail",
      "shipping_address.first_name", "shipping_address.city",
      "shipping_address.province", "shipping_address.postal_code",
      "shipping_address.address_1", "shipping_address.country_code",
      "shipping_methods.name",
    ],
        // display_id is a number in the database, but Medusa's generated filter type says string.
    filters: { display_id: displayId } as any,
  })

  const order = data[0]
  // Same message for "not found" and "wrong email" so order numbers can't be probed.
  if (!order || order.email?.toLowerCase() !== email) {
    return res.status(404).json({ message: "We couldn't find that order." })
  }
  const { email: _omit, ...safe } = order
  res.json({ order: safe })
}
