import type { PayloadRequest } from 'payload'

import { enforceRateLimit, getRateLimitConfig } from '@/lib/rateLimit'
import { getRequestRateLimitKey } from '@/lib/requestSecurity'

type RateLimitScope =
  | 'auth-email'
  | 'auth-login'
  | 'auth-register'
  | 'auth-reset-password'
  | "ai-image-submit"
  | 'credit-checkout'
  | 'credit-sync'
  | 'engagement-view-write'
  | 'social-comment-write'
  | 'social-follow-write'
  | 'social-reaction-write'
  | 'model-preview'
  | "ai-submit"
  | "ai-sync"
  | "order-create"
  | "order-sync"
  | "subscription-checkout"
  | "subscription-portal"
  | 'subscription-sync'

type ScopeConfig = {
  fallbackLimit: number;
  fallbackWindowMs: number;
  limitEnv: string;
  windowEnv: string;
};

const scopeConfigs: Record<RateLimitScope, ScopeConfig> = {
  'auth-email': {
    fallbackLimit: 5,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AUTH_EMAIL_RATE_LIMIT_MAX',
    windowEnv: 'AUTH_EMAIL_RATE_LIMIT_WINDOW_MS',
  },
  'auth-login': {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AUTH_LOGIN_RATE_LIMIT_MAX',
    windowEnv: 'AUTH_LOGIN_RATE_LIMIT_WINDOW_MS',
  },
  'auth-register': {
    fallbackLimit: 5,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AUTH_REGISTER_RATE_LIMIT_MAX',
    windowEnv: 'AUTH_REGISTER_RATE_LIMIT_WINDOW_MS',
  },
  'auth-reset-password': {
    fallbackLimit: 5,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AUTH_RESET_PASSWORD_RATE_LIMIT_MAX',
    windowEnv: 'AUTH_RESET_PASSWORD_RATE_LIMIT_WINDOW_MS',
  },
  "ai-image-submit": {
    fallbackLimit: 6,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AI_IMAGE_SUBMIT_RATE_LIMIT_MAX',
    windowEnv: 'AI_IMAGE_SUBMIT_RATE_LIMIT_WINDOW_MS',
  },
  'credit-checkout': {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'CREDIT_CHECKOUT_RATE_LIMIT_MAX',
    windowEnv: 'CREDIT_CHECKOUT_RATE_LIMIT_WINDOW_MS',
  },
  'credit-sync': {
    fallbackLimit: 30,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'CREDIT_SYNC_RATE_LIMIT_MAX',
    windowEnv: 'CREDIT_SYNC_RATE_LIMIT_WINDOW_MS',
  },
  'engagement-view-write': {
    fallbackLimit: 120,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'ENGAGEMENT_VIEW_WRITE_RATE_LIMIT_MAX',
    windowEnv: 'ENGAGEMENT_VIEW_WRITE_RATE_LIMIT_WINDOW_MS',
  },
  'social-comment-write': {
    fallbackLimit: 12,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'SOCIAL_COMMENT_WRITE_RATE_LIMIT_MAX',
    windowEnv: 'SOCIAL_COMMENT_WRITE_RATE_LIMIT_WINDOW_MS',
  },
  'social-follow-write': {
    fallbackLimit: 30,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'SOCIAL_FOLLOW_WRITE_RATE_LIMIT_MAX',
    windowEnv: 'SOCIAL_FOLLOW_WRITE_RATE_LIMIT_WINDOW_MS',
  },
  'social-reaction-write': {
    fallbackLimit: 60,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'SOCIAL_REACTION_WRITE_RATE_LIMIT_MAX',
    windowEnv: 'SOCIAL_REACTION_WRITE_RATE_LIMIT_WINDOW_MS',
  },
  'model-preview': {
    fallbackLimit: 300,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'MODEL_PREVIEW_RATE_LIMIT_MAX',
    windowEnv: 'MODEL_PREVIEW_RATE_LIMIT_WINDOW_MS',
  },
  "ai-submit": {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AI_SUBMIT_RATE_LIMIT_MAX',
    windowEnv: 'AI_SUBMIT_RATE_LIMIT_WINDOW_MS',
  },
  "ai-sync": {
    fallbackLimit: 240,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'AI_SYNC_RATE_LIMIT_MAX',
    windowEnv: 'AI_SYNC_RATE_LIMIT_WINDOW_MS',
  },
  "order-create": {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'ORDER_CREATE_RATE_LIMIT_MAX',
    windowEnv: 'ORDER_CREATE_RATE_LIMIT_WINDOW_MS',
  },
  "order-sync": {
    fallbackLimit: 60,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'ORDER_SYNC_RATE_LIMIT_MAX',
    windowEnv: 'ORDER_SYNC_RATE_LIMIT_WINDOW_MS',
  },
  "subscription-checkout": {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'SUBSCRIPTION_CHECKOUT_RATE_LIMIT_MAX',
    windowEnv: 'SUBSCRIPTION_CHECKOUT_RATE_LIMIT_WINDOW_MS',
  },
  "subscription-portal": {
    fallbackLimit: 20,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'SUBSCRIPTION_PORTAL_RATE_LIMIT_MAX',
    windowEnv: 'SUBSCRIPTION_PORTAL_RATE_LIMIT_WINDOW_MS',
  },
  "subscription-sync": {
    fallbackLimit: 30,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: 'SUBSCRIPTION_SYNC_RATE_LIMIT_MAX',
    windowEnv: 'SUBSCRIPTION_SYNC_RATE_LIMIT_WINDOW_MS',
  },
};

