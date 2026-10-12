import Link from "next/link"
import { site, whatsappLink } from "@/lib/site"

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page grid gap-8 py-12 text-sm sm:grid-cols-3">
        <div>
          <p className="font-display text-xl">{site.name}</p>
          <p className="mt-2 max-w-xs text-stone">{site.tagline} {site.subline}</p>
        </div>
        <ul className="space-y-2">
          <li><Link href="/shop">Shop all</Link></li>
          <li><Link href="/track">Track your order</Link></li>
          <li><Link href="/account">Your account</Link></li>
        </ul>
        <div className="space-y-2">
          <p>{site.location}, India</p>
          <p><a href={whatsappLink("Hi DS Wardrobe!")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">WhatsApp {site.phoneDisplay}</a></p>
          <p><a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Instagram {site.instagramHandle}</a></p>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-stone">© {new Date().getFullYear()} {site.name}</p>
    </footer>
  )
}
