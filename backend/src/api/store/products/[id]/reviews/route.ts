import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../../modules/review"
import type ReviewModuleService from "../../../../../modules/review/service"
import type { z } from "zod"
import type { PostReviewSchema } from "../../../../middlewares"

// Public: list approved reviews for a product
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const reviews = await service.listReviews(
    { product_id: req.params.id, status: "approved" },
    { order: { created_at: "DESC" }, take: 50 }
  )
  const count = reviews.length
  const average = count
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
    : 0
  res.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      author_name: r.author_name,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    })),
    count,
    average,
  })
}

// Logged-in customers: submit a review (held as "pending" until approved)
export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof PostReviewSchema>>,
  res: MedusaResponse
) {
  const service: ReviewModuleService = req.scope.resolve(REVIEW_MODULE)
  const body = req.validatedBody
  const review = await service.createReviews({
    product_id: req.params.id,
    customer_id: req.auth_context.actor_id,
    author_name: body.author_name,
    rating: body.rating,
    comment: body.comment ?? null,
    status: "pending",
  })
  res.status(201).json({ review: { id: review.id, status: review.status } })
}
