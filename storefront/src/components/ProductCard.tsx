import Link from "next/link"
import Image from "next/image"
import { Badge, Price } from "./ui"
import { minPrice, productInStock, type Product } from "@/lib/product"
import { productImage } from "@/lib/media"

export default function ProductCard({ product }: { product: Product }) {
  const price = minPrice(product)
  const inStock = productInStock(product)
  const img = productImage(product)
  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-line">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            sizes="(min-width:1024px) 25vw, 50vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-[1.03] ${inStock ? "" : "opacity-60"}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-5xl text-stone/60">DS</div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {!inStock && <Badge tone="mute">Sold out</Badge>}
          {inStock && price.compareAt && <Badge tone="sale">Sale</Badge>}
        </div>
      </div>
      <h3 className="mt-3 text-sm">{product.title}</h3>
      <div className="mt-1"><Price amount={price.amount} compareAt={price.compareAt} currency={price.currency} /></div>
    </Link>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
      {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
    </ul>
  )
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[3/4] animate-pulse bg-line" />
          <div className="mt-3 h-3 w-3/4 animate-pulse bg-line" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-line" />
        </div>
      ))}
    </div>
  )
}
