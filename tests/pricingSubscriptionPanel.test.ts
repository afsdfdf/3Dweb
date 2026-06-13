import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const creditTopupPackPanelPath = path.join(rootDir, "src", "app", "(frontend)", "_components", "CreditTopupPackPanel.tsx");
const subscriptionPagePath = path.join(rootDir, "src", "app", "(frontend)", "_components", "SubscriptionPage.tsx");
const pricingPanelPath = path.join(rootDir, "src", "app", "(frontend)", "_components", "PricingSubscriptionPanel.tsx");
const subscriptionPanelPath = path.join(rootDir, "src", "components", "ui-lab", "subscription-panel", "subscription-panel.tsx");

test("pricing page desktop uses the formal subscription panel UI", () => {
  const source = readFileSync(subscriptionPagePath, "utf8");

  assert.match(source, /PricingSubscriptionPanel/);
  assert.match(source, /max-w-\[1600px\]/);
  assert.match(source, /SubscriptionStatusSync/);
  assert.match(source, /CreditTopupStatusSync/);
  assert.match(source, /CreditTopupPackPanel/);
});

test("pricing subscription bridge keeps auth, checkout, and portal functionality", () => {
  assert.ok(existsSync(pricingPanelPath), "PricingSubscriptionPanel should exist");

  const source = readFileSync(pricingPanelPath, "utf8");

  assert.match(source, /SubscriptionPanel/);
  assert.match(source, /openAuthModal\('login'\)/);
  assert.match(source, /\/api\/billing\/subscriptions\/checkout/);
  assert.match(source, /billingCycle/);
  assert.match(source, /onBillingCycleChange/);
  assert.match(source, /\/api\/billing\/subscriptions\/portal/);
  assert.match(source, /window\.location\.assign/);
  assert.match(source, /ctaDisabled/);
});

test("subscription panel supports disabled production CTA states", () => {
  const source = readFileSync(subscriptionPanelPath, "utf8");

  assert.match(source, /ctaDisabled\?: boolean/);
  assert.match(source, /disabled=\{disabled\}/);
});

test("pricing page exposes one-time credit packs without changing subscription checkout", () => {
  assert.ok(existsSync(creditTopupPackPanelPath), "CreditTopupPackPanel should exist");

  const source = readFileSync(creditTopupPackPanelPath, "utf8");

  assert.match(source, /CreditTopupRedemptionDialog/);
  assert.match(source, /Credit Packs/);
  assert.match(source, /One-time top-ups/);
  assert.match(source, /label="BUY"/);
  assert.match(source, /openAuthModal\("login"\)/);
});
