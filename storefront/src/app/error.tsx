"use client"
import { ErrorState } from "@/components/ui"
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} />
}
