import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const userMenuPath = path.join(rootDir, "src", "components", "ui-lab", "top-navigation", "user-menu.tsx");
const userMenuCssPath = path.join(rootDir, "src", "components", "ui-lab", "top-navigation", "user-menu.module.css");
const topNavigationPath = path.join(rootDir, "src", "components", "ui-lab", "top-navigation", "top-navigation.tsx");
const registryPath = path.join(rootDir, "src", "components", "ui-lab", "formal-components-registry.tsx");

test("top navigation user menu is a standalone registered component wired to real auth logout", () => {
  assert.equal(existsSync(userMenuPath), true);

  const source = readFileSync(userMenuPath, "utf8");
  const cssSource = readFileSync(userMenuCssPath, "utf8");
  const topNavigationSource = readFileSync(topNavigationPath, "utf8");
  const registrySource = readFileSync(registryPath, "utf8");

  assert.match(source, /export function TopNavigationUserMenu/);
  assert.match(source, /BorderComboFrame1/);
  assert.doesNotMatch(source, /[\u4e00-\u9fff]/);
  assert.doesNotMatch(registrySource, /[\u4e00-\u9fff]/);
  assert.match(source, /\/api\/platform\/session\/logout/);
  assert.match(source, /router\.refresh\(\)/);
  assert.match(source, /document\.addEventListener\("pointerdown"/);
  assert.match(source, /document\.addEventListener\("keydown"/);
  assert.match(source, /\/account/);
  assert.match(source, /\/account\?section=models/);
  assert.match(source, /\/pricing/);
  assert.match(cssSource, /\.menuFrame\s*>\s*div\s*\{[\s\S]*?pointer-events:\s*auto/);

  assert.match(topNavigationSource, /TopNavigationUserMenu/);
  assert.doesNotMatch(topNavigationSource, /href="\/account" className=\{styles\.avatar\}/);
  assert.match(topNavigationSource, /aria-expanded=\{isUserMenuOpen\}/);

  assert.match(registrySource, /top-navigation-user-menu/);
  assert.match(registrySource, /TopNavigationUserMenu/);
});
