# Payments

Two methods are supported at checkout:

| Method | Medusa provider id | How it works |
|---|---|---|
| Pay online (UPI, cards, netbanking, wallets) | `pp_razorpay_razorpay` | Razorpay popup; the order is created only after Razorpay confirms payment |
| Cash on delivery | `pp_system_default` | Order is created immediately; mark the payment as collected in Admin when cash is received |

## 1. Razorpay account
1. Sign up at razorpay.com and stay in **Test mode** while building.
2. Account & Settings > API Keys: generate a **Key ID** (`rzp_test_...`) and **Key Secret**. Save the secret; it is shown once.
3. Note your Account / Merchant ID from the dashboard.
4. Live payments need Razorpay's KYC/activation and separate live keys. Do that before launch.

## 2. Backend (`medusa-app/apps/backend`)
```bash
npm install medusa-plugin-razorpay-v2
```
Check compatibility first: `npm ls @medusajs/medusa` and the plugin's page on npm. It is a community plugin tested against
specific Medusa versions. If it does not install or load on yours, tell the team; the fallback is a small custom provider.

Add to `.env` (never commit):
```
RAZORPAY_ID=rzp_test_xxx
RAZORPAY_SECRET=xxx
RAZORPAY_ACCOUNT=xxx
RAZORPAY_WEBHOOK_SECRET=choose-a-long-random-string
```
`medusa-config.ts`:
```ts
module.exports = defineConfig({
  plugins: ["medusa-plugin-razorpay-v2"],
  modules: [
    { resolve: "./src/modules/review" },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "medusa-plugin-razorpay-v2/providers/payment-razorpay/src",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_ID,
              key_secret: process.env.RAZORPAY_SECRET,
              razorpay_account: process.env.RAZORPAY_ACCOUNT,
              automatic_expiry_period: 30,
              manual_expiry_period: 20,
              refund_speed: "normal",
              webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
  ],
  projectConfig: { /* unchanged */ },
})
```
Then `npx medusa db:migrate` and restart the backend.

## 3. Enable in Admin
Settings > Regions > India > Edit > Payment providers: tick **Razorpay** (`pp_razorpay_razorpay`) and the **manual / system** provider (used for cash on delivery).

## 4. Storefront
`storefront/.env.local`: `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx` (Key ID only, never the secret). Restart `npm run dev`.

## 5. Webhook (needed for production reliability)
In Razorpay dashboard > Webhooks, add `https://YOUR-BACKEND-HOST/hooks/payment/razorpay_razorpay`, use the same secret as
`RAZORPAY_WEBHOOK_SECRET`, and enable payment events. Razorpay cannot reach `localhost`, so test this with a tunnel (e.g. ngrok) or after deploying.

## 6. Test (Test mode)
Use Razorpay's test card/UPI details from their docs. Check: (a) success creates an order in Admin, (b) failed or cancelled payment creates no order,
(c) the amount in the popup equals the cart total, (d) COD creates an order with the payment not yet captured.

## Notes
- Amounts in Medusa v2 are in rupees; Razorpay uses paise. The storefront uses the amount Razorpay recorded for the order.
- Refunds and manual capture in the plugin are marked untested by its author. Verify before relying on them.
- Never expose the Key Secret or webhook secret to the browser or commit them to Git.
