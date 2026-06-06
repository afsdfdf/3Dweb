import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const registryPath = path.join(rootDir, "src", "components", "ui-lab", "formal-components-registry.tsx");
const registryCssPath = path.join(rootDir, "src", "components", "ui-lab", "formal-components-registry.module.css");
const previewPath = path.join(rootDir, "src", "components", "ui-lab", "profile-menu-reference-preview.tsx");
const avatarFramePath = path.join(rootDir, "public", "ui-lab", "top-navigation", "profile-menu-avatar-frame@2x.png");
const iconAssetNames = [
  "profile-menu-icon-account@2x.png",
  "profile-menu-icon-asset-library@2x.png",
  "profile-menu-icon-check@2x.png",
  "profile-menu-icon-chevron-down@2x.png",
  "profile-menu-icon-language@2x.png",
  "profile-menu-icon-logout@2x.png",
  "profile-menu-icon-models@2x.png",
  "profile-menu-icon-users@2x.png",
] as const;

test("profile menu reference reuses the exported top navigation avatar frame", () => {
  const source = readFileSync(registryPath, "utf8");
  const cssSource = readFileSync(registryCssPath, "utf8");

  assert.equal(existsSync(avatarFramePath), true);
  assert.match(source, /\/ui-lab\/top-navigation\/profile-menu-avatar-frame@2x\.png/);
  assert.match(cssSource, /background:\s*url\("\/ui-lab\/top-navigation\/profile-menu-avatar-frame@2x\.png"\) center \/ 100% 100% no-repeat/);
});

test("profile menu reference language control is a real dropdown", () => {
  const previewSource = readFileSync(previewPath, "utf8");

  assert.match(previewSource, /"use client"/);
  assert.match(previewSource, /useState/);
  assert.match(previewSource, /aria-expanded=\{isLanguageOpen\}/);
  assert.match(previewSource, /aria-haspopup="listbox"/);
  assert.match(previewSource, /role="listbox"/);
  assert.match(previewSource, /role="option"/);
  assert.match(previewSource, /const \[isLanguageOpen,\s*setIsLanguageOpen\] = useState\(false\)/);
  assert.match(previewSource, /isLanguageOpen \?/);
  assert.match(previewSource, /setSelectedLanguage/);
  assert.doesNotMatch(previewSource, /className=\{\[styles\.profileMenuLink,\s*styles\.profileMenuLinkActive\]\.join\(" "\)\}/);
});

test("profile menu reference uses extracted menu and stat icon assets", () => {
  const previewSource = readFileSync(previewPath, "utf8");

  for (const assetName of iconAssetNames) {
    assert.equal(existsSync(path.join(rootDir, "public", "ui-lab", "top-navigation", assetName)), true);
    assert.match(previewSource, new RegExp(`/ui-lab/top-navigation/${assetName}`));
  }

  assert.match(previewSource, /import \{ Zap \} from "lucide-react"/);
  assert.doesNotMatch(previewSource, /<(Box|Check|ChevronDown|CircleDollarSign|Globe|LayoutGrid|LogOut|UserRound|Users)\b/);
  assert.match(previewSource, /Zap/);
});

test("profile menu reference menu labels use the supplied text metrics", () => {
  const previewSource = readFileSync(previewPath, "utf8");
  const cssSource = readFileSync(registryCssPath, "utf8");

  assert.match(previewSource, /profileMenuLinkText/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?width:\s*102px/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?height:\s*18px/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?font-family:\s*PingFangSC,\s*"PingFang SC"/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?font-weight:\s*500/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?font-size:\s*12px/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?color:\s*rgba\(255,\s*255,\s*255,\s*0\.5\)/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?line-height:\s*18px/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?text-align:\s*left/);
  assert.match(cssSource, /\.profileMenuLinkText\s*\{[\s\S]*?font-style:\s*normal/);
});

test("profile menu reference keeps the measured Lanhu frame geometry", () => {
  const previewSource = readFileSync(previewPath, "utf8");
  const cssSource = readFileSync(registryCssPath, "utf8");

  assert.match(previewSource, /style=\{\{\s*height:\s*414,\s*width:\s*320\s*\}\}/);
  assert.match(cssSource, /\.profileMenuReferenceFrameContent\s*\{[\s\S]*?padding:\s*13px\s+9px\s+5px\s*!important/);
  assert.match(cssSource, /\.profileMenuReferencePanel\s*\{[\s\S]*?height:\s*396px[\s\S]*?width:\s*302px/);
  assert.match(cssSource, /\.profileMenuAvatar\s*\{[\s\S]*?height:\s*80px[\s\S]*?width:\s*80px/);
  assert.match(cssSource, /\.profileMenuDivider\s*\{[\s\S]*?left:\s*15px[\s\S]*?width:\s*272px/);
  assert.match(cssSource, /\.profileMenuLinks\s*\{[\s\S]*?gap:\s*4px[\s\S]*?left:\s*15px[\s\S]*?width:\s*272px/);
  assert.match(cssSource, /\.profileMenuLanguageButton\s*\{[\s\S]*?width:\s*82px/);
  assert.match(cssSource, /\.profileMenuLanguageMenu\s*\{[\s\S]*?height:\s*178px[\s\S]*?right:\s*19px[\s\S]*?top:\s*339px[\s\S]*?width:\s*130px/);
  assert.match(cssSource, /\.profileMenuLink:hover,\s*\.profileMenuLink:focus-visible,\s*\.profileMenuLinkActive\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\.1\)/);
});
