import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  customer_id: model.text(),
  author_name: model.text(),
  rating: model.number(),
  comment: model.text().nullable(),
  status: model.enum(["pending", "approved"]).default("pending"),
})

export default Review
