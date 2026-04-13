export type ShopifyCreateCheckoutInput = {
  amount: number
  currency: string
  orderId: number | string
  orderNumber: string
  returnUrl: string
}

export type ShopifyCheckoutResult = {
  checkoutReference: string
  checkoutUrl: string
  mode: 'mock' | 'shopify'
  shopifyCheckoutId?: string
}

export interface ShopifyGateway {
  createCheckout(input: ShopifyCreateCheckoutInput): Promise<ShopifyCheckoutResult>
}

const createCode = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

class MockShopifyGateway implements ShopifyGateway {
  async createCheckout(input: ShopifyCreateCheckoutInput): Promise<ShopifyCheckoutResult> {
    const checkoutReference = createCode('PAY')

    return {
      checkoutReference,
      checkoutUrl: `${input.returnUrl}?mockCheckout=${checkoutReference}&order=${input.orderId}`,
      mode: 'mock',
      shopifyCheckoutId: createCode('CHECKOUT'),
    }
  }
}

class RealShopifyGateway implements ShopifyGateway {
  async createCheckout(input: ShopifyCreateCheckoutInput): Promise<ShopifyCheckoutResult> {
    const storefrontDomain = process.env.SHOPIFY_STORE_DOMAIN

    if (!storefrontDomain) {
      throw new Error('缺少 SHOPIFY_STORE_DOMAIN，无法创建真实 Shopify 结算会话')
    }

    const checkoutReference = createCode('SHOPIFY')

    return {
      checkoutReference,
      checkoutUrl: `https://${storefrontDomain}/cart`,
      mode: 'shopify',
      shopifyCheckoutId: createCode('SHOPIFY-CHECKOUT'),
    }
  }
}

export function getShopifyGateway(): ShopifyGateway {
  const mode = process.env.SHOPIFY_MODE || 'mock'

  if (mode === 'real') {
    return new RealShopifyGateway()
  }

  return new MockShopifyGateway()
}
