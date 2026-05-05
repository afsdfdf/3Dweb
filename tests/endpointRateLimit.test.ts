import assert from "node:assert/strict";
import test from "node:test";

import { rejectRateLimitedEndpoint } from "../src/lib/endpointRateLimit.ts";
import { _resetKVStore } from "../src/lib/kvStore.ts";

test.beforeEach(() => {
  _resetKVStore();
});

function createRequest(overrides?: {
  headers?: Headers;
  user?: { id?: number | string | null } | null;
}) {
  return {
    headers: overrides?.headers ?? new Headers(),
    user: overrides?.user ?? { id: 7 },
  } as never;
}

test("rejectRateLimitedEndpoint blocks repeated requests for the same user and scope", async () => {
  const previousLimit = process.env.AI_SUBMIT_RATE_LIMIT_MAX;
  const previousWindow = process.env.AI_SUBMIT_RATE_LIMIT_WINDOW_MS;

  process.env.AI_SUBMIT_RATE_LIMIT_MAX = "2";
  process.env.AI_SUBMIT_RATE_LIMIT_WINDOW_MS = "60000";

  try {
    const req = createRequest();

    const first = await rejectRateLimitedEndpoint({ req, scope: "ai-submit" });
    const second = await rejectRateLimitedEndpoint({ req, scope: "ai-submit" });
    const third = await rejectRateLimitedEndpoint({ req, scope: "ai-submit" });

    assert.equal(first, null);
    assert.equal(second, null);
    assert.ok(third instanceof Response);
    assert.equal(third?.status, 429);
    assert.equal(third?.headers.get("Retry-After") !== null, true);
  } finally {
    process.env.AI_SUBMIT_RATE_LIMIT_MAX = previousLimit;
    process.env.AI_SUBMIT_RATE_LIMIT_WINDOW_MS = previousWindow;
  }
});

test("rejectRateLimitedEndpoint isolates counters between scopes", async () => {
  const previousSubmitLimit = process.env.AI_SUBMIT_RATE_LIMIT_MAX;
  const previousSubmitWindow = process.env.AI_SUBMIT_RATE_LIMIT_WINDOW_MS;
  const previousSyncLimit = process.env.AI_SYNC_RATE_LIMIT_MAX;
  const previousSyncWindow = process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS;

  process.env.AI_SUBMIT_RATE_LIMIT_MAX = "1";
  process.env.AI_SUBMIT_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.AI_SYNC_RATE_LIMIT_MAX = "1";
  process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS = "60000";

  try {
    const req = createRequest();

    const submitFirst = await rejectRateLimitedEndpoint({
      req,
      scope: "ai-submit",
    });
    const submitSecond = await rejectRateLimitedEndpoint({
      req,
      scope: "ai-submit",
    });
    const syncFirst = await rejectRateLimitedEndpoint({
      req,
      scope: "ai-sync",
    });

    assert.equal(submitFirst, null);
    assert.equal(submitSecond?.status, 429);
    assert.equal(syncFirst, null);
  } finally {
    process.env.AI_SUBMIT_RATE_LIMIT_MAX = previousSubmitLimit;
    process.env.AI_SUBMIT_RATE_LIMIT_WINDOW_MS = previousSubmitWindow;
    process.env.AI_SYNC_RATE_LIMIT_MAX = previousSyncLimit;
    process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS = previousSyncWindow;
  }
});

test("AI sync default limit supports multi-minute Workbench polling", async () => {
  const previousLimit = process.env.AI_SYNC_RATE_LIMIT_MAX;
  const previousWindow = process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS;

  delete process.env.AI_SYNC_RATE_LIMIT_MAX;
  delete process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS;

  try {
    const req = createRequest({ user: { id: 77 } });

    for (let index = 0; index < 120; index += 1) {
      const result = await rejectRateLimitedEndpoint({
        req,
        scope: "ai-sync",
      });

      assert.equal(result, null);
    }
  } finally {
    if (previousLimit === undefined) {
      delete process.env.AI_SYNC_RATE_LIMIT_MAX;
    } else {
      process.env.AI_SYNC_RATE_LIMIT_MAX = previousLimit;
    }

    if (previousWindow === undefined) {
      delete process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS;
    } else {
      process.env.AI_SYNC_RATE_LIMIT_WINDOW_MS = previousWindow;
    }
  }
});

