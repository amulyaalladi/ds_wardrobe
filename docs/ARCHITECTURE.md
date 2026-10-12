# Architecture decisions

1. **Medusa v2 headless backend.** Cart, orders, inventory, promotions, payments and admin are Medusa's; the storefront has no commerce logic.
2. **Next.js App Router.** Catalogue pages are server components (fast, SEO); cart, checkout, auth and account are client components using the Medusa JS SDK.
3. **Cart.** Cart id in `localStorage`; guest carts persist per browser; on login the cart is transferred to the customer (`transferCart`).
4. **Orders only after payment.** Checkout creates a payment session, then `cart.complete()`; Medusa creates the order. For Razorpay,
   open the Razorpay modal after `initiatePaymentSession` and call `complete()` only after the provider confirms.
5. **Filters.** Category/collection/search run server-side in Medusa. Size/colour/price/availability run in `lib/data.ts` over up to 100 products,
   because the Store API can't filter on variant options. Replace with Meilisearch/Algolia past a few hundred products.
6. **Custom backend pieces.** `review` module (+ moderated POST/GET routes) and `/store/order-track` (order number + email lookup for guests).
7. **Wishlist** is stored in `customer.metadata.wishlist` to avoid a module for a list of ids.
8. **Sale prices.** Use Medusa price lists/promotions; seed also stores `metadata.compare_at_price` for the strike-through.

## Known gaps
- Razorpay provider not wired (needs a community/custom payment module; verify current options).
- Banners/content: home copy is in code; add a CMS or custom module.
- Reviews approval UI, analytics (Medusa Admin has basics), image upload config (configure S3/Cloudinary file module).
- Variant-specific images are not wired; add `variants.images` fields if you use them.
- Untested against a live Medusa instance (see README).
