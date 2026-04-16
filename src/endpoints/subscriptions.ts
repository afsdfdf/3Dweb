import type { PayloadRequest } from "payload";

import { rejectRateLimitedEndpoint } from "@/lib/endpointRateLimit";
import {
  createSubscriptionCheckout,
  createSubscriptionPortal,
  syncSubscriptionCheckout,
} from "@/lib/subscriptionFlow";
import { rejectDisallowedMutationOrigin } from "@/lib/requestSecurity";

const unauthorized = () =>
  Response.json({ message: "请先登录" }, { status: 401 });

/** M-03: planKey 白名单，防止外部控制假设不可变参数 */
const VALID_PLAN_KEYS = ["starter", "pro", "studio"] as const;
type ValidPlanKey = (typeof VALID_PLAN_KEYS)[number];

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "订阅处理失败";
};

export const createSubscriptionCheckoutEndpoint = {
  path: "/billing/subscriptions/checkout",
  method: "post" as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req);
    if (blocked) return blocked;

    if (!req.user) return unauthorized();

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: "subscription-checkout",
    });
    if (rateLimited) return rateLimited;

    try {
      const body = req.json ? await req.json() : {};
      // M-03: 显式白名单验证，不依赖隐式 null fallback
      const planKey = VALID_PLAN_KEYS.find((k) => k === body.planKey);
      if (!planKey) {
        return Response.json({ message: "Invalid plan key." }, { status: 400 });
      }
      const checkout = await createSubscriptionCheckout({
        planKey,
        req,
      });

      return Response.json({
        checkoutUrl: checkout.url,
        message: "订阅结算会话已创建。",
      });
    } catch (error) {
      return Response.json(
        { message: getErrorMessage(error) },
        { status: 400 },
      );
    }
  },
};

export const syncSubscriptionCheckoutEndpoint = {
  path: "/billing/subscriptions/sync",
  method: "post" as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req);
    if (blocked) return blocked;

    if (!req.user) return unauthorized();

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: "subscription-sync",
    });
    if (rateLimited) return rateLimited;

    try {
      const body = req.json ? await req.json() : {};
      const result = await syncSubscriptionCheckout({
        req,
        sessionId: String(body.sessionId || ""),
      });

      return Response.json({
        message: "订阅状态已同步。",
        result,
      });
    } catch (error) {
      return Response.json(
        { message: getErrorMessage(error) },
        { status: 400 },
      );
    }
  },
};

export const createSubscriptionPortalEndpoint = {
  path: "/billing/subscriptions/portal",
  method: "post" as const,
  handler: async (req: PayloadRequest) => {
    const blocked = await rejectDisallowedMutationOrigin(req);
    if (blocked) return blocked;

    if (!req.user) return unauthorized();

    const rateLimited = await rejectRateLimitedEndpoint({
      req,
      scope: "subscription-portal",
    });
    if (rateLimited) return rateLimited;

    try {
      const portal = await createSubscriptionPortal({ req });

      return Response.json({
        message: "订阅管理入口已创建。",
        portalUrl: portal.url,
      });
    } catch (error) {
      return Response.json(
        { message: getErrorMessage(error) },
        { status: 400 },
      );
    }
  },
};
