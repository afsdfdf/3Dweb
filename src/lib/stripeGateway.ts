import Stripe from 'stripe'

export type StripeCreateCheckoutInput = {
  amount: number
  cancelUrl: string
  currency: string
  customerEmail?: string
  modelTitle?: string
  orderId: number | string
  orderNumber: string
  successUrl: string
}

export type StripeCheckoutResult = {
  checkoutReference: string
  checkoutUrl: string
  mode: 'stripe'
  sessionId: string
}

const createReference = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

const toMinorUnits = (amount: number) => {
  return Math.round(Number(amount || 0) * 100)
}

let stripeClient: Stripe | null = null

function getStripeClient() {
  if (stripeClient) {
    return stripeClient
  }

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('?? STRIPE_SECRET_KEY????? Stripe ?????')
  }

  stripeClient = new Stripe(secretKey)
  return stripeClient
}

export class StripeGateway {
  async createCheckout(input: StripeCreateCheckoutInput): Promise<StripeCheckoutResult> {
    const stripe = getStripeClient()
    const checkoutReference = createReference('STRIPE')
    const currency = String(input.currency || 'USD').toLowerCase()

    const session = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      cancel_url: input.cancelUrl,
      client_reference_id: String(input.orderId),
      customer_email: input.customerEmail,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              description: input.modelTitle ? `???${input.modelTitle}` : '?? Studio ? 3D ??????',
              name: `3D ???? ${input.orderNumber}`,
            },
            unit_amount: toMinorUnits(input.amount),
          },
          quantity: 1,
        },
      ],
      metadata: {
        checkoutReference,
        orderId: String(input.orderId),
        orderNumber: input.orderNumber,
        paymentType: 'print-order',
      },
      mode: 'payment',
      success_url: input.successUrl,
    })

    if (!session.url) {
      throw new Error('Stripe ???????????')
    }

    return {
      checkoutReference,
      checkoutUrl: session.url,
      mode: 'stripe',
      sessionId: session.id,
    }
  }

  async retrieveCheckout(sessionId: string) {
    const stripe = getStripeClient()

    return stripe.checkout.sessions.retrieve(sessionId)
  }
}

let stripeGateway: StripeGateway | null = null

export function getStripeGateway() {
  if (!stripeGateway) {
    stripeGateway = new StripeGateway()
  }

  return stripeGateway
}
