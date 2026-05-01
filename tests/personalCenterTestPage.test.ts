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
const routePath = path.join(
  rootDir,
  "src",
  "app",
  "(frontend)",
  "personal-center-test",
  "page.tsx",
);
const accountRoutePath = path.join(
  rootDir,
  "src",
  "app",
  "(frontend)",
  "account",
  "page.tsx",
);

test("personal center is promoted to the default account route", () => {
  assert.equal(existsSync(componentPath), true);
  assert.equal(existsSync(routePath), true);
  assert.equal(existsSync(accountRoutePath), true);

  const source = readFileSync(componentPath, "utf8");
  const routeSource = readFileSync(routePath, "utf8");
  const accountRouteSource = readFileSync(accountRoutePath, "utf8");

  assert.match(source, /BorderComboFrame2/);
  assert.match(source, /accountFrameContainer/);
  assert.match(source, /FrameButton/);
  assert.match(source, /OrangeMediumActionButton/);
  assert.doesNotMatch(source, /PurpleMediumActionButton/);
  assert.match(source, /mediumActionSlot/);
  assert.match(source, /TopNavigation/);
  assert.match(source, /publicNavigationItems/);
  assert.doesNotMatch(source, /realNavigationItems/);
  assert.match(source, /fetch\(\s*["']\/api\/account\/profile["']/);
  assert.match(source, /fetch\(\s*["']\/api\/account\/password["']/);
  assert.match(
    source,
    /fetch\(\s*["']\/api\/account\/profile-media\/upload-url["']/,
  );
  assert.match(source, /getSupabaseBrowserClient/);
  assert.match(source, /router\.refresh\(\)/);
  assert.match(source, /router\.push\("\/workbench"\)/);
  assert.match(source, /router\.push\("\/pricing"\)/);
  assert.match(source, /downloadCsv/);
  assert.match(source, /AuthModalStage/);
  assert.match(routeSource, /redirect\("\/account"\)/);
  assert.match(accountRouteSource, /PersonalCenterTest/);
  assert.match(accountRouteSource, /requireUser\(\)/);
  assert.match(accountRouteSource, /fullName:/);
  assert.match(accountRouteSource, /phone:/);
  assert.match(accountRouteSource, /bio:/);
  assert.match(accountRouteSource, /profileVisibility:/);
  assert.doesNotMatch(accountRouteSource, /AccountTestPage/);
  assert.doesNotMatch(routeSource, /SiteShell/);

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
  assert.ok(
    source.indexOf('label: "Overview"') <
      source.indexOf('label: "Account Settings"'),
  );
  assert.match(source, /useState<SectionId>\("overview"\)/);

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
