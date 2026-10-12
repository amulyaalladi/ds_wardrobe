"use client"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function AccountLink() {
  const { customer, loading } = useAuth()
  if (loading) return <span className="w-14" />
  return (
    <Link href={customer ? "/account" : "/login"} className="px-2 py-1 text-sm">
      {customer ? "Account" : "Sign in"}
    </Link>
  )
}
