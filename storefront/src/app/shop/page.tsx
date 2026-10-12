import Link from "next/link"
import type { Metadata } from "next"
import { PAGE_SIZE, getCategories, getCollections, getProducts, type ShopQuery } from "@/lib/data"
import { optionValues } from "@/lib/product"
import FilterPanel from "@/components/FilterPanel"
import { ProductGrid } from "@/components/ProductCard"
import { EmptyState, ErrorState } from "@/components/ui"

export const metadata: Metadata = { title: "Shop" }

type SP = Record<string, string | undefined>

function parse(sp: SP): ShopQuery {
  const num = (v?: string) => (v && !isNaN(Number(v)) ? Number(v) : undefined)
  const sort = sp.sort === "price-asc" || sp.sort === "price-desc" ? sp.sort : "newest"
  return {
    q: sp.q?.trim() || undefined,
    category: sp.category || undefined,
    collection: sp.collection || undefined,
    size: sp.size || undefined,
    color: sp.color || undefined,
    min: num(sp.min), max: num(sp.max),
    inStock: sp.inStock === "1",
    sort,
    page: Math.max(1, num(sp.page) ?? 1),
  }
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const q = parse(sp)

  let data
  try {
    const [res, categories, collections] = await Promise.all([getProducts(q), getCategories(), getCollections()])
    // Build size/color choices from the unfiltered catalogue
    const base = await getProducts({ q: q.q, category: q.category, collection: q.collection, limit: 100 })
    data = {
      ...res, categories, collections,
      sizes: [...new Set(base.all.flatMap((p) => optionValues(p, "Size")))],
      colors: [...new Set(base.all.flatMap((p) => optionValues(p, "Color")))],
    }
  } catch {
    return <ErrorState title="We couldn't load the shop" text="The catalogue is unreachable right now." />
  }

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  const href = (page: number) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) if (v && k !== "page") p.set(k, v)
    p.set("page", String(page))
    return `/shop?${p.toString()}`
  }

  return (
    <div>
      <h1 className="font-display text-4xl">{q.q ? `Results for “${q.q}”` : "Shop"}</h1>
      <p className="mt-1 text-sm text-stone">{data.total} {data.total === 1 ? "piece" : "pieces"}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <FilterPanel current={q} categories={data.categories as any} collections={data.collections as any} sizes={data.sizes} colors={data.colors} />
        </aside>
        <div>
          {data.products.length === 0 ? (
            <EmptyState title="No matches" text="Try removing a filter or searching for something else." actionHref="/shop" actionLabel="Clear filters" />
          ) : (
            <ProductGrid products={data.products} />
          )}
          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm">
              {(q.page ?? 1) > 1 && <Link href={href((q.page ?? 1) - 1)} className="underline underline-offset-4">Previous</Link>}
              <span>Page {q.page} of {pages}</span>
              {(q.page ?? 1) < pages && <Link href={href((q.page ?? 1) + 1)} className="underline underline-offset-4">Next</Link>}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
