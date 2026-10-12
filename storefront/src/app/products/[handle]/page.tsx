import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getProductByHandle, getRelated } from "@/lib/data"
import ProductDetail from "@/components/ProductDetail"
import Reviews from "@/components/Reviews"
import { ProductGrid } from "@/components/ProductCard"
import { ErrorState } from "@/components/ui"

type Params = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params
  const p = await getProductByHandle(handle).catch(() => null)
  return p ? { title: p.title, description: p.description ?? undefined } : { title: "Product" }
}

export default async function ProductPage({ params }: Params) {
  const { handle } = await params
  let product
  try {
    product = await getProductByHandle(handle)
  } catch {
    return <ErrorState title="We couldn't load this product" />
  }
  if (!product) notFound()
  const related = await getRelated(product).catch(() => [])

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-stone">
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        {product.categories?.[0] && <> / <Link href={`/shop?category=${product.categories[0].handle}`} className="hover:text-ink">{product.categories[0].name}</Link></>}
      </nav>
      <ProductDetail product={product} />
      <Reviews productId={product.id} />
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-3xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}
