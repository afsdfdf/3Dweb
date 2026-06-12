import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const componentPath = path.join(rootDir, "src", "components", "ui-lab", "follow-creator-card", "follow-creator-card.tsx");
const dataPath = path.join(rootDir, "src", "components", "ui-lab", "follow-creator-card", "follow-creator-card-data.ts");
const cssPath = path.join(rootDir, "src", "components", "ui-lab", "follow-creator-card", "follow-creator-card.module.css");
const formalPagePath = path.join(rootDir, "src", "app", "(frontend)", "formal-components", "page.tsx");
const indexPath = path.join(rootDir, "src", "components", "ui-lab", "index.ts");
const registryPath = path.join(rootDir, "src", "components", "ui-lab", "formal-components-registry.tsx");

test("follow creator card keeps the Lanhu card dimensions and transparent root", () => {
  assert.equal(existsSync(componentPath), true);
  assert.equal(existsSync(cssPath), true);

  const css = readFileSync(cssPath, "utf8");

  assert.match(css, /\.card\s*\{[\s\S]*?width:\s*300px/);
  assert.match(css, /\.card\s*\{[\s\S]*?height:\s*432px/);
  assert.match(css, /\.card\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*0\)/);
  assert.match(css, /\.frameContent\s*\{[\s\S]*?overflow:\s*visible/);
});

test("follow creator card reuses the lined frame, button, stats, and carousel assets", () => {
  const source = readFileSync(componentPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  assert.match(source, /getSupabasePreviewImageURL/);
  assert.match(source, /src=\{getSupabasePreviewImageURL\(item\.imageSrc,\s*"model-card"\)\}/);
  assert.match(source, /BorderComboFrame1/);
  assert.doesNotMatch(source, /ButtonBoxFrame/);
  assert.match(source, /FrameButton/);
  assert.match(source, /\/ui-lab\/top-navigation/);
  assert.match(source, /profile-menu-icon-users@2x\.png/);
  assert.match(source, /profile-menu-icon-models@2x\.png/);
  assert.match(source, /\/ui\/workbench\/model-detail\/sketch-assets\/creator-avatar\.jpg/);
  assert.match(source, /\/ui-lab\/model-detail-uicut\/images\/detail-side-img\.png/);
  assert.match(css, /side-arrow-left-dark-normal\.png/);
  assert.match(css, /side-arrow-right-dark-normal\.png/);
  assert.match(css, /--frame-border-width:\s*34px/);
});

test("follow creator card action menu is a real interactive menu", () => {
  const source = readFileSync(componentPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, /useState/);
  assert.match(source, /aria-haspopup="menu"/);
  assert.match(source, /aria-expanded=\{isMenuOpen\}/);
  assert.match(source, /role="menu"/);
  assert.match(source, /role="menuitem"/);
  assert.match(source, /Not interested/);
  assert.match(source, /Complaint/);
  assert.match(css, /\.menuPopover\s*\{[\s\S]*?right:\s*-106px/);
});

test("formal component registry exposes the follow creator card preview", () => {
  const registry = readFileSync(registryPath, "utf8");
  const formalPage = readFileSync(formalPagePath, "utf8");
  const index = readFileSync(indexPath, "utf8");

  assert.match(index, /export \* from "\.\/follow-creator-card"/);
  assert.match(registry, /FollowCreatorCard/);
  assert.match(registry, /follow-creator-card/);
  assert.match(registry, /followCreatorCardData/);
  assert.match(registry, /<FollowCreatorCard \{\.\.\.\(followCreatorCardData \?\? \{\}\)\} \/>/);
  assert.match(formalPage, /getFollowCreatorCardData/);
  assert.match(formalPage, /selectedId === "follow-creator-card" \? await getFollowCreatorCardData\(\) : null/);
});

test("follow creator card data loader pulls real user and model data safely", () => {
  assert.equal(existsSync(dataPath), true);

  const source = readFileSync(dataPath, "utf8");

  assert.match(source, /getCurrentUser/);
  assert.match(source, /collection:\s*"user-follows"[\s\S]*?overrideAccess:\s*false[\s\S]*?user:\s*currentUser/);
  assert.match(source, /collection:\s*"users"[\s\S]*?profileVisibility:\s*\{[\s\S]*?equals:\s*"public"/);
  assert.match(source, /collection:\s*"models"[\s\S]*?visibility:\s*\{[\s\S]*?equals:\s*"public"/);
  assert.match(source, /payload\.count\(\{[\s\S]*?collection:\s*"models"[\s\S]*?overrideAccess:\s*false/);
  assert.match(source, /getModelPreviewURL/);
  assert.match(source, /getMediaAccessURL/);
  assert.match(source, /avatarSrc:\s*avatarSrc \|\| fallbackAvatarSrc/);
});
