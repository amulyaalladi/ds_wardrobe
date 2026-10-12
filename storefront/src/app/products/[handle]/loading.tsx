import { Skeleton } from "@/components/ui"
export default function Loading() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Skeleton className="aspect-[3/4]" />
      <div className="space-y-4"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-6 w-24" /><Skeleton className="h-40" /></div>
    </div>
  )
}
