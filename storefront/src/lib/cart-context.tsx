"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusa"
import { errorMessage } from "./format"

export const CART_FIELDS = "+items.thumbnail,+items.variant.inventory_quantity,*items.variant.options,*items.variant.options.option,*promotions,*shipping_methods"
const KEY = "dsw_cart_id"

type Cart = HttpTypes.StoreCart
type Ctx = {
  cart: Cart | null
  loading: boolean
  busy: boolean
  error: string | null
  count: number
  addItem: (variantId: string, quantity?: number) => Promise<boolean>
  updateItem: (lineId: string, quantity: number) => Promise<void>
  removeItem: (lineId: string) => Promise<void>
  applyCode: (code: string) => Promise<void>
  removeCode: (code: string) => Promise<void>
  refresh: () => Promise<void>
  setCart: (c: Cart | null) => void
  clear: () => void
  adoptForCustomer: () => Promise<void>
}

const CartContext = createContext<Ctx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clear = useCallback(() => {
    localStorage.removeItem(KEY)
    setCart(null)
  }, [])

  const refresh = useCallback(async () => {
    const id = localStorage.getItem(KEY)
    if (!id) { setCart(null); return }
    try {
      const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS })
      if (cart.completed_at) clear()
      else setCart(cart)
    } catch {
      clear() // stale/invalid cart id
    }
  }, [clear])

  useEffect(() => { refresh().finally(() => setLoading(false)) }, [refresh])

  async function ensureCart(): Promise<Cart> {
    if (cart) return cart
    const { regions } = await sdk.store.region.list()
    const region = regions.find((r) => r.currency_code === "inr") ?? regions[0]
    if (!region) throw new Error("Store is not configured yet (no region).")
    const { cart: created } = await sdk.store.cart.create({ region_id: region.id })
    localStorage.setItem(KEY, created.id)
    setCart(created)
    return created
  }

  async function run(fn: () => Promise<void>): Promise<boolean> {
    setBusy(true); setError(null)
    try { await fn(); return true }
    catch (e) { setError(errorMessage(e)); return false }
    finally { setBusy(false) }
  }

  const value = useMemo<Ctx>(() => ({
    cart, loading, busy, error,
    count: cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0,
    refresh, setCart, clear,
    addItem: (variantId, quantity = 1) => run(async () => {
      const c = await ensureCart()
      await sdk.store.cart.createLineItem(c.id, { variant_id: variantId, quantity })
      await refresh()
    }),
    updateItem: async (lineId, quantity) => { await run(async () => {
      if (!cart) return
      await sdk.store.cart.updateLineItem(cart.id, lineId, { quantity })
      await refresh()
    }) },
    removeItem: async (lineId) => { await run(async () => {
      if (!cart) return
      await sdk.store.cart.deleteLineItem(cart.id, lineId)
      await refresh()
    }) },
    applyCode: async (code) => { await run(async () => {
      if (!cart) return
      await sdk.store.cart.update(cart.id, { promo_codes: [code.trim()] })
      await refresh()
    }) },
    removeCode: async (code) => { await run(async () => {
      if (!cart) return
      const codes = (cart.promotions ?? []).map((p) => p.code!).filter((c) => c && c !== code)
      await sdk.store.cart.update(cart.id, { promo_codes: codes })
      await refresh()
    }) },
    adoptForCustomer: async () => {
      if (!cart) return
      try { await sdk.store.cart.transferCart(cart.id); await refresh() } catch { /* already owned */ }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cart, loading, busy, error, refresh, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
