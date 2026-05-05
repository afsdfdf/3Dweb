import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const componentPath = path.join(
  rootDir,
  "src",
  "components",
  "ui-lab",
  "personal-center-test",
  "personal-center-test.tsx",
);
const accountRoutePath = path.join(
  rootDir,
  "src",
  "app",
  "(frontend)",
  "account",
  "page.tsx",
);
const frontendSessionPath = path.join(
  rootDir,
  "src",
  "app",
  "(frontend)",
  "_lib",
  "session.ts",
);
const uploadURLRoutePath = path.join(
  rootDir,
  "src",
  "app",
  "api",
  "account",
  "profile-media",
  "upload-url",
  "route.ts",
);
const completeRoutePath = path.join(
  rootDir,
  "src",
  "app",
  "api",
  "account",
  "profile-media",
  "complete",
  "route.ts",
);
const componentCssPath = path.join(
  rootDir,
  "src",
  "components",
  "ui-lab",
  "personal-center-test",
  "personal-center-test.module.css",
);

test("personal center is promoted to the default account route", () => {
  assert.equal(existsSync(componentPath), true);
  assert.equal(existsSync(accountRoutePath), true);

  const source = readFileSync(componentPath, "utf8");
  const cssSource = readFileSync(componentCssPath, "utf8");
  const accountRouteSource = readFileSync(accountRoutePath, "utf8");
  const frontendSessionSource = readFileSync(frontendSessionPath, "utf8");

  assert.match(source, /BorderComboFrame2/);
  assert.match(source, /accountFrameContainer/);
  assert.match(source, /FrameButton/);
  assert.doesNotMatch(source, /OrangeMediumActionButton/);
  assert.doesNotMatch(source, /PurpleMediumActionButton/);
  assert.doesNotMatch(source, /mediumActionSlot/);
  assert.doesNotMatch(source, /sidebarMediumButton/);
  assert.match(source, /selectedAvatarFrameUrl/);
  assert.match(source, /avatarFrameImage/);
  assert.match(source, /TopNavigation/);
  assert.match(source, /publicNavigationItems/);
  assert.doesNotMatch(source, /realNavigationItems/);
  assert.match(source, /fetch\(\s*["']\/api\/account\/profile["']/);
  assert.match(source, /fetch\(\s*["']\/api\/account\/password["']/);
  assert.match(
    source,
    /fetch\(\s*["']\/api\/account\/profile-media\/upload-url["']/,
  );
  assert.match(
    source,
    /fetch\(\s*["']\/api\/account\/profile-media\/complete["']/,
  );
  assert.match(source, /getSupabaseBrowserClient/);
  assert.match(source, /router\.refresh\(\)/);
  assert.match(source, /router\.push\("\/workbench"\)/);
  assert.match(source, /router\.push\("\/pricing"\)/);
  assert.match(source, /fullWidth/);
  assert.match(source, /downloadCsv/);
  assert.match(source, /AuthModalStage/);
  assert.match(accountRouteSource, /PersonalCenterTest/);
  assert.match(accountRouteSource, /requireUser\("\/account"\)/);
  assert.match(accountRouteSource, /initialSection=\{getInitialSection\(query\.section\)\}/);
  assert.match(accountRouteSource, /fullName:/);
  assert.match(accountRouteSource, /phone:/);
  assert.match(accountRouteSource, /bio:/);
  assert.match(accountRouteSource, /profileVisibility:/);
  assert.match(accountRouteSource, /avatarFrameStyles:/);
  assert.match(frontendSessionSource, /frameImageUrl:\s*getMediaUrl\(style\.frameImage\)/);
  assert.doesNotMatch(accountRouteSource, /AccountTestPage/);

  for (const label of [
    "Overview",
    "Account Settings",
    "Orders",
    "Model Library",
    "Generation Tasks",
    "Billing",
    "Change avatar",
    "Creator Banner",
    "Save Profile",
    "Save Password",
  ]) {
    assert.match(source, new RegExp(label));
  }

  assert.doesNotMatch(source, /Credit Ledger/);
  assert.doesNotMatch(source, /Payment Data/);
  assert.doesNotMatch(source, /Classic Account/);
  assert.doesNotMatch(source, /Main Dashboard/);
  assert.doesNotMatch(source, /number:/);
  assert.doesNotMatch(source, /section\.number/);
  assert.doesNotMatch(source, /Profile Avatar/);
  assert.doesNotMatch(source, /Change Avatar/);
  assert.doesNotMatch(cssSource, /scaleX\(/);
  assert.doesNotMatch(cssSource, /mediumActionSlot/);
  assert.ok(
    source.indexOf('label: "Overview"') <
      source.indexOf('label: "Account Settings"'),
  );
  assert.match(source, /useState<SectionId>\(initialSection\)/);

  for (const tableHeader of [
    "ID",
    "Type",
    "Item",
    "Status",
    "Amount",
    "Time",
  ]) {
    assert.match(source, new RegExp(tableHeader));
  }
});

test("profile media upload creates media only after Supabase upload completion", () => {
  assert.equal(existsSync(uploadURLRoutePath), true);
  assert.equal(existsSync(completeRoutePath), true);

  const uploadURLSource = readFileSync(uploadURLRoutePath, "utf8");
  const completeSource = readFileSync(completeRoutePath, "utf8");

  assert.doesNotMatch(uploadURLSource, /url:\s*publicUrl/);
  assert.match(uploadURLSource, /mediaId:\s*media\.id/);
  assert.match(uploadURLSource, /INSERT INTO media/);
  assert.match(completeSource, /exists\(objectPath\)/);
  assert.match(completeSource, /UPDATE media/);
  assert.match(completeSource, /url\s*=\s*\$\d+/);
  assert.match(completeSource, /width\s*=\s*\$\d+/);
  assert.match(completeSource, /height\s*=\s*\$\d+/);
  assert.match(completeSource, /WHERE\s+id\s*=\s*\$\d+/);
  assert.match(completeSource, /AND\s+owner_id\s*=\s*\$\d+/);
  assert.match(completeSource, /AND\s+purpose IN \('avatar', 'profile-banner'\)/);
});
