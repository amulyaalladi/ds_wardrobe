import { EmptyState } from "@/components/ui"
export default function NotFound() {
  return <EmptyState title="Page not found" text="The page you're looking for has moved or doesn't exist." actionHref="/shop" actionLabel="Shop now" />
}