const scopeMessages: Record<RateLimitScope, string> = {
  'auth-email': 'Too many email verification requests. Please try again later.',
  'auth-login': 'Too many login attempts. Please try again later.',
  'auth-register': 'Too many registration attempts. Please try again later.',
  'auth-reset-password': 'Too many password reset attempts. Please try again later.',
  'ai-image-submit': 'Too many image generation requests. Please try again later.',
  'credit-checkout': 'Too many credit checkout attempts. Please try again later.',
  'credit-sync': 'Too many credit purchase sync requests. Please wait a moment and retry.',
  'engagement-view-write': 'Too many view events. Please try again later.',
  'social-comment-write': 'Too many comment actions. Please try again later.',
  'social-follow-write': 'Too many follow actions. Please try again later.',
  'social-reaction-write': 'Too many reaction actions. Please try again later.',
  'model-preview': 'Too many public model preview requests. Please try again later.',
  'ai-submit': 'Too many AI task submissions. Please try again later.',
  'ai-sync': 'Too many AI task sync requests. Please wait a moment and retry.',
  'order-create': 'Too many print order creation attempts. Please try again later.',
  'order-sync': 'Too many print order sync requests. Please wait a moment and retry.',
  'subscription-checkout': 'Too many subscription checkout attempts. Please try again later.',
  'subscription-portal': 'Too many subscription portal requests. Please try again later.',
  'subscription-sync': 'Too many subscription sync requests. Please wait a moment and retry.',
}

function getActorKey(req: PayloadRequest) {
  if (req.user?.id !== undefined && req.user?.id !== null) {
    return `user:${String(req.user.id)}`
  }

  return getRequestRateLimitKey(req.headers)
}

export async function rejectRateLimitedEndpoint(args: {
  req: PayloadRequest;
  scope: RateLimitScope;
}) {
  const { req, scope } = args
  const config = getRateLimitConfig(scopeConfigs[scope])
  const result = await enforceRateLimit({
    key: `endpoint:${scope}:${getActorKey(req)}`,
    limit: config.limit,
    windowMs: config.windowMs,
  })

  if (result.allowed) {
    return null
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  )

  return Response.json(
    {
      message: scopeMessages[scope],
    },
    {
      headers: {
        'Retry-After': String(retryAfterSeconds),
      },
      status: 429,
    },
  )
}
