"use client"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"

export default function CartCount() {
  const { count } = useCart()
  return (
    <Link href="/cart" className="relative px-2 py-1 text-sm" aria-label={`Cart, ${count} items`}>
      Bag
      <span className="ml-1 inline-block min-w-5 bg-ink px-1 text-center text-xs text-paper">{count}</span>
    </Link>
  )
}
