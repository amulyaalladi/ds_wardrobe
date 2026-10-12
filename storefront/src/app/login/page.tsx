"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Alert, Button } from "@/components/ui"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await login(email, password); router.push("/account") }
    catch { setError("That email and password don't match. Check them and try again.") }
    finally { setBusy(false) }
  }
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-4xl">Sign in</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><label htmlFor="email" className="label">Email</label><input id="email" type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label htmlFor="pw" className="label">Password</label><input id="pw" type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <Alert>{error}</Alert>}
        <Button type="submit" full disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="mt-4 text-sm">New here? <Link href="/register" className="underline underline-offset-4">Create an account</Link>. Or <Link href="/checkout" className="underline underline-offset-4">check out as a guest</Link>.</p>
    </div>
  )
}
