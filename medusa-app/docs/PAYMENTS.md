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
We use our own provider in `src/modules/razorpay` (the community plugin `medusa-plugin-razorpay-v2` does not load on Medusa 2.21.2:
it tries to resolve a `payment` dependency that newer Medusa versions don't give to providers).

```powershell
npm install razorpay --legacy-peer-deps
npm uninstall medusa-plugin-razorpay-v2 --legacy-peer-deps
```
`.env` (never commit): `RAZORPAY_ID`, `RAZORPAY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (`RAZORPAY_ACCOUNT` is no longer used).

`medusa-config.ts`: see `backend/medusa-config.example.ts`. Remove the old `plugins: [...]` line. Then restart the backend.

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
