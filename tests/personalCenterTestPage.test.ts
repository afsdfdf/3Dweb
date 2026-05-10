import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = process.cwd();
const componentPath = path.join(
  rootDir,
  "src",
  "components",
  "account",
  "account-center",
  "account-center.tsx",
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
  "account",
  "account-center",
  "account-center.module.css",
);

test("account center is promoted to the default account route", () => {
  assert.equal(existsSync(componentPath), true);
  assert.equal(existsSync(accountRoutePath), true);

  const source = readFileSync(componentPath, "utf8");
  const cssSource = readFileSync(componentCssPath, "utf8");
  const accountRouteSource = readFileSync(accountRoutePath, "utf8");
  const frontendSessionSource = readFileSync(frontendSessionPath, "utf8");

  assert.match(source, /export function AccountCenter/);
  assert.match(source, /AccountCenterData/);
  assert.match(source, /accountData/);
  assert.match(source, /emptyRowsBySection/);
  assert.doesNotMatch(source, /fallbackRowsBySection/);
  assert.doesNotMatch(source, /Dragon rider/);
  assert.doesNotMatch(source, /Northern Watcher/);
  assert.doesNotMatch(source, /Lava Colossus/);
  assert.doesNotMatch(source, /\b1280\b/);
  assert.doesNotMatch(source, /OrangeMediumActionButton/);
  assert.doesNotMatch(source, /PurpleMediumActionButton/);
  assert.doesNotMatch(source, /mediumActionSlot/);
  assert.doesNotMatch(source, /sidebarMediumButton/);
  assert.match(source, /selectedAvatarFrameUrl/);
  assert.match(source, /avatarFrameImage/);
  assert.match(source, /TopNavigation/);
  assert.match(source, /resolvePublicNavigationItems/);
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
  assert.match(source, /downloadCsv/);
  assert.match(source, /AuthModalStage/);
  assert.doesNotMatch(source, /publicAccess:/);
  assert.match(accountRouteSource, /@\/components\/account\/account-center/);
  assert.match(accountRouteSource, /AccountCenter/);
  assert.doesNotMatch(accountRouteSource, /PersonalCenterTest/);
  assert.match(accountRouteSource, /requireUser\("\/account"\)/);
  assert.match(accountRouteSource, /initialSection=\{getInitialSection\(query\.section\)\}/);
  assert.match(accountRouteSource, /accountRecordLimit\s*=\s*200/);
  assert.doesNotMatch(accountRouteSource, /\.slice\(0,\s*10\)/);
  assert.match(accountRouteSource, /href:\s*`\/model-detail\?id=/);
  assert.match(accountRouteSource, /href:\s*task\.taskCode/);
  assert.match(accountRouteSource, /fullName:/);
  assert.match(accountRouteSource, /phone:/);
  assert.match(accountRouteSource, /bio:/);
  assert.match(accountRouteSource, /profileVisibility:/);
  assert.match(accountRouteSource, /avatarFrameStyles:/);
  assert.match(frontendSessionSource, /frameImageUrl:\s*getMediaUrl\(style\.frameImage\)/);
  assert.match(frontendSessionSource, /owner:\s*\{\s*equals:\s*user\.id/);
  assert.match(frontendSessionSource, /collection:\s*"credit-transactions"[\s\S]*where:\s*\{\s*user:\s*\{\s*equals:\s*user\.id/);
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
  assert.doesNotMatch(source, /\$\{activeConfig\.label\} Details/);
  assert.doesNotMatch(source, /Orders Details/);
  assert.match(source, /Order history and fulfillment status/);
  assert.match(source, /useState\("all"\)/);
  assert.match(source, /\? "Refresh" : "Apply"/);
  assert.doesNotMatch(cssSource, /scaleX\(/);
  assert.doesNotMatch(cssSource, /mediumActionSlot/);
  assert.match(cssSource, /\.accountShell/);
  assert.match(cssSource, /\.boundTopNavigation/);
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
  assert.match(uploadURLSource, /getProfileMediaPublicAccess\(user\)/);
  assert.doesNotMatch(uploadURLSource, /body\.publicAccess/);
  assert.match(completeSource, /exists\(objectPath\)/);
  assert.match(completeSource, /UPDATE media/);
  assert.match(completeSource, /getProfileMediaPublicAccess\(user\)/);
  assert.doesNotMatch(completeSource, /body\.publicAccess/);
  assert.match(completeSource, /url\s*=\s*\$\d+/);
  assert.match(completeSource, /width\s*=\s*\$\d+/);
  assert.match(completeSource, /height\s*=\s*\$\d+/);
  assert.match(completeSource, /WHERE\s+id\s*=\s*\$\d+/);
  assert.match(completeSource, /AND\s+owner_id\s*=\s*\$\d+/);
  assert.match(completeSource, /AND\s+purpose IN \('avatar', 'profile-banner'\)/);
});
