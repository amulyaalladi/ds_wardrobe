"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { errorMessage } from "@/lib/format"
import { Alert, Button } from "@/components/ui"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [f, setF] = useState({ first_name: "", last_name: "", email: "", password: "" })
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (f.password.length < 8) return setError("Use a password with at least 8 characters.")
    setBusy(true)
    try { await register(f); router.push("/account") }
    catch (err) { setError(errorMessage(err, "We couldn't create your account. That email may already be registered.")) }
    finally { setBusy(false) }
  }
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-4xl">Create account</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="fn" className="label">First name</label><input id="fn" required className="field" autoComplete="given-name" value={f.first_name} onChange={on("first_name")} /></div>
          <div><label htmlFor="ln" className="label">Last name</label><input id="ln" required className="field" autoComplete="family-name" value={f.last_name} onChange={on("last_name")} /></div>
        </div>
        <div><label htmlFor="em" className="label">Email</label><input id="em" type="email" required className="field" autoComplete="email" value={f.email} onChange={on("email")} /></div>
        <div><label htmlFor="pw" className="label">Password</label><input id="pw" type="password" required className="field" autoComplete="new-password" value={f.password} onChange={on("password")} /></div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" full disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-4 text-sm">Already have an account? <Link href="/login" className="underline underline-offset-4">Sign in</Link></p>
    </div>
  )
}
