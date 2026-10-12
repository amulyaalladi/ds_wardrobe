import type { Metadata } from "next"
import { Bodoni_Moda, Figtree } from "next/font/google"
import "./globals.css"
import Providers from "@/components/Providers"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { getCategories } from "@/lib/data"

const display = Bodoni_Moda({ subsets: ["latin"], variable: "--font-display", display: "swap" })
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "DS Wardrobe", template: "%s | DS Wardrobe" },
  description: "DS Wardrobe: your style is your personal brand. Shirts, tees and pants, shipped across India.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Navigation must never take the whole site down if the API is unreachable.
  const categories = await getCategories().catch(() => [])
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>
          <Header categories={categories as any} />
          <main className="container-page min-h-[60vh] py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
