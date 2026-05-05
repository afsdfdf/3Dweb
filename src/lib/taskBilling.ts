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

export type MeshyGenerationPricing = {
  imageTo3DCredits: number
  multiImageTo3DCredits: number
  textTo3DCredits: number
}

export type TaskBillingSnapshot = {
  configuredCredits: number
  refundOnFailure: boolean
  reserveOnSubmit: boolean
}

export const defaultGenerationPricing: GenerationPricing = {
  downloadCredits: 5,
  hybridCredits: 20,
  imageCredits: 20,
  textCredits: 20,
}

export const defaultMeshyGenerationPricing: MeshyGenerationPricing = {
  imageTo3DCredits: 20,
  multiImageTo3DCredits: 20,
  textTo3DCredits: 20,
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

const toGenerationCredits = (value: unknown, fallback: number) => {
  const numberValue = toNumber(value, fallback)
  return numberValue > 0 ? numberValue : fallback
}

type BillingSettingsPayload = Pick<PayloadRequest['payload'], 'findGlobal'>

async function resolveTaskBillingSettings(payload: BillingSettingsPayload) {
  const [siteSettings, aiProviderSettings] = await Promise.all([
    payload
      .findGlobal({
        slug: 'site-settings',
        overrideAccess: true,
      })
      .catch(() => null),
    payload
      .findGlobal({
        slug: 'ai-provider-settings',
        overrideAccess: true,
      })
      .catch(() => null),
  ])

  return {
    creditRules: {
      refundOnFailure:
        aiProviderSettings?.creditRules?.refundOnFailure === undefined
          ? defaultTaskCreditRules.refundOnFailure
          : Boolean(aiProviderSettings.creditRules.refundOnFailure),
      reserveOnSubmit: true,
    },
    generationPricing: {
      downloadCredits: toNumber(siteSettings?.generationPricing?.downloadCredits, defaultGenerationPricing.downloadCredits),
      hybridCredits: toGenerationCredits(siteSettings?.generationPricing?.hybridCredits, defaultGenerationPricing.hybridCredits),
      imageCredits: toGenerationCredits(siteSettings?.generationPricing?.imageCredits, defaultGenerationPricing.imageCredits),
      textCredits: toGenerationCredits(siteSettings?.generationPricing?.textCredits, defaultGenerationPricing.textCredits),
    } satisfies GenerationPricing,
    meshyPricing: {
      imageTo3DCredits: toGenerationCredits(
        aiProviderSettings?.meshy?.pricing?.imageTo3DCredits,
        defaultMeshyGenerationPricing.imageTo3DCredits,
      ),
      multiImageTo3DCredits: toGenerationCredits(
        aiProviderSettings?.meshy?.pricing?.multiImageTo3DCredits,
        defaultMeshyGenerationPricing.multiImageTo3DCredits,
      ),
      textTo3DCredits: toGenerationCredits(
        aiProviderSettings?.meshy?.pricing?.textTo3DCredits,
        defaultMeshyGenerationPricing.textTo3DCredits,
      ),
    } satisfies MeshyGenerationPricing,
  }
}

export async function getTaskBillingSettings(req: PayloadRequest) {
  return resolveTaskBillingSettings(req.payload)
}

export async function getTaskBillingSettingsForPayload(payload: BillingSettingsPayload) {
  return resolveTaskBillingSettings(payload)
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

export function resolveMeshyGenerationCredits(args: {
  inputMode: 'hybrid' | 'image' | 'text'
  pricing: MeshyGenerationPricing
  sourceImage?: number | null
  sourceImageAsset?: unknown
  sourceImageAssets?: unknown
}) {
  const sourceImageAssetCount = Array.isArray(args.sourceImageAssets)
    ? args.sourceImageAssets.filter((item) => item && typeof item === 'object').length
    : args.sourceImageAsset && typeof args.sourceImageAsset === 'object'
      ? 1
      : 0
  const imageCount = Math.max(sourceImageAssetCount, args.sourceImage ? 1 : 0)

  if (imageCount > 1) {
    return args.pricing.multiImageTo3DCredits
  }

  if (imageCount === 1 || args.inputMode === 'image' || args.inputMode === 'hybrid') {
    return args.pricing.imageTo3DCredits
  }

  return args.pricing.textTo3DCredits
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
