"use client"
import { useState } from "react"
import Link from "next/link"
import { sdk } from "@/lib/medusa"
import { useAuth } from "@/lib/auth-context"

/** Wishlist lives in customer.metadata.wishlist (array of product ids). */
export default function WishlistButton({ productId }: { productId: string }) {
  const { customer, reload } = useAuth()
  const [busy, setBusy] = useState(false)
  const list: string[] = ((customer?.metadata as any)?.wishlist as string[]) ?? []
  const saved = list.includes(productId)

  if (!customer) {
    return <Link href="/login" className="whitespace-nowrap text-sm underline underline-offset-4">Save for later</Link>
  }
  async function toggle() {
    setBusy(true)
    try {
      const next = saved ? list.filter((i) => i !== productId) : [...list, productId]
      await sdk.store.customer.update({ metadata: { ...(customer!.metadata ?? {}), wishlist: next } })
      await reload()
    } finally { setBusy(false) }
  }
  return (
    <button onClick={toggle} disabled={busy} aria-pressed={saved} className="whitespace-nowrap text-sm underline underline-offset-4">
      {saved ? "Saved" : "Save for later"}
    </button>
  )
}
