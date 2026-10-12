"use client"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { sdk } from "@/lib/medusa"
import { useAuth } from "@/lib/auth-context"
import { Alert, Button } from "./ui"
import { errorMessage, formatDate } from "@/lib/format"

type Review = { id: string; author_name: string; rating: number; comment: string | null; created_at: string }

export default function Reviews({ productId }: { productId: string }) {
  const { customer } = useAuth()
  const [data, setData] = useState<{ reviews: Review[]; count: number; average: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    sdk.client.fetch<any>(`/store/products/${productId}/reviews`).then(setData).catch(() => setFailed(true))
  }, [productId])
  useEffect(load, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null)
    try {
      await sdk.client.fetch(`/store/products/${productId}/reviews`, {
        method: "POST",
        body: { rating, comment: comment || undefined, author_name: customer?.first_name || "Customer" },
      })
      setComment(""); setMsg("Thanks! Your review will appear once it's approved.")
    } catch (e) { setErr(errorMessage(e)) }
  }

  return (
    <section className="mt-20" aria-labelledby="reviews">
      <h2 id="reviews" className="font-display text-3xl">Reviews</h2>
      {failed && <p className="mt-3 text-sm text-stone">Reviews are unavailable right now.</p>}
      {data && data.count === 0 && <p className="mt-3 text-sm text-stone">No reviews yet. Be the first to share how it fits.</p>}
      {data && data.count > 0 && (
        <>
          <p className="mt-2 text-sm">{data.average.toFixed(1)} out of 5 · {data.count} reviews</p>
          <ul className="mt-4 divide-y divide-line">
            {data.reviews.map((r) => (
              <li key={r.id} className="py-4 text-sm">
                <p className="font-medium">{r.author_name} <span className="font-normal text-stone">· {r.rating}/5 · {formatDate(r.created_at)}</span></p>
                {r.comment && <p className="mt-1 max-w-prose">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-6 max-w-md">
        {customer ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="rating" className="label">Rating</label>
              <select id="rating" className="field" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="comment" className="label">Your review</label>
              <textarea id="comment" className="field" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            {err && <Alert>{err}</Alert>}
            {msg && <p className="text-sm text-mulberry">{msg}</p>}
            <Button type="submit">Submit review</Button>
          </form>
        ) : (
          <p className="text-sm"><Link href="/login" className="underline underline-offset-4">Sign in</Link> to write a review.</p>
        )}
      </div>
    </section>
  )
}
