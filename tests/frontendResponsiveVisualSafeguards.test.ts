import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();

const readSource = (...segments: string[]) =>
  readFileSync(path.join(rootDir, ...segments), "utf8");

test("formal fixed shell can scale below desktop width", () => {
  const shellSource = readSource(
    "src",
    "app",
    "(frontend)",
    "_components",
    "SiteShell.tsx",
  );

  assert.match(
    shellSource,
    /--app-stage-scale['"]:\s*['"]min\(1,\s*calc\(100vw\s*\/\s*1920px\)\)['"]/,
  );
  assert.doesNotMatch(
    shellSource,
    /--app-stage-scale['"]:\s*['"]clamp\(1,/,
    "Fixed-stage public pages must not force a minimum 1920px visual stage on laptop/tablet widths.",
  );
});

test("workbench and model detail switch to mobile layout on tablet widths", () => {
  const workbenchCss = readSource(
    "src",
    "app",
    "(frontend)",
    "workbench",
    "page.module.css",
  );
  const modelDetailCss = readSource(
    "src",
    "app",
    "(frontend)",
    "model-detail",
    "page.module.css",
  );

  assert.match(workbenchCss, /@media \(max-width:\s*980px\)/);
  assert.match(modelDetailCss, /@media \(max-width:\s*980px\)/);
  assert.match(
    workbenchCss,
    /@media \(max-width:\s*980px\)[\s\S]*\.page\s*\{[\s\S]*min-width:\s*0/,
  );
  assert.match(
    modelDetailCss,
    /@media \(max-width:\s*980px\)[\s\S]*\.pageRoot\s*\{[\s\S]*min-width:\s*0/,
  );
  assert.match(
    workbenchCss,
    /@media \(max-width:\s*980px\)[\s\S]*\.stageViewport\s*\{[\s\S]*display:\s*none/,
  );
  assert.match(
    modelDetailCss,
    /@media \(max-width:\s*980px\)[\s\S]*\.scaleViewport\s*\{[\s\S]*display:\s*none/,
  );
});

test("subscription panel uses stacked cards instead of horizontal clipping on tablet", () => {
  const cssSource = readSource(
    "src",
    "components",
    "ui-lab",
    "subscription-panel",
    "subscription-panel.module.css",
  );

  assert.match(
    cssSource,
    /@media \(max-width:\s*980px\)[\s\S]*\.planGrid\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  );
  assert.doesNotMatch(
    cssSource,
    /@media \(max-width:\s*1220px\)[\s\S]*\.controls,\s*\.planGrid\s*\{[\s\S]*min-width:\s*1088px/,
    "Tablet subscription layouts must not require a desktop-width horizontal scroll rail.",
  );
});

test("auth modal close control stays inside the modal bounds on mobile", () => {
  const cssSource = readSource("src", "components", "auth", "AuthModalStage.module.css");

  assert.match(cssSource, /\.closeButton\s*\{[\s\S]*right:\s*8px/);
  assert.match(cssSource, /\.closeButton\s*\{[\s\S]*top:\s*8px/);
  assert.doesNotMatch(cssSource, /\.closeButton\s*\{[\s\S]*right:\s*-18px/);
  assert.doesNotMatch(cssSource, /\.closeButton\s*\{[\s\S]*top:\s*-18px/);
});

test("workbench history keeps its own login return path", () => {
  const source = readSource(
    "src",
    "app",
    "(frontend)",
    "workbench",
    "history",
    "page.tsx",
  );

  assert.match(source, /requireUser\(["']\/workbench\/history["']\)/);
  assert.doesNotMatch(
    source,
    /const user = await requireUser\(\)/,
    "History should redirect unauthenticated users back to /workbench/history after sign in.",
  );
});

test("home inspiration cards render a branded fallback instead of blank black previews", () => {
  const gridSource = readSource(
    "src",
    "components",
    "ui-lab",
    "home-test",
    "inspiration-grid.tsx",
  );
  const gridCss = readSource(
    "src",
    "components",
    "ui-lab",
    "home-test",
    "inspiration-grid.module.css",
  );

  assert.match(gridSource, /styles\.previewFallback/);
  assert.match(gridCss, /\.previewFallback\s*\{/);
  assert.match(gridCss, /\/ui-lab\/top-navigation\/logo\.png/);
});

test("home inspiration toolbar leaves room for the page size label on laptop", () => {
  const searchCss = readSource(
    "src",
    "components",
    "ui-lab",
    "home-test",
    "inspiration-search-box.module.css",
  );
  const homeCss = readSource(
    "src",
    "app",
    "(frontend)",
    "test-home",
    "testHomePage.module.css",
  );

  assert.match(searchCss, /\.pageSize\s*\{[\s\S]*width:\s*152px/);
  assert.match(searchCss, /\.pageSize span:first-child\s*\{[\s\S]*max-width:\s*122px/);
  assert.match(
    homeCss,
    /\.inspirationSearchMount :global\(\[class\*="toolbar"\]\)\s*\{[\s\S]*width:\s*min\(48vw,\s*100%\)/,
  );
  assert.doesNotMatch(homeCss, /width:\s*min\(35\.729vw,\s*100%\)/);
});

test("frontend shell opts out of browser auto-translation for fixed art-directed UI", () => {
  const layoutSource = readSource("src", "app", "(frontend)", "layout.tsx");

  assert.match(layoutSource, /other:\s*\{[\s\S]*google:\s*["']notranslate["']/);
  assert.match(layoutSource, /<html[^>]*className=["']notranslate["'][^>]*translate=["']no["']/);
  assert.match(layoutSource, /<body[^>]*className=["']notranslate["'][^>]*translate=["']no["']/);
});
