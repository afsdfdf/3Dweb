import type { PayloadRequest } from 'payload'

export type GenerationPricing = {
  downloadCredits: number
  hybridCredits: number
  imageCredits: number
  textCredits: number
}

export type TaskCreditRules = {
  refundOnFailure: boolean
  reserveOnSubmit: boolean
}

export type TaskBillingSnapshot = {
  configuredCredits: number
  refundOnFailure: boolean
  reserveOnSubmit: boolean
}

export const defaultGenerationPricing: GenerationPricing = {
  downloadCredits: 5,
  hybridCredits: 25,
  imageCredits: 20,
  textCredits: 15,
}

export const defaultTaskCreditRules: TaskCreditRules = {
  refundOnFailure: true,
  reserveOnSubmit: true,
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const toNumber = (value: unknown, fallback: number) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export async function getTaskBillingSettings(req: PayloadRequest) {
  const [siteSettings, aiProviderSettings] = await Promise.all([
    req.payload
      .findGlobal({
        slug: 'site-settings',
      })
      .catch(() => null),
    req.payload
      .findGlobal({
        slug: 'ai-provider-settings',
      })
      .catch(() => null),
  ])

  return {
    creditRules: {
      refundOnFailure:
        aiProviderSettings?.creditRules?.refundOnFailure === undefined
          ? defaultTaskCreditRules.refundOnFailure
          : Boolean(aiProviderSettings.creditRules.refundOnFailure),
      reserveOnSubmit:
        aiProviderSettings?.creditRules?.reserveOnSubmit === undefined
          ? defaultTaskCreditRules.reserveOnSubmit
          : Boolean(aiProviderSettings.creditRules.reserveOnSubmit),
    },
    generationPricing: {
      downloadCredits: toNumber(siteSettings?.generationPricing?.downloadCredits, defaultGenerationPricing.downloadCredits),
      hybridCredits: toNumber(siteSettings?.generationPricing?.hybridCredits, defaultGenerationPricing.hybridCredits),
      imageCredits: toNumber(siteSettings?.generationPricing?.imageCredits, defaultGenerationPricing.imageCredits),
      textCredits: toNumber(siteSettings?.generationPricing?.textCredits, defaultGenerationPricing.textCredits),
    } satisfies GenerationPricing,
  }
}

export function resolveGenerationCredits(args: {
  inputMode: 'hybrid' | 'image' | 'text'
  pricing: GenerationPricing
}) {
  const { inputMode, pricing } = args

  switch (inputMode) {
    case 'image':
      return pricing.imageCredits
    case 'hybrid':
      return pricing.hybridCredits
    case 'text':
    default:
      return pricing.textCredits
  }
}

export function readTaskBillingSnapshot(parameterSnapshot: unknown): TaskBillingSnapshot | null {
  if (!isRecord(parameterSnapshot)) return null

  const billing = parameterSnapshot.billing
  if (!isRecord(billing)) return null

  return {
    configuredCredits: toNumber(billing.configuredCredits, 0),
    refundOnFailure:
      typeof billing.refundOnFailure === 'boolean' ? billing.refundOnFailure : defaultTaskCreditRules.refundOnFailure,
    reserveOnSubmit:
      typeof billing.reserveOnSubmit === 'boolean' ? billing.reserveOnSubmit : defaultTaskCreditRules.reserveOnSubmit,
  }
}
