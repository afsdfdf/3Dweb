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
  assert.match(accountRouteSource, /getMarketingSiteSettings/);
  assert.doesNotMatch(accountRouteSource, /getMarketingSiteData/);
  assert.doesNotMatch(accountRouteSource, /PersonalCenterTest/);
  assert.match(accountRouteSource, /requireUser\("\/account"\)/);
  assert.match(accountRouteSource, /initialSection=\{activeSection\}/);
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
  assert.match(
    frontendSessionSource,
    /where:\s*getCurrentUserScopedWhere\("owner", user\.id, options\)/,
  );
  assert.match(
    frontendSessionSource,
    /collection:\s*"credit-transactions"[\s\S]*where:\s*getCurrentUserScopedWhere\("user", user\.id, options\)/,
  );
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
  assert.doesNotMatch(source, /Control Panel/);
  assert.doesNotMatch(source, /panelHeader/);
  assert.doesNotMatch(source, /titleBySection/);
  assert.doesNotMatch(source, /number:/);
  assert.doesNotMatch(source, /section\.number/);
  assert.doesNotMatch(source, /Profile Avatar/);
  assert.doesNotMatch(source, /Change Avatar/);
  assert.doesNotMatch(source, /\$\{activeConfig\.label\} Details/);
  assert.doesNotMatch(source, /Orders Details/);
  assert.match(source, /Order history and fulfillment status/);
  assert.match(source, /useState\("all"\)/);
  assert.match(source, /\? "Refresh" : "Apply"/);
  assert.match(source, /<Link[\s\S]*prefetch=\{false\}[\s\S]*className=\{styles\.tableActionButton\}/);
  assert.match(source, /visibleRecordRowCount\s*=\s*pagedRows\.length === 0 \? 1 : pagedRows\.length/);
  assert.match(source, /placeholderRecordRows\s*=\s*Array\.from/);
  assert.match(source, /pageSize - visibleRecordRowCount/);
  assert.match(source, /className=\{styles\.recordPlaceholderRow\}/);
  assert.match(source, /type OverviewMetricCard/);
  assert.match(source, /overviewMetricCards:\s*OverviewMetricCard\[\]/);
  assert.doesNotMatch(source, /const metrics =/);
  assert.doesNotMatch(source, /overviewHighlights/);
  assert.doesNotMatch(source, /Account asset summary/);
  assert.doesNotMatch(source, /styles\.assetStrip/);
  assert.doesNotMatch(source, /label:\s*"Balance"/);
  assert.doesNotMatch(source, /label:\s*"Active Tasks"/);
  assert.match(source, /label:\s*"Generation Tasks"[\s\S]*section:\s*"tasks"/);
  assert.match(source, /label:\s*"Billing"[\s\S]*section:\s*"billing"/);
  assert.match(source, /onClick=\{\(\) => changeSection\(item\.section\)\}/);
  assert.match(source, /updateModelVisibility/);
  assert.match(source, /\/api\/account\/models\/\$\{encodeURIComponent\(row\.id\)\}\/visibility/);
  assert.match(source, /styles\.visibilitySelectWrap/);
  assert.match(source, /styles\.visibilitySelect/);
  assert.match(source, /<option value="public">\s*PUBLIC\s*<\/option>/);
  assert.match(source, /<option value="private">\s*PRIVATE\s*<\/option>/);
  assert.match(accountRouteSource, /const visibility = model\.visibility === "public" \? "public" : "private"/);
  assert.match(accountRouteSource, /visibilitySelectLabel:/);
  assert.doesNotMatch(cssSource, /scaleX\(/);
  assert.doesNotMatch(cssSource, /mediumActionSlot/);
  assert.match(cssSource, /\.accountShell/);
  assert.match(cssSource, /\.boundTopNavigation/);
  assert.match(cssSource, /--account-readable-text:\s*15px/);
  assert.match(cssSource, /--account-workspace-min-height:\s*848px/);
  assert.match(cssSource, /padding:\s*18px var\(--content-page-gutter\) 72px/);
  assert.match(cssSource, /\.accountHero\s*\{[\s\S]*min-height:\s*112px/);
  assert.match(cssSource, /\.accountHeroCopy h1\s*\{[\s\S]*font-size:\s*34px/);
  assert.match(cssSource, /\.accountFrameGrid\s*\{[\s\S]*margin-top:\s*18px/);
  assert.match(cssSource, /\.accountPanel\s*\{[\s\S]*display:\s*flex/);
  assert.match(cssSource, /\.panelFrameContent\s*\{[\s\S]*min-height:\s*var\(--account-workspace-min-height\)/);
  assert.match(cssSource, /\.accountFrameContent\s*\{[\s\S]*min-height:\s*var\(--account-workspace-min-height\)/);
  assert.match(cssSource, /\.accountFrameContent\s*\{[\s\S]*flex:\s*1 1 auto/);
  assert.match(cssSource, /\.contentPanel\s*\{[\s\S]*flex:\s*1 1 auto/);
  assert.match(cssSource, /\.contentPanel\s*\{[\s\S]*min-height:\s*0/);
  assert.match(cssSource, /\.contentPanelWithSummary\s*\{[\s\S]*min-height:\s*560px/);
  assert.match(cssSource, /\.contentPanelFull\s*\{[\s\S]*min-height:\s*0/);
  assert.match(cssSource, /\.pagination\s*\{[\s\S]*margin-top:\s*8px/);
  assert.doesNotMatch(cssSource, /\.pagination\s*\{[\s\S]*position:\s*absolute/);
  assert.match(cssSource, /\.metricCardButton\s*\{[\s\S]*cursor:\s*pointer/);
  assert.match(cssSource, /\.metricCardButton:hover,\s*\.metricCardButton:focus-visible\s*\{/);
  assert.doesNotMatch(cssSource, /assetStrip/);
  assert.match(cssSource, /\.overviewGrid \.metricCardButton\s*\{[\s\S]*min-height:\s*84px/);
  assert.match(cssSource, /\.visibilitySelectWrap\s*\{/);
  assert.match(cssSource, /\.visibilitySelectWrap::after\s*\{/);
  assert.match(cssSource, /\.visibilitySelect\s*\{[\s\S]*cursor:\s*pointer/);
  assert.match(cssSource, /\.visibilitySelectPublic\s*\{/);
  assert.match(cssSource, /\.visibilitySelect:disabled\s*\{/);
  assert.match(cssSource, /\.recordPlaceholderRow\s*\{[\s\S]*pointer-events:\s*none/);
  assert.match(cssSource, /\.recordPlaceholderRow td\s*\{[\s\S]*color:\s*transparent/);
  assert.match(cssSource, /\.sideMenu button\s*\{[\s\S]*min-height:\s*54px/);
  assert.match(cssSource, /\.sideMenu strong\s*\{[\s\S]*font-size:\s*15px/);
  assert.match(cssSource, /\.recordsTable th,\s*\.recordsTable td\s*\{[\s\S]*height:\s*52px/);
  assert.match(cssSource, /\.recordsTable th,\s*\.recordsTable td\s*\{[\s\S]*font-size:\s*14px/);
  assert.match(cssSource, /@media \(max-width: 980px\)[\s\S]*--account-workspace-min-height:\s*0/);
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

test("account route only loads full records for the active account section", () => {
  const accountRouteSource = readFileSync(accountRoutePath, "utf8");
  const frontendSessionSource = readFileSync(frontendSessionPath, "utf8");
  const marketingSource = readFileSync(
    path.join(rootDir, "src", "app", "(frontend)", "_lib", "marketing.ts"),
    "utf8",
  );

  assert.match(
    accountRouteSource,
    /const activeSection = getInitialSection\(query\.section\)/,
  );
  assert.match(accountRouteSource, /accountSummaryLimit\s*=\s*1/);

  for (const section of ["billing", "models", "orders", "tasks"]) {
    assert.match(
      accountRouteSource,
      new RegExp(
        `${section}:\\s*activeSection === "${section}"\\s*\\?\\s*accountRecordLimit\\s*:\\s*accountSummaryLimit`,
      ),
    );
  }

  assert.doesNotMatch(
    accountRouteSource,
    /getCurrentUserCreditTransactions\(\{ limit: accountRecordLimit \}\)[\s\S]*getCurrentUserTasks\(\{ limit: accountRecordLimit \}\)[\s\S]*getCurrentUserModels\(\{ limit: accountRecordLimit \}\)[\s\S]*getCurrentUserOrders\(\{ limit: accountRecordLimit \}\)/,
  );
  assert.match(
    accountRouteSource,
    /getCurrentUserTasks\(\{\s*depth: 0,\s*limit: accountSummaryLimit,[\s\S]*select: accountTaskSelect,[\s\S]*status: \["queued", "processing"\],\s*\}\)/,
  );
  assert.match(
    accountRouteSource,
    /getCurrentUserOrders\(\{\s*depth: 0,\s*limit: accountSummaryLimit,[\s\S]*select: accountOrderSelect,[\s\S]*status: \["paid", "in-production", "shipped"\],\s*\}\)/,
  );
  assert.match(frontendSessionSource, /status\?: string \| string\[\]/);
  assert.match(frontendSessionSource, /depth\?: number/);
  assert.match(frontendSessionSource, /select\?: Record<string, true>/);
  assert.match(frontendSessionSource, /depth: options\.depth \?\? 1/);
  assert.match(frontendSessionSource, /select: options\.select/);
  assert.match(frontendSessionSource, /status: \{ in: options\.status \}/);
  assert.match(marketingSource, /export async function getMarketingSiteSettings/);

  for (const queryName of [
    "getCurrentUserCreditTransactions",
    "getCurrentUserTasks",
    "getCurrentUserModels",
    "getCurrentUserOrders",
  ]) {
    assert.match(
      accountRouteSource,
      new RegExp(`${queryName}\\(\\{[\\s\\S]*depth: 0`),
    );
  }

  for (const field of [
    "accountBillingSelect",
    "accountModelSelect",
    "accountOrderSelect",
    "accountTaskSelect",
  ]) {
    assert.match(accountRouteSource, new RegExp(`${field}: Record<string, true>`));
  }

  assert.match(accountRouteSource, /select: accountTaskSelect/);
  assert.match(accountRouteSource, /select: accountBillingSelect/);
  assert.match(accountRouteSource, /select: accountModelSelect/);
  assert.match(accountRouteSource, /select: accountOrderSelect/);
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