test("rejectRateLimitedEndpoint isolates credit checkout from subscription checkout", async () => {
  const previousCreditLimit = process.env.CREDIT_CHECKOUT_RATE_LIMIT_MAX;
  const previousCreditWindow = process.env.CREDIT_CHECKOUT_RATE_LIMIT_WINDOW_MS;
  const previousSubscriptionLimit = process.env.SUBSCRIPTION_CHECKOUT_RATE_LIMIT_MAX;
  const previousSubscriptionWindow = process.env.SUBSCRIPTION_CHECKOUT_RATE_LIMIT_WINDOW_MS;

  process.env.CREDIT_CHECKOUT_RATE_LIMIT_MAX = "1";
  process.env.CREDIT_CHECKOUT_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.SUBSCRIPTION_CHECKOUT_RATE_LIMIT_MAX = "1";
  process.env.SUBSCRIPTION_CHECKOUT_RATE_LIMIT_WINDOW_MS = "60000";

  try {
    const req = createRequest();

    const creditFirst = await rejectRateLimitedEndpoint({
      req,
      scope: "credit-checkout",
    });
    const creditSecond = await rejectRateLimitedEndpoint({
      req,
      scope: "credit-checkout",
    });
    const subscriptionFirst = await rejectRateLimitedEndpoint({
      req,
      scope: "subscription-checkout",
    });

    assert.equal(creditFirst, null);
    assert.equal(creditSecond?.status, 429);
    assert.equal(subscriptionFirst, null);
  } finally {
    process.env.CREDIT_CHECKOUT_RATE_LIMIT_MAX = previousCreditLimit;
    process.env.CREDIT_CHECKOUT_RATE_LIMIT_WINDOW_MS = previousCreditWindow;
    process.env.SUBSCRIPTION_CHECKOUT_RATE_LIMIT_MAX = previousSubscriptionLimit;
    process.env.SUBSCRIPTION_CHECKOUT_RATE_LIMIT_WINDOW_MS = previousSubscriptionWindow;
  }
});

test("rejectRateLimitedEndpoint falls back to IP when the user is anonymous", async () => {
  const previousLimit = process.env.ORDER_CREATE_RATE_LIMIT_MAX;
  const previousWindow = process.env.ORDER_CREATE_RATE_LIMIT_WINDOW_MS;
  const previousTrustProxy = process.env.TRUST_PROXY_HEADERS;

  process.env.ORDER_CREATE_RATE_LIMIT_MAX = "1";
  process.env.ORDER_CREATE_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.TRUST_PROXY_HEADERS = "true";

  try {
    const req = createRequest({
      headers: new Headers({
        "x-forwarded-for": "203.0.113.10",
      }),
      user: null,
    });

    const first = await rejectRateLimitedEndpoint({
      req,
      scope: "order-create",
    });
    const second = await rejectRateLimitedEndpoint({
      req,
      scope: "order-create",
    });

    assert.equal(first, null);
    assert.equal(second?.status, 429);
  } finally {
    process.env.ORDER_CREATE_RATE_LIMIT_MAX = previousLimit;
    process.env.ORDER_CREATE_RATE_LIMIT_WINDOW_MS = previousWindow;
    process.env.TRUST_PROXY_HEADERS = previousTrustProxy;
  }
});

test("rejectRateLimitedEndpoint supports social write scopes", async () => {
  const previousLimit = process.env.SOCIAL_REACTION_WRITE_RATE_LIMIT_MAX;
  const previousWindow = process.env.SOCIAL_REACTION_WRITE_RATE_LIMIT_WINDOW_MS;

  process.env.SOCIAL_REACTION_WRITE_RATE_LIMIT_MAX = "1";
  process.env.SOCIAL_REACTION_WRITE_RATE_LIMIT_WINDOW_MS = "60000";

  try {
    const req = createRequest({
      user: { id: 42 },
    });

    const first = await rejectRateLimitedEndpoint({
      req,
      scope: "social-reaction-write",
    });
    const second = await rejectRateLimitedEndpoint({
      req,
      scope: "social-reaction-write",
    });

    assert.equal(first, null);
    assert.equal(second?.status, 429);
  } finally {
    process.env.SOCIAL_REACTION_WRITE_RATE_LIMIT_MAX = previousLimit;
    process.env.SOCIAL_REACTION_WRITE_RATE_LIMIT_WINDOW_MS = previousWindow;
  }
});
