import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import Razorpay from "razorpay"
import crypto from "crypto"

type Options = {
  key_id: string
  key_secret: string
  webhook_secret?: string
}

/** Medusa v2 amounts are in rupees; Razorpay wants paise. */
const toPaise = (amount: unknown) =>
  Math.round(new BigNumber(amount as any).numeric * 100)

/** Turns Razorpay SDK errors into a Medusa error without ever echoing credentials. */
function fail(e: any, fallback: string): never {
  const msg = e?.error?.description || e?.message || fallback
  throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Razorpay: ${msg}`)
}

class RazorpayProviderService extends AbstractPaymentProvider<Options> {
  // Registered as pp_razorpay_<id>; with id "razorpay" that is pp_razorpay_razorpay
  static identifier = "razorpay"

  protected options_: Options
  protected client_: any

  static validateOptions(options: Record<any, any>) {
    if (!options.key_id || !options.key_secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Razorpay provider needs key_id and key_secret (set RAZORPAY_ID and RAZORPAY_SECRET)."
      )
    }
  }

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options)
    this.options_ = options
    this.client_ = new Razorpay({
      key_id: options.key_id,
      key_secret: options.key_secret,
    })
  }

  // ---------- helpers ----------
  private async createOrder(amount: unknown, currencyCode: string, sessionId?: string) {
    try {
      return await this.client_.orders.create({
        amount: toPaise(amount),
        currency: currencyCode.toUpperCase(),
        receipt: `dsw_${Date.now()}`.slice(0, 40),
        notes: sessionId ? { session_id: sessionId } : {},
      })
    } catch (e) {
      return fail(e, "couldn't create the payment order")
    }
  }

  private orderData(order: any, extra: Record<string, unknown> = {}) {
    return {
      ...extra,
      // Public to the storefront: only non-sensitive fields belong here.
      razorpayOrder: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      },
    }
  }

  private orderIdFrom(data?: Record<string, unknown>): string {
    const id = (data as any)?.razorpayOrder?.id
    if (!id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing Razorpay order id on the payment session.")
    }
    return id
  }

  /** Prefer a captured payment, then an authorized one, for this Razorpay order. */
  private async findPayment(orderId: string) {
    const res = await this.client_.orders.fetchPayments(orderId)
    const items: any[] = res?.items ?? []
    return (
      items.find((p) => p.status === "captured") ??
      items.find((p) => p.status === "authorized") ??
      null
    )
  }

  // ---------- Medusa payment provider interface ----------
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = (input.data as any)?.session_id as string | undefined
    const order = await this.createOrder(input.amount, input.currency_code, sessionId)
    return { id: order.id, data: this.orderData(order, { session_id: sessionId }) }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const orderId = this.orderIdFrom(input.data)
    try {
      // Checked server-side with our secret key: the browser's word is never trusted.
      const payment = await this.findPayment(orderId)
      if (!payment) return { status: "pending", data: input.data ?? {} }

      const order = await this.client_.orders.fetch(orderId)
      if (Number(payment.amount) !== Number(order.amount)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Paid amount does not match the order amount.")
      }
      return {
        status: payment.status === "captured" ? "captured" : "authorized",
        data: { ...input.data, razorpayPaymentId: payment.id, razorpayPaymentStatus: payment.status },
      }
    } catch (e) {
      if (e instanceof MedusaError) throw e
      return fail(e, "couldn't verify the payment")
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const paymentId = (input.data as any)?.razorpayPaymentId as string | undefined
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No Razorpay payment id to capture.")
    }
    try {
      const p = await this.client_.payments.fetch(paymentId)
      if (p.status === "captured") {
        return { data: { ...input.data, razorpayPaymentStatus: "captured" } }
      }
      const captured = await this.client_.payments.capture(paymentId, p.amount, p.currency)
      return { data: { ...input.data, razorpayPaymentStatus: captured.status } }
    } catch (e) {
      return fail(e, "couldn't capture the payment")
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const paymentId = (input.data as any)?.razorpayPaymentId as string | undefined
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No Razorpay payment id to refund.")
    }
    try {
      const refund = await this.client_.payments.refund(paymentId, {
        amount: toPaise(input.amount),
        speed: "normal",
      })
      return { data: { ...input.data, razorpayLastRefundId: refund.id } }
    } catch (e) {
      return fail(e, "couldn't refund the payment")
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Razorpay has no cancel call; uncaptured authorized payments are auto-refunded by Razorpay.
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // Razorpay orders can't be deleted; an unused order simply expires.
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    try {
      const payment = await this.findPayment(this.orderIdFrom(input.data))
      if (payment?.status === "captured") return { status: "captured" }
      if (payment?.status === "authorized") return { status: "authorized" }
      return { status: "pending" }
    } catch (e) {
      if (e instanceof MedusaError) throw e
      return fail(e, "couldn't read the payment status")
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    try {
      const order = await this.client_.orders.fetch(this.orderIdFrom(input.data))
      return { data: order as unknown as Record<string, unknown> }
    } catch (e) {
      if (e instanceof MedusaError) throw e
      return fail(e, "couldn't retrieve the payment")
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // A Razorpay order's amount can't be edited, so create a new order if the cart total changed.
    const current = (input.data as any)?.razorpayOrder
    const paise = toPaise(input.amount)
    if (current && Number(current.amount) === paise && current.currency === input.currency_code.toUpperCase()) {
      return { data: input.data }
    }
    const sessionId = (input.data as any)?.session_id as string | undefined
    const order = await this.createOrder(input.amount, input.currency_code, sessionId)
    return { data: this.orderData(order, { ...input.data }) }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const ignore: WebhookActionResult = {
      action: "not_supported",
      data: { session_id: "", amount: new BigNumber(0) },
    }
    try {
      const secret = this.options_.webhook_secret
      if (!secret) return ignore

      // Verify Razorpay's signature over the raw body before trusting anything in it.
      const headers = (payload.headers ?? {}) as Record<string, unknown>
      const signature = String(headers["x-razorpay-signature"] ?? headers["X-Razorpay-Signature"] ?? "")
      const raw = typeof payload.rawData === "string"
        ? payload.rawData
        : Buffer.from(payload.rawData as any).toString("utf8")
      const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
      const a = Buffer.from(signature)
      const b = Buffer.from(expected)
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return ignore

      const body = payload.data as any
      const entity = body?.payload?.payment?.entity
      if (!entity?.order_id) return ignore

      const order = await this.client_.orders.fetch(entity.order_id)
      const sessionId = order?.notes?.session_id
      if (!sessionId) return ignore

      const data = { session_id: String(sessionId), amount: new BigNumber(Number(entity.amount) / 100) }
      switch (body.event) {
        case "payment.authorized":
          return { action: "authorized", data }
        case "payment.captured":
          return { action: "captured", data }
        case "payment.failed":
          return { action: "failed", data }
        default:
          return ignore
      }
    } catch {
      return ignore
    }
  }
}

export default RazorpayProviderService
