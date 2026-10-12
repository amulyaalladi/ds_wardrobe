"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "./medusa"
import { useCart } from "./cart-context"

type Customer = HttpTypes.StoreCustomer
type Ctx = {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (d: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>
  logout: () => Promise<void>
  reload: () => Promise<void>
}
const AuthContext = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const { adoptForCustomer } = useCart()

  const reload = useCallback(async () => {
    try {
      const { customer } = await sdk.store.customer.retrieve()
      setCustomer(customer)
    } catch {
      setCustomer(null)
    }
  }, [])

  useEffect(() => { reload().finally(() => setLoading(false)) }, [reload])

  const value: Ctx = {
    customer, loading, reload,
    async login(email, password) {
      await sdk.auth.login("customer", "emailpass", { email, password })
      await reload()
      await adoptForCustomer() // attach the guest cart to this customer
    },
    async register({ email, password, first_name, last_name }) {
      const token = await sdk.auth.register("customer", "emailpass", { email, password })
      await sdk.store.customer.create(
        { email, first_name, last_name },
        {},
        { Authorization: `Bearer ${token}` }
      )
      await value.login(email, password)
    },
    async logout() {
      await sdk.auth.logout()
      setCustomer(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
