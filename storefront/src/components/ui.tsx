import Link from "next/link"
import { formatPrice } from "@/lib/format"

type BtnProps = {
  /** "light" and "lightOutline" are for dark backgrounds (hero, mulberry band). */
  variant?: "primary" | "secondary" | "ghost" | "light" | "lightOutline"
  full?: boolean
  href?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant = "primary", full, href, className = "", children, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 " +
    (full ? "w-full " : "")
  const styles = {
    primary: "bg-ink text-paper hover:bg-mulberry",
    secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
    ghost: "text-ink underline underline-offset-4 hover:text-mulberry",
    light: "bg-paper text-ink hover:bg-mulberry hover:text-paper",
    lightOutline: "border border-paper text-paper hover:bg-paper hover:text-ink",
  }[variant]
  const cls = `${base}${styles} ${className}`
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button className={cls} {...rest}>{children}</button>
}

export function Price({ amount, compareAt, currency, size = "md" }: {
  amount: number | null; compareAt?: number | null; currency: string; size?: "md" | "lg"
}) {
  if (amount == null) return <span className="text-stone">Price unavailable</span>
  return (
    <span className={`inline-flex items-baseline gap-2 ${size === "lg" ? "text-xl" : "text-sm"}`}>
      <span className={compareAt ? "font-medium text-sale" : "font-medium"}>{formatPrice(amount, currency)}</span>
      {compareAt ? <span className="text-stone line-through">{formatPrice(compareAt, currency)}</span> : null}
    </span>
  )
}

export function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "sale" | "mute" }) {
  const t = { ink: "bg-ink text-paper", sale: "bg-sale text-white", mute: "bg-line text-ink" }[tone]
  return <span className={`inline-block px-2 py-0.5 text-xs font-medium ${t}`}>{children}</span>
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse bg-line ${className}`} />
}

export function EmptyState({ title, text, actionHref, actionLabel }: {
  title: string; text?: string; actionHref?: string; actionLabel?: string
}) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h2 className="font-display text-2xl">{title}</h2>
      {text && <p className="mt-2 text-stone">{text}</p>}
      {actionHref && <div className="mt-6"><Button href={actionHref}>{actionLabel}</Button></div>}
    </div>
  )
}

export function ErrorState({ title = "We couldn't load this", text = "Check your connection and try again.", onRetry }: {
  title?: string; text?: string; onRetry?: () => void
}) {
  return (
    <div role="alert" className="mx-auto max-w-md py-20 text-center">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 text-stone">{text}</p>
      {onRetry && <div className="mt-6"><Button onClick={onRetry}>Try again</Button></div>}
    </div>
  )
}

export function Alert({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="border border-sale/40 bg-sale/5 px-3 py-2 text-sm text-sale">{children}</p>
}
