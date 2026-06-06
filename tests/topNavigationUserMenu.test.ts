import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const userMenuPath = path.join(rootDir, "src", "components", "ui-lab", "top-navigation", "user-menu.tsx");
const userMenuCssPath = path.join(rootDir, "src", "components", "ui-lab", "top-navigation", "user-menu.module.css");
const topNavigationPath = path.join(rootDir, "src", "components", "ui-lab", "top-navigation", "top-navigation.tsx");

test("top navigation user menu is a standalone registered component wired to real auth logout", () => {
  assert.equal(existsSync(userMenuPath), true);

  const source = readFileSync(userMenuPath, "utf8");
  const cssSource = readFileSync(userMenuCssPath, "utf8");
  const topNavigationSource = readFileSync(topNavigationPath, "utf8");

  assert.match(source, /export function TopNavigationUserMenu/);
  assert.match(source, /ButtonBoxFrame/);
  assert.doesNotMatch(source, /[\u4e00-\u9fff]/);
  assert.match(source, /\/api\/platform\/session\/logout/);
  assert.match(source, /\/api\/locale/);
  assert.match(source, /router\.refresh\(\)/);
  assert.match(source, /document\.addEventListener\("pointerdown"/);
  assert.match(source, /document\.addEventListener\("keydown"/);
  assert.match(source, /\/account/);
  assert.match(source, /\/account\?section=models/);
  assert.match(source, /\/pricing/);
  assert.match(source, /user\.bio/);
  assert.match(source, /user\.followingCount/);
  assert.match(source, /user\.modelsCount/);
  assert.match(source, /const \[isLanguageOpen,\s*setIsLanguageOpen\] = useState\(false\)/);
  assert.doesNotMatch(source, /className=\{\[styles\.profileMenuLink,\s*styles\.profileMenuLinkActive\]\.join\(" "\)\}/);
  assert.match(source, /style=\{\{\s*height:\s*414,\s*width:\s*320\s*\}\}/);
  assert.match(cssSource, /profile-menu-avatar-frame@2x\.png/);
  assert.match(cssSource, /profile-menu-nameplate@2x\.png/);
  assert.match(cssSource, /\.profileMenuReferenceFrameContent\s*\{[\s\S]*?padding:\s*13px\s+9px\s+5px\s*!important/);
  assert.match(cssSource, /\.profileMenuReferencePanel\s*\{[\s\S]*?width:\s*302px/);
  assert.match(cssSource, /\.profileMenuReferencePanel\s*\{[\s\S]*?height:\s*396px/);
  assert.match(cssSource, /\.profileMenuAvatar\s*\{[\s\S]*?height:\s*80px[\s\S]*?width:\s*80px/);
  assert.match(cssSource, /\.profileMenuNamePlate\s*\{[\s\S]*?left:\s*64px[\s\S]*?top:\s*29px/);
  assert.match(cssSource, /\.profileMenuDivider\s*\{[\s\S]*?left:\s*15px[\s\S]*?width:\s*272px/);
  assert.match(cssSource, /\.profileMenuLinks\s*\{[\s\S]*?gap:\s*4px[\s\S]*?left:\s*15px[\s\S]*?width:\s*272px/);
  assert.match(cssSource, /\.profileMenuLinkIcon\s*\{[\s\S]*?height:\s*20px[\s\S]*?width:\s*20px/);
  assert.match(cssSource, /\.profileMenuLink:hover,\s*\.profileMenuLink:focus-visible,\s*\.profileMenuLinkActive\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)/);
  assert.match(cssSource, /\.profileMenuLanguageButton\s*\{[\s\S]*?width:\s*82px/);
  assert.match(cssSource, /\.profileMenuLanguageMenu\s*\{[\s\S]*?right:\s*19px[\s\S]*?top:\s*339px[\s\S]*?width:\s*130px/);

  assert.match(topNavigationSource, /TopNavigationUserMenu/);
  assert.doesNotMatch(topNavigationSource, /href="\/account" className=\{styles\.avatar\}/);
  assert.match(topNavigationSource, /aria-expanded=\{isUserMenuOpen\}/);
});
