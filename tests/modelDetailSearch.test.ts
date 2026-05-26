import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const modelDetailPath = path.join(rootDir, "src", "app", "(frontend)", "model-detail", "ModelDetailNative.tsx");
const modelDetailCssPath = path.join(rootDir, "src", "app", "(frontend)", "model-detail", "page.module.css");
const modelDetailDataPath = path.join(rootDir, "src", "app", "(frontend)", "model-detail", "_lib", "modelDetailData.ts");

test("model detail search submits to showcase search from the visible header area", () => {
  const source = readFileSync(modelDetailPath, "utf8");
  const cssSource = readFileSync(modelDetailCssPath, "utf8");

  assert.match(source, /<form\s+action="\/showcase"\s+className="search-box"\s+method="get"\s+role="search">/);
  assert.match(source, /name="q"/);
  assert.match(source, /type="search"/);
  assert.match(source, /<button\s+className="uc-btn"\s+type="submit">/);
  assert.doesNotMatch(source, /<a href="#" className="uc-btn">\s*Search\s*<\/a>/);
  assert.match(cssSource, /\.pageRoot :global\(\.uc-detail \.detail-left-top \.search-box\)/);
  assert.doesNotMatch(cssSource, /\.pageRoot :global\(\.uc-detail \.search-box\) \{\s*position:\s*absolute;[\s\S]*bottom:\s*120px;/);
});

test("model detail data only exposes preview optimization status to owner or staff", () => {
  const source = readFileSync(modelDetailDataPath, "utf8");

  assert.match(source, /viewerOptimizationStatus/);
  assert.match(source, /canViewOptimizationStatus/);
  assert.match(source, /isOwnedByCurrentUser \|\| isStaffUser\(currentUser\)/);
  assert.match(source, /canViewOptimizationStatus\s*\?\s*normalizeModelDetailOptimizationStatus/);
  assert.doesNotMatch(source, /previewFile.*url/i);
});
