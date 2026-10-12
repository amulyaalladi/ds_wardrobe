import Link from "next/link"
import CartCount from "./CartCount"
import AccountLink from "./AccountLink"

type Cat = { id: string; name: string; handle: string }

export default function Header({ categories }: { categories: Cat[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="bg-mulberry px-4 py-1.5 text-center text-xs text-paper">
        Shipping across India · Order here or on WhatsApp
      </div>
      <div className="container-page flex h-14 items-center justify-between gap-4">
        <details className="relative lg:hidden">
          <summary className="cursor-pointer list-none px-1 py-2 text-sm" aria-label="Menu">Menu</summary>
          <nav className="absolute left-0 top-full mt-2 w-64 border border-line bg-paper p-4 shadow-lg">
            <ul className="space-y-3 text-sm">
              <li><Link href="/shop">All products</Link></li>
              {categories.map((c) => <li key={c.id}><Link href={`/shop?category=${c.handle}`}>{c.name}</Link></li>)}
              <li><Link href="/track">Track order</Link></li>
            </ul>
          </nav>
        </details>

        <Link href="/" className="font-display text-xl tracking-tight">DS Wardrobe</Link>

        <nav className="hidden items-center gap-6 text-sm lg:flex" aria-label="Main">
          <Link href="/shop" className="hover:text-mulberry">Shop</Link>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.id} href={`/shop?category=${c.handle}`} className="hover:text-mulberry">{c.name}</Link>
          ))}
          <Link href="/track" className="hover:text-mulberry">Track order</Link>
        </nav>

        <div className="flex items-center gap-1">
          <form action="/shop" className="hidden sm:block">
            <input name="q" type="search" placeholder="Search" aria-label="Search products" className="field w-40 py-1.5" />
          </form>
          <AccountLink />
          <CartCount />
        </div>
      </div>
      <form action="/shop" className="container-page pb-2 sm:hidden">
        <input name="q" type="search" placeholder="Search products" aria-label="Search products" className="field py-1.5" />
      </form>
    </header>
  )
}
