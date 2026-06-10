import type { BasePayload } from "payload";

import {
  normalizeCreditTopupProducts,
  type CreditTopupProduct,
} from "@/lib/creditTopupProducts";
import { getCachedPayload } from "@/lib/getCachedPayload";

export async function getCreditTopupProducts(
  payloadInput?: BasePayload,
): Promise<CreditTopupProduct[]> {
  const payload = payloadInput ?? (await getCachedPayload());
  const result = await payload
    .find({
      collection: "credit-products",
      depth: 0,
      limit: 12,
      overrideAccess: true,
      pagination: false,
      sort: "sortOrder",
      where: {
        and: [
          {
            productType: {
              equals: "credit-topup",
            },
          },
          {
            isActive: {
              equals: true,
            },
          },
        ],
      },
    })
    .catch(() => ({
      docs: [],
    }));

  return normalizeCreditTopupProducts(result.docs);
}
