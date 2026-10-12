import Link from "next/link"
import Image from "next/image"
import Hero from "@/components/Hero"
import { categoryImages } from "@/lib/media"
import { getProducts, getCollections, getCategories } from "@/lib/data"
import { ProductGrid } from "@/components/ProductCard"
import { Button, EmptyState, ErrorState } from "@/components/ui"
import { site, whatsappLink } from "@/lib/site"

export const revalidate = 60

export default async function Home() {
  let newIn, best, collections, categories
  try {
    ;[newIn, best, collections, categories] = await Promise.all([
      getProducts({ collection: "new-arrivals", limit: 4 }),
      getProducts({ collection: "best-sellers", limit: 4 }),
      getCollections(),
      getCategories(),
    ])
  } catch {
    return <ErrorState title="The store is taking a break" text="We couldn't reach the catalogue. Please refresh in a moment." />
  }

  return (
    <div className="space-y-20">
      <Hero />

      {categories.length > 0 && (
        <section aria-labelledby="cats">
          <h2 id="cats" className="mb-6 font-display text-3xl">Shop by category</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-5">
            {categories.map((c, i) => {
              const img = categoryImages[c.handle]
              return (
                <li key={c.id} className={categories.length === 3 && i === 2 ? "col-span-2 sm:col-span-1" : ""}>
                  <Link href={`/shop?category=${c.handle}`} className="group relative block aspect-[4/5] overflow-hidden bg-mulberry-tint">
                    {img && (
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="(min-width:640px) 33vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 font-display text-3xl text-paper sm:text-4xl">{c.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Section title="New arrivals" href="/shop?collection=new-arrivals" products={newIn.products} />
      <Section title="Best sellers" href="/shop?collection=best-sellers" products={best.products} />

      <section className="bg-mulberry px-6 py-14 text-center text-paper sm:px-12">
        <h2 className="font-display text-4xl">Order your way</h2>
        <p className="mx-auto mt-3 max-w-md text-paper/80">Check out online, or message us on WhatsApp or Instagram DM. We ship across India.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/shop" variant="light">Shop now</Button>
          <Button href={whatsappLink("Hi DS Wardrobe! I'd like to place an order.")} variant="lightOutline">WhatsApp {site.phoneDisplay}</Button>
        </div>
      </section>

      <section aria-labelledby="ig" className="text-center">
        <h2 id="ig" className="font-display text-3xl">Join {site.followers} on Instagram</h2>
        <p className="mt-2 text-stone">New drops and styling ideas land on Instagram first.</p>
        <div className="mt-5">
          <Button href={site.instagramUrl} variant="secondary">Follow {site.instagramHandle}</Button>
        </div>
      </section>
    </div>
  )
}

function Section({ title, href, products }: { title: string; href: string; products: any[] }) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-3xl">{title}</h2>
        <Link href={href} className="text-sm underline underline-offset-4">View all</Link>
      </div>
      {products.length ? <ProductGrid products={products} /> : <EmptyState title="Nothing here yet" text="Products added in the admin panel appear here automatically." />}
    </section>
  )
}
