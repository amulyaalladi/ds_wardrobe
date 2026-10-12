"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { useCart, CART_FIELDS } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { errorMessage, formatPrice } from "@/lib/format"
import { isRazorpay, paymentLabel, sortProviders } from "@/lib/payments"
import { openRazorpay } from "@/lib/razorpay"
import { site } from "@/lib/site"
import { validate, EMPTY, type Form } from "@/lib/checkout-validation"
import CartLine from "@/components/CartLine"
import CartSummary from "@/components/CartSummary"
import { Alert, Button, EmptyState, Skeleton } from "@/components/ui"

type Step = "address" | "shipping" | "payment"
export default function CheckoutPage() {
  const router = useRouter()
  const { cart, loading, setCart, clear, refresh } = useCart()
  const { customer } = useAuth()
  const [step, setStep] = useState<Step>("address")
  const [form, setForm] = useState<Form>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [options, setOptions] = useState<HttpTypes.StoreCartShippingOption[]>([])
  const [optionId, setOptionId] = useState<string | null>(null)
  const [providers, setProviders] = useState<HttpTypes.StorePaymentProvider[]>([])
  const [providerId, setProviderId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!customer) return
    const a = customer.addresses?.find((x) => x.is_default_shipping) ?? customer.addresses?.[0]
    setForm((f) => ({
      ...f,
      email: f.email || customer.email,
      first_name: f.first_name || customer.first_name || a?.first_name || "",
      last_name: f.last_name || customer.last_name || a?.last_name || "",
      phone: f.phone || customer.phone || a?.phone || "",
      address_1: f.address_1 || a?.address_1 || "",
      city: f.city || a?.city || "",
      province: f.province || a?.province || "",
      postal_code: f.postal_code || a?.postal_code || "",
    }))
  }, [customer])

  if (loading) return <Skeleton className="h-96" />
  if (!cart || !cart.items?.length)
    return <EmptyState title="Nothing to check out" text="Add something to your bag first." actionHref="/shop" actionLabel="Shop now" />

  const c = cart
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function guarded(fn: () => Promise<void>) {
    setBusy(true); setError(null)
    try { await fn() } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) }
  }

  const submitAddress = (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate(form); setErrors(v)
    if (Object.keys(v).length) return
    guarded(async () => {
      const address = {
        first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: form.phone.replace(/\s/g, ""),
        address_1: form.address_1.trim(), address_2: form.address_2.trim(), city: form.city.trim(),
        province: form.province.trim(), postal_code: form.postal_code, country_code: "in",
      }
      await sdk.store.cart.update(c.id, { email: form.email.trim(), shipping_address: address, billing_address: address })
      const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: c.id })
      if (!shipping_options.length) throw new Error("We don't deliver to this address yet. Try another PIN code.")
      setOptions(shipping_options); setStep("shipping")
    })
  }

  const submitShipping = () => guarded(async () => {
    if (!optionId) throw new Error("Choose a delivery option.")
    await sdk.store.cart.addShippingMethod(c.id, { option_id: optionId })
    await refresh()
    const { payment_providers } = await sdk.store.payment.listPaymentProviders({ region_id: c.region_id! })
    if (!payment_providers.length) throw new Error("No payment methods are enabled for this region.")
    const sorted = sortProviders(payment_providers)
    setProviders(sorted); setProviderId(sorted[0].id); setStep("payment")
  })

  /** Completes the cart. Retries briefly because an online payment can take a moment to register. */
  async function completeCart(cartId: string, attempts: number) {
    let last = "Payment didn't go through. You haven't been charged."
    for (let i = 0; i < attempts; i++) {
      const res = await sdk.store.cart.complete(cartId)
      if (res.type === "order") return res.order
      last = res.error?.message ?? last
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000))
    }
    throw new Error(last)
  }

  const placeOrder = () => guarded(async () => {
    if (!providerId) throw new Error("Choose a payment method.")
    const { cart: fresh } = await sdk.store.cart.retrieve(c.id, { fields: CART_FIELDS })
    setCart(fresh)
    const { payment_collection } = await sdk.store.payment.initiatePaymentSession(fresh, { provider_id: providerId })

    if (isRazorpay(providerId)) {
      // Online payment: open Razorpay and only create the order once it reports success.
      const session: any = payment_collection.payment_sessions?.find((x) => x.provider_id === providerId)
      const rzpOrder = session?.data?.razorpayOrder
      if (!rzpOrder?.id) throw new Error("We couldn't start the online payment. Please try again or choose cash on delivery.")
      const result = await openRazorpay({
        orderId: rzpOrder.id,
        // Razorpay amounts are in paise; prefer the amount Razorpay itself recorded for this order.
        amountPaise: Number(rzpOrder.amount) || Math.round(Number(session.amount) * 100),
        currency: (rzpOrder.currency || fresh.currency_code).toUpperCase(),
        name: site.name,
        description: `Order for ${fresh.items?.length ?? 0} item(s)`,
        prefill: { name: `${form.first_name} ${form.last_name}`.trim(), email: form.email, contact: form.phone },
      })
      if (result.status === "dismissed") throw new Error("Payment was cancelled. Your bag is still saved.")
      if (result.status === "failed") throw new Error(result.message)
      const order = await completeCart(c.id, 4)
      clear()
      router.push(`/order/${order.id}/confirmed`)
      return
    }

    // Cash on delivery (built-in manual provider): the order is created now and paid on delivery.
    const order = await completeCart(c.id, 1)
    clear()
    router.push(`/order/${order.id}/confirmed`)
  })

  return (
    <div>
      <h1 className="font-display text-4xl">Checkout</h1>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {error && <Alert>{error}</Alert>}

          {/* 1. Address */}
          <section>
            <h2 className="font-display text-2xl">1. Delivery details</h2>
            {step === "address" ? (
              <form onSubmit={submitAddress} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Email" k="email" type="email" span2 {...{ form, set, errors }} autoComplete="email" />
                <Field label="First name" k="first_name" {...{ form, set, errors }} autoComplete="given-name" />
                <Field label="Last name" k="last_name" {...{ form, set, errors }} autoComplete="family-name" />
                <Field label="Mobile number" k="phone" type="tel" span2 {...{ form, set, errors }} autoComplete="tel-national" />
                <Field label="Address" k="address_1" span2 {...{ form, set, errors }} autoComplete="address-line1" />
                <Field label="Apartment, landmark (optional)" k="address_2" span2 {...{ form, set, errors }} autoComplete="address-line2" />
                <Field label="City" k="city" {...{ form, set, errors }} autoComplete="address-level2" />
                <Field label="State" k="province" {...{ form, set, errors }} autoComplete="address-level1" />
                <Field label="PIN code" k="postal_code" inputMode="numeric" {...{ form, set, errors }} autoComplete="postal-code" />
                <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Continue to delivery"}</Button></div>
              </form>
            ) : (
              <p className="mt-2 text-sm text-stone">{form.first_name} {form.last_name}, {form.address_1}, {form.city} {form.postal_code} · <button className="underline" onClick={() => setStep("address")}>Edit</button></p>
            )}
          </section>

          {/* 2. Shipping */}
          {step !== "address" && (
            <section>
              <h2 className="font-display text-2xl">2. Delivery method</h2>
              {step === "shipping" ? (
                <div className="mt-4 space-y-3">
                  {options.map((o) => (
                    <label key={o.id} className={`flex cursor-pointer justify-between border bg-white p-4 text-sm ${optionId === o.id ? "border-ink" : "border-line"}`}>
                      <span className="flex items-center gap-3"><input type="radio" name="ship" checked={optionId === o.id} onChange={() => setOptionId(o.id)} className="accent-mulberry" />{o.name}</span>
                      <span>{o.amount === 0 ? "Free" : formatPrice(o.amount, c.currency_code)}</span>
                    </label>
                  ))}
                  <Button onClick={submitShipping} disabled={busy}>{busy ? "Saving…" : "Continue to payment"}</Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-stone">{c.shipping_methods?.[0]?.name} · <button className="underline" onClick={() => setStep("shipping")}>Edit</button></p>
              )}
            </section>
          )}

          {/* 3. Payment */}
          {step === "payment" && (
            <section>
              <h2 className="font-display text-2xl">3. Payment</h2>
              <div className="mt-4 space-y-3">
                {providers.map((p) => {
                  const l = paymentLabel(p.id)
                  return (
                    <label key={p.id} className={`flex cursor-pointer items-start gap-3 border bg-white p-4 text-sm ${providerId === p.id ? "border-ink" : "border-line"}`}>
                      <input type="radio" name="pay" checked={providerId === p.id} onChange={() => setProviderId(p.id)} className="mt-0.5 accent-mulberry" />
                      <span><span className="font-medium">{l.title}</span>{l.hint && <span className="block text-stone">{l.hint}</span>}</span>
                    </label>
                  )
                })}
                <Button onClick={placeOrder} disabled={busy} full>{busy ? "Processing…" : isRazorpay(providerId) ? `Pay ${formatPrice(c.total, c.currency_code)}` : `Place order · ${formatPrice(c.total, c.currency_code)}`}</Button>
                <p className="text-xs text-stone">Online orders are created only after payment is confirmed. Cash on delivery orders are confirmed immediately.</p>
              </div>
            </section>
          )}
        </div>

        <aside className="h-fit bg-white p-5">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="divide-y divide-line">{c.items!.map((i) => <CartLine key={i.id} item={i} currency={c.currency_code} readOnly />)}</ul>
          <div className="mt-4"><CartSummary cart={c} /></div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, k, form, set, errors, type = "text", span2, ...rest }: {
  label: string; k: keyof Form; form: Form; set: (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => void
  errors: Partial<Record<keyof Form, string>>; type?: string; span2?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "form">) {
  const id = `f-${k}`
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type={type} value={form[k]} onChange={set(k)} className="field" aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${id}-e` : undefined} {...rest} />
      {errors[k] && <p id={`${id}-e`} className="mt-1 text-xs text-sale">{errors[k]}</p>}
    </div>
  )
}
