"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { errorMessage, formatDate, formatPrice } from "@/lib/format"
import { PRODUCT_FIELDS } from "@/lib/product"
import { ProductGrid } from "@/components/ProductCard"
import OrderTimeline from "@/components/OrderTimeline"
import { Alert, Button, EmptyState, Skeleton } from "@/components/ui"

type Tab = "orders" | "profile" | "addresses" | "wishlist"

export default function AccountPage() {
  const { customer, loading, logout } = useAuth()
  const router = useRouter()
  const { clear } = useCart()
  const [tab, setTab] = useState<Tab>("orders")

  useEffect(() => { if (!loading && !customer) router.replace("/login") }, [loading, customer, router])
  if (loading || !customer) return <Skeleton className="h-64" />

  const tabs: [Tab, string][] = [["orders", "Orders"], ["profile", "Profile"], ["addresses", "Addresses"], ["wishlist", "Wishlist"]]
  return (
    <div>
      <div className="flex items-end justify-between">
        <h1 className="font-display text-4xl">Hi, {customer.first_name || "there"}</h1>
        <button className="text-sm underline underline-offset-4" onClick={async () => { await logout(); clear(); router.push("/") }}>Sign out</button>
      </div>
      <div role="tablist" className="mt-6 flex gap-6 border-b border-line text-sm">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 pb-2 ${tab === k ? "border-ink font-medium" : "border-transparent text-stone"}`}>{l}</button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "orders" && <Orders />}
        {tab === "profile" && <Profile />}
        {tab === "addresses" && <Addresses />}
        {tab === "wishlist" && <Wishlist />}
      </div>
    </div>
  )
}

function Orders() {
  const [orders, setOrders] = useState<HttpTypes.StoreOrder[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    sdk.store.order.list({ limit: 20, order: "-created_at", fields: "+items.thumbnail" })
      .then((r) => setOrders(r.orders)).catch(() => setFailed(true))
  }, [])
  if (failed) return <Alert>We couldn&apos;t load your orders. Refresh to try again.</Alert>
  if (!orders) return <Skeleton className="h-40" />
  if (!orders.length) return <EmptyState title="No orders yet" text="When you place an order, it shows up here." actionHref="/shop" actionLabel="Shop now" />
  return (
    <ul className="space-y-6">
      {orders.map((o) => (
        <li key={o.id} className="bg-white p-5">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <p className="font-medium">Order #{o.display_id} <span className="font-normal text-stone">· {formatDate(o.created_at)}</span></p>
            <p>{formatPrice(o.total, o.currency_code)}</p>
          </div>
          <ul className="mt-3 text-sm text-stone">{o.items?.map((i) => <li key={i.id}>{i.product_title} · {i.variant_title} × {i.quantity}</li>)}</ul>
          <details className="mt-4"><summary className="cursor-pointer text-sm underline underline-offset-4">Track order</summary><div className="mt-3"><OrderTimeline order={o} /></div></details>
        </li>
      ))}
    </ul>
  )
}

function Profile() {
  const { customer, reload } = useAuth()
  const [f, setF] = useState({ first_name: customer?.first_name ?? "", last_name: customer?.last_name ?? "", phone: customer?.phone ?? "" })
  const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setErr(null)
    try { await sdk.store.customer.update(f); await reload(); setMsg("Profile saved.") } catch (x) { setErr(errorMessage(x)) }
  }
  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <p className="text-sm text-stone">{customer?.email}</p>
      {(["first_name", "last_name", "phone"] as const).map((k) => (
        <div key={k}><label htmlFor={k} className="label">{k === "phone" ? "Mobile number" : k === "first_name" ? "First name" : "Last name"}</label>
          <input id={k} className="field" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
      ))}
      {err && <Alert>{err}</Alert>}{msg && <p className="text-sm text-mulberry">{msg}</p>}
      <Button type="submit">Save changes</Button>
    </form>
  )
}

function Addresses() {
  const { customer, reload } = useAuth()
  const blank = { first_name: "", last_name: "", address_1: "", city: "", province: "", postal_code: "", phone: "", country_code: "in" }
  const [f, setF] = useState(blank)
  const [err, setErr] = useState<string | null>(null)
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr(null)
    if (!/^\d{6}$/.test(f.postal_code)) return setErr("Enter a 6-digit PIN code.")
    try { await sdk.store.customer.createAddress(f); await reload(); setF(blank) } catch (x) { setErr(errorMessage(x)) }
  }
  async function remove(id: string) { await sdk.store.customer.deleteAddress(id); await reload() }
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        {customer?.addresses?.length ? (
          <ul className="space-y-3 text-sm">
            {customer.addresses.map((a) => (
              <li key={a.id} className="flex justify-between gap-3 bg-white p-4">
                <span>{a.first_name} {a.last_name}<br />{a.address_1}, {a.city}, {a.province} {a.postal_code}</span>
                <button className="self-start underline underline-offset-4" onClick={() => remove(a.id)}>Delete</button>
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No saved addresses" text="Add one to speed up checkout." />}
      </div>
      <form onSubmit={add} className="space-y-3">
        <h2 className="font-display text-2xl">Add address</h2>
        {(["first_name", "last_name", "address_1", "city", "province", "postal_code", "phone"] as const).map((k) => (
          <div key={k}><label htmlFor={`a-${k}`} className="label">{k.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}</label>
            <input id={`a-${k}`} required className="field" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
        ))}
        {err && <Alert>{err}</Alert>}
        <Button type="submit">Save address</Button>
      </form>
    </div>
  )
}

function Wishlist() {
  const { customer } = useAuth()
  const ids: string[] = ((customer?.metadata as any)?.wishlist as string[]) ?? []
  const [products, setProducts] = useState<HttpTypes.StoreProduct[] | null>(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(async () => {
    if (!ids.length) return setProducts([])
    try {
      const { regions } = await sdk.store.region.list()
      const { products } = await sdk.store.product.list({ id: ids, region_id: regions[0].id, fields: PRODUCT_FIELDS })
      setProducts(products)
    } catch { setFailed(true) }
  }, [ids.join(",")]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  if (failed) return <Alert>We couldn&apos;t load your wishlist.</Alert>
  if (!products) return <Skeleton className="h-40" />
  if (!products.length) return <EmptyState title="Your wishlist is empty" text="Tap “Save for later” on any product." actionHref="/shop" actionLabel="Shop now" />
  return <ProductGrid products={products} />
}
