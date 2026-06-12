import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const componentPath = path.join(rootDir, "src", "components", "ui-lab", "subscription-panel", "subscription-panel.tsx");
const cssPath = path.join(rootDir, "src", "components", "ui-lab", "subscription-panel", "subscription-panel.module.css");
const registryPath = path.join(rootDir, "src", "components", "ui-lab", "formal-components-registry.tsx");
const registryCssPath = path.join(rootDir, "src", "components", "ui-lab", "formal-components-registry.module.css");

test("subscription panel component uses the formal frame and design-sized header", () => {
  assert.ok(existsSync(componentPath), "subscription panel component should exist");
  assert.ok(existsSync(cssPath), "subscription panel CSS should exist");

  const source = readFileSync(componentPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  assert.match(source, /ButtonBoxFrame/);
  assert.match(source, /Subscription/);
  assert.match(source, /Free/);
  assert.match(source, /Pro/);
  assert.match(source, /Studio/);
  assert.match(source, /button-orange-medium-normal\.png/);
  assert.match(source, /icon-coin-badge\.png/);
  assert.match(source, /compact\?: boolean/);
  assert.match(source, /data-subscription-panel-density=\{compact \? "compact" : "default"\}/);

  assert.match(css, /--subscription-panel-width:\s*1142px/);
  assert.match(css, /--subscription-panel-height:\s*866px/);
  assert.match(css, /flex:\s*0 0 var\(--subscription-panel-width\)/);
  assert.match(css, /height:\s*78px/);
  assert.match(css, /width:\s*256px/);
  assert.match(css, /height:\s*58px/);
  assert.match(css, /\.panel\[data-subscription-panel-density="compact"\]\s*\{[\s\S]*--subscription-panel-height:\s*min\(740px,\s*calc\(100vh\s*-\s*92px\)\)/);
  assert.match(css, /\.panel\[data-subscription-panel-density="compact"\]\s+\.body\s*\{[\s\S]*overflow:\s*auto/);
  assert.match(css, /\.panel\[data-subscription-panel-density="compact"\]\s+\.planGrid\s*\{[\s\S]*height:\s*calc\(100%\s*-\s*58px\)/);
  assert.match(css, /border-image-slice:\s*0 20 fill/);
  assert.match(css, /border-image-source:\s*var\(--subscribe-button-image\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*1fr\)/);
});

test("formal component registry exposes the subscription panel preview", () => {
  const registry = readFileSync(registryPath, "utf8");
  const registryCss = readFileSync(registryCssPath, "utf8");

  assert.match(registry, /subscription-panel/);
  assert.match(registry, /SubscriptionPanel/);
  assert.match(registry, /<SubscriptionPanel/);
  assert.match(registry, /stageWide/);
  assert.match(registryCss, /\.stageWide\s*\{[\s\S]*justify-content:\s*flex-start/);
  assert.match(registryCss, /\.subscriptionPanelDemo\s*\{[\s\S]*margin-inline:\s*auto/);
});
