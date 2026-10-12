import type { ShopQuery } from "@/lib/data"

type Props = {
  current: ShopQuery
  categories: { handle: string; name: string }[]
  collections: { handle: string; title: string }[]
  sizes: string[]
  colors: string[]
}

/** Plain GET form: filters are URL state, so pages are shareable and work without JS. */
export default function FilterPanel({ current, categories, collections, sizes, colors }: Props) {
  return (
    <details className="border-y border-line py-3 lg:border-0 lg:py-0" open>
      <summary className="cursor-pointer list-none text-sm font-medium lg:hidden">Filters &amp; sort</summary>
      <form action="/shop" className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
        {current.q && <input type="hidden" name="q" value={current.q} />}

        <Select name="sort" label="Sort by" value={current.sort ?? "newest"}
          options={[["newest", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]]} />
        <Select name="category" label="Category" value={current.category ?? ""} options={[["", "All"], ...categories.map((c) => [c.handle, c.name] as [string, string])]} />
        <Select name="collection" label="Collection" value={current.collection ?? ""} options={[["", "All"], ...collections.map((c) => [c.handle, c.title] as [string, string])]} />
        <Select name="size" label="Size" value={current.size ?? ""} options={[["", "Any"], ...sizes.map((s) => [s, s] as [string, string])]} />
        <Select name="color" label="Color" value={current.color ?? ""} options={[["", "Any"], ...colors.map((s) => [s, s] as [string, string])]} />

        <div>
          <span className="label">Price (₹)</span>
          <div className="flex gap-2">
            <input name="min" type="number" min={0} inputMode="numeric" placeholder="Min" defaultValue={current.min} className="field" aria-label="Minimum price" />
            <input name="max" type="number" min={0} inputMode="numeric" placeholder="Max" defaultValue={current.max} className="field" aria-label="Maximum price" />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="inStock" value="1" defaultChecked={current.inStock} className="h-4 w-4 accent-mulberry" />
          In stock only
        </label>

        <div className="flex gap-3">
          <button className="bg-ink px-5 py-2.5 text-paper hover:bg-mulberry">Apply</button>
          <a href="/shop" className="px-3 py-2.5 underline underline-offset-4">Clear</a>
        </div>
      </form>
    </details>
  )
}

function Select({ name, label, value, options }: { name: string; label: string; value: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <select id={name} name={name} defaultValue={value} className="field">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}
