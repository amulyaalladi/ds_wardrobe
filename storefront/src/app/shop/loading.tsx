import { ProductGridSkeleton } from "@/components/ProductCard"
import { Skeleton } from "@/components/ui"
export default function Loading() {
  return (
    <div>
      <Skeleton className="h-10 w-48" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <Skeleton className="hidden h-96 lg:block" />
        <ProductGridSkeleton />
      </div>
    </div>
  )
}
