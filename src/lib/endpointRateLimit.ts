import type { PayloadRequest } from "payload";

import { enforceRateLimit, getRateLimitConfig } from "@/lib/rateLimit";
import { getRequestIP } from "@/lib/requestSecurity";

type RateLimitScope =
  | "ai-submit"
  | "ai-sync"
  | "order-create"
  | "order-sync"
  | "subscription-checkout"
  | "subscription-portal"
  | "subscription-sync";

type ScopeConfig = {
  fallbackLimit: number;
  fallbackWindowMs: number;
  limitEnv: string;
  windowEnv: string;
};

const scopeConfigs: Record<RateLimitScope, ScopeConfig> = {
  "ai-submit": {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "AI_SUBMIT_RATE_LIMIT_MAX",
    windowEnv: "AI_SUBMIT_RATE_LIMIT_WINDOW_MS",
  },
  "ai-sync": {
    fallbackLimit: 60,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "AI_SYNC_RATE_LIMIT_MAX",
    windowEnv: "AI_SYNC_RATE_LIMIT_WINDOW_MS",
  },
  "order-create": {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "ORDER_CREATE_RATE_LIMIT_MAX",
    windowEnv: "ORDER_CREATE_RATE_LIMIT_WINDOW_MS",
  },
  "order-sync": {
    fallbackLimit: 60,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "ORDER_SYNC_RATE_LIMIT_MAX",
    windowEnv: "ORDER_SYNC_RATE_LIMIT_WINDOW_MS",
  },
  "subscription-checkout": {
    fallbackLimit: 10,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "SUBSCRIPTION_CHECKOUT_RATE_LIMIT_MAX",
    windowEnv: "SUBSCRIPTION_CHECKOUT_RATE_LIMIT_WINDOW_MS",
  },
  "subscription-portal": {
    fallbackLimit: 20,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "SUBSCRIPTION_PORTAL_RATE_LIMIT_MAX",
    windowEnv: "SUBSCRIPTION_PORTAL_RATE_LIMIT_WINDOW_MS",
  },
  "subscription-sync": {
    fallbackLimit: 30,
    fallbackWindowMs: 10 * 60 * 1000,
    limitEnv: "SUBSCRIPTION_SYNC_RATE_LIMIT_MAX",
    windowEnv: "SUBSCRIPTION_SYNC_RATE_LIMIT_WINDOW_MS",
  },
};

const scopeMessages: Record<RateLimitScope, string> = {
  "ai-submit": "Too many AI task submissions. Please try again later.",
  "ai-sync": "Too many AI task sync requests. Please wait a moment and retry.",
  "order-create":
    "Too many print order creation attempts. Please try again later.",
  "order-sync":
    "Too many print order sync requests. Please wait a moment and retry.",
  "subscription-checkout":
    "Too many subscription checkout attempts. Please try again later.",
  "subscription-portal":
    "Too many subscription portal requests. Please try again later.",
  "subscription-sync":
    "Too many subscription sync requests. Please wait a moment and retry.",
};

function getActorKey(req: PayloadRequest) {
  if (req.user?.id !== undefined && req.user?.id !== null) {
    return `user:${String(req.user.id)}`;
  }

  return `ip:${getRequestIP(req.headers)}`;
}

export async function rejectRateLimitedEndpoint(args: {
  req: PayloadRequest;
  scope: RateLimitScope;
}) {
  const { req, scope } = args;
  const config = getRateLimitConfig(scopeConfigs[scope]);
  const result = await enforceRateLimit({
    key: `endpoint:${scope}:${getActorKey(req)}`,
    limit: config.limit,
    windowMs: config.windowMs,
  });

  if (result.allowed) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );

  return Response.json(
    {
      message: scopeMessages[scope],
    },
    {
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
      status: 429,
    },
  );
}
