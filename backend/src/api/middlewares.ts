import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { z } from "zod"

export const PostReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  author_name: z.string().trim().min(1).max(80),
  comment: z.string().trim().max(1000).optional(),
})

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/products/:id/reviews",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostReviewSchema),
      ],
    },
  ],
})
