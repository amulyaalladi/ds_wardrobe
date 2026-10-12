/** Thin wrapper around Razorpay Standard Checkout (loaded from Razorpay's own script). */
declare global { interface Window { Razorpay?: any } }

let loading: Promise<boolean> | null = null

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (!loading) {
    loading = new Promise((resolve) => {
      const s = document.createElement("script")
      s.src = "https://checkout.razorpay.com/v1/checkout.js"
      s.onload = () => resolve(true)
      s.onerror = () => { loading = null; resolve(false) }
      document.body.appendChild(s)
    })
  }
  return loading
}

export type RazorpayResult =
  | { status: "paid" }
  | { status: "dismissed" }
  | { status: "failed"; message: string }

export async function openRazorpay(o: {
  orderId: string
  amountPaise: number
  currency: string
  name: string
  description: string
  prefill: { name?: string; email?: string; contact?: string }
}): Promise<RazorpayResult> {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  if (!keyId) return { status: "failed", message: "Online payment isn't configured yet." }
  if (!(await loadRazorpay())) return { status: "failed", message: "Couldn't load the payment window. Check your connection." }

  return new Promise<RazorpayResult>((resolve) => {
    const rzp = new window.Razorpay({
      key: keyId,
      order_id: o.orderId,
      amount: o.amountPaise,
      currency: o.currency,
      name: o.name,
      description: o.description,
      prefill: o.prefill,
      theme: { color: "#5B2245" },
      handler: () => resolve({ status: "paid" }),
      modal: { ondismiss: () => resolve({ status: "dismissed" }) },
    })
    rzp.on("payment.failed", (r: any) =>
      resolve({ status: "failed", message: r?.error?.description || "The payment failed. You haven't been charged." })
    )
    rzp.open()
  })
}
