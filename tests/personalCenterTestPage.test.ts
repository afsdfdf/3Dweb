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
const componentIndexPath = path.join(
  rootDir,
  "src",
  "components",
  "account",
  "account-center",
  "index.ts",
);
const componentCssPath = path.join(
  rootDir,
  "src",
  "components",
  "account",
  "account-center",
  "account-center.module.css",
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

test("account center keeps fixed UI while restoring personal center sections", () => {
  assert.equal(existsSync(componentPath), true);
  assert.equal(existsSync(accountRoutePath), true);

  const source = readFileSync(componentPath, "utf8");
  const indexSource = readFileSync(componentIndexPath, "utf8");
  const cssSource = readFileSync(componentCssPath, "utf8");
  const accountRouteSource = readFileSync(accountRoutePath, "utf8");
  const frontendSessionSource = readFileSync(frontendSessionPath, "utf8");

  assert.match(source, /export function AccountCenter/);
  assert.match(source, /"points-history"/);
  assert.match(source, /"profile"/);
  assert.match(source, /"orders"/);
  assert.match(source, /"models"/);
  assert.match(source, /"tasks"/);
  assert.match(indexSource, /AccountSection/);
  assert.match(source, /AccountCenterData/);
  assert.match(source, /accountData/);
  assert.match(source, /emptyRowsBySection/);
  assert.match(source, /TopNavigation/);
  assert.match(source, /BorderComboFrame2/);
  assert.doesNotMatch(source, /BorderComboFrame2Variant/);
  assert.match(source, /styles\.accountFrameLogo/);
  assert.match(source, /styles\.accountFrameDivider/);
  assert.match(source, /AuthModalStage/);
  assert.match(source, /resolvePublicNavigationItems/);
  assert.match(source, /getSupabaseBrowserClient/);
  assert.doesNotMatch(source, /fallbackRowsBySection/);
  assert.doesNotMatch(source, /Dragon rider/);
  assert.doesNotMatch(source, /Northern Watcher/);
  assert.doesNotMatch(source, /Lava Colossus/);
  assert.doesNotMatch(source, /OrangeMediumActionButton/);
  assert.doesNotMatch(source, /PurpleMediumActionButton/);

  for (const label of [
    "PROFILE",
    "POINTS HISTORY",
    "ORDERS",
    "MODEL LIBRARY",
    "GENERATION TASKS",
    "Account Name",
    "Background",
    "Email used for registration",
    "Change your password",
    "Points History",
    "RECHARGE",
  ]) {
    assert.match(source, new RegExp(label));
  }

  for (const oldDashboardLabel of [
    "Overview",
    "Account Settings",
    "Save Profile",
    "Save Password",
  ]) {
    assert.doesNotMatch(source, new RegExp(oldDashboardLabel));
  }

  assert.match(source, /useState<EditableField \| null>\(null\)/);
  assert.match(source, /editingField && editingField !== field/);
  assert.match(source, /startDisplayNameEdit/);
  assert.match(source, /saveDisplayName/);
  assert.match(source, /setStatusMessage\("Saving account name\.\.\."\)/);
  assert.match(source, /isSavingDisplayName \? "SAVING" : "SAVE"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /savePassword/);
  assert.match(source, /setEditingField\(null\)/);
  assert.match(source, /if \(!file\) \{[\s\S]*setEditingField\(null\);[\s\S]*return;/);
  assert.match(
    source,
    /setEditingField\(purpose === "avatar" \? "avatar" : "background"\)/,
  );
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
  assert.match(source, /router\.refresh\(\)/);
  assert.match(source, /router\.push\("\/pricing"\)/);
  assert.match(source, /openRecordHref/);
  assert.match(source, /toggleModelVisibility/);
  assert.match(source, /\/api\/account\/models\/\$\{encodeURIComponent\(row\.id\)\}\/visibility/);
  assert.match(source, /visibility === "public"/);
  assert.match(source, /getModelVisibilityLabel/);
  assert.match(source, /ExternalLink/);
  assert.match(source, /EyeOff/);
  assert.match(source, /useSearchParams/);
  assert.match(source, /normalizeAccountSection\(sectionParam, initialSection\)/);
  assert.match(source, /account-page-locked/);
  assert.doesNotMatch(source, /downloadCsv/);
  assert.doesNotMatch(source, /Export CSV/);
  assert.doesNotMatch(source, /publicAccess:/);

  assert.match(source, /activeSection === tab\.id/);
  assert.match(source, /section=\$\{encodeURIComponent\(section\)\}/);
  assert.match(source, /pointsPageSize\s*=\s*10/);
  assert.match(source, /defaultRecordPageSize\s*=\s*10/);
  assert.match(source, /minRecordPageSize\s*=\s*6/);
  assert.match(source, /maxRecordPageSize\s*=\s*14/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /setRecordPageSize/);
  assert.match(source, /viewport\.clientHeight - fixedHeight/);
  assert.match(source, /\{pointsPageSize\} Items \/ Page/);
  assert.match(source, /\{recordPageSize\} Items \/ Page/);
  assert.match(source, /className=\{styles\.pageIndicator\}/);
  assert.match(source, /className=\{styles\.pageSizeLabel\}/);
  assert.match(source, /<td title=\{row\.id\}>\{row\.id\}<\/td>/);
  assert.match(source, /<td title=\{row\.item\}>\{row\.item\}<\/td>/);
  assert.match(source, /<td title=\{row\.status\}>\{row\.status\}<\/td>/);
  assert.match(source, /<td title=\{row\.time\}>\{row\.time\}<\/td>/);
  assert.doesNotMatch(source, /styles\.currentPage/);
  assert.doesNotMatch(source, /Array\.from\(\{ length: totalPointPages/);
  assert.doesNotMatch(source, /Array\.from\(\s*\{ length: totalRecordPages/);
  assert.doesNotMatch(source, /detail-bottom-icon-1\.png/);

  const chromeIndex = source.indexOf("className={styles.accountChrome}");
  const bodyIndex = source.indexOf("className={styles.accountBody}");
  const tabsIndex = source.indexOf("className={styles.secondaryTabs}");
  const viewportIndex = source.indexOf("className={styles.accountContentViewport}");

  assert.notEqual(chromeIndex, -1);
  assert.notEqual(bodyIndex, -1);
  assert.notEqual(tabsIndex, -1);
  assert.notEqual(viewportIndex, -1);
  assert.ok(chromeIndex < bodyIndex);
  assert.ok(bodyIndex < tabsIndex);
  assert.ok(tabsIndex < viewportIndex);

  const editAvatarIndex = source.indexOf("function editAvatar()");
  const editBackgroundIndex = source.indexOf("function editBackground()");
  const returnIndex = source.indexOf("return (", editBackgroundIndex);

  assert.notEqual(editAvatarIndex, -1);
  assert.notEqual(editBackgroundIndex, -1);
  assert.notEqual(returnIndex, -1);
  assert.doesNotMatch(
    source.slice(editAvatarIndex, returnIndex),
    /setEditingField\("avatar"\)|setEditingField\("background"\)/,
  );

  for (const tableHeader of [
    "NO.",
    "OPERATION",
    "POINTS",
    "DATE",
  ]) {
    assert.match(source, new RegExp(tableHeader));
  }

  assert.match(accountRouteSource, /@\/components\/account\/account-center/);
  assert.match(accountRouteSource, /AccountCenter/);
  assert.match(accountRouteSource, /AccountSection/);
  assert.match(accountRouteSource, /GenerationTask/);
  assert.match(accountRouteSource, /PrintOrder/);
  assert.match(accountRouteSource, /getCurrentUserTasks/);
  assert.match(accountRouteSource, /getCurrentUserModels/);
  assert.match(accountRouteSource, /getCurrentUserOrders/);
  assert.match(accountRouteSource, /visibility:\s*normalizeModelVisibility\(model\.visibility\)/);
  assert.match(accountRouteSource, /formatModelVisibility\(model\.visibility\)/);
  assert.match(accountRouteSource, /getMarketingSiteSettings/);
  assert.doesNotMatch(accountRouteSource, /getMarketingSiteData/);
  assert.doesNotMatch(accountRouteSource, /PersonalCenterTest/);
  assert.match(accountRouteSource, /requireUser\("\/account"\)/);
  assert.match(accountRouteSource, /initialSection=\{activeSection\}/);
  assert.match(accountRouteSource, /fullName:/);
  assert.match(accountRouteSource, /phone:/);
  assert.match(accountRouteSource, /bio:/);
  assert.match(accountRouteSource, /profileVisibility:/);
  assert.match(accountRouteSource, /avatarFrameStyles:/);
  assert.match(frontendSessionSource, /frameImageUrl:\s*getMediaUrl\(style\.frameImage\)/);

  assert.match(cssSource, /\.accountShell/);
  assert.match(cssSource, /height:\s*calc\(100svh - 60px\)/);
  assert.match(cssSource, /\.boundTopNavigation/);
  assert.match(cssSource, /\.accountFrame/);
  assert.match(
    cssSource,
    /\.accountFrame\s*\{[^}]*background:\s*transparent/,
  );
  assert.match(
    cssSource,
    /\.accountFrame\s*\{[^}]*--upper-height:\s*calc\(112px - var\(--top-height\) - \(var\(--middle-height\) \/ 2\)\)/,
  );
  assert.match(
    cssSource,
    /\.accountFrame\s*\{[^}]*--lower-height:\s*calc\(100% - var\(--top-height\) - var\(--upper-height\) - var\(--middle-height\) - var\(--bottom-height\)\)/,
  );
  assert.match(
    cssSource,
    /\.accountFrame > :global\(\[class\*="content"\]\)\s*\{[^}]*padding:\s*0 var\(--right-width\) var\(--bottom-height\) var\(--left-width\)/,
  );
  assert.match(
    cssSource,
    /\.accountChrome\s*\{[^}]*background:\s*transparent/,
  );
  assert.match(
    cssSource,
    /\.accountChrome\s*\{[^}]*flex:\s*0 0 112px/,
  );
  assert.match(
    cssSource,
    /\.accountChrome\s*\{[^}]*min-height:\s*112px/,
  );
  assert.match(
    cssSource,
    /\.accountChrome\s*\{[^}]*padding:\s*0/,
  );
  assert.match(
    cssSource,
    /\.accountTitleRow\s*\{[^}]*grid-template-columns:\s*58px 240px minmax\(0, 1fr\)/,
  );
  assert.match(
    cssSource,
    /\.accountTitleRow\s*\{[^}]*height:\s*112px/,
  );
  assert.match(
    cssSource,
    /\.accountTitleRow\s*\{[^}]*padding:\s*22px 0 0/,
  );
  assert.match(
    cssSource,
    /\.accountFrameLogo\s*\{[^}]*top-navigation\/logo\.png/,
  );
  assert.match(
    cssSource,
    /\.accountFrameLogo\s*\{[^}]*margin-left:\s*-4px/,
  );
  assert.match(
    cssSource,
    /\.accountFrameLogo\s*\{[^}]*margin-top:\s*4px/,
  );
  assert.match(
    cssSource,
    /\.accountFrameDivider\s*\{[^}]*margin-top:\s*26px/,
  );
  assert.doesNotMatch(cssSource, /\.accountTitleRow > span/);
  assert.match(
    cssSource,
    /\.accountTitleRow\s*\{[^}]*width:\s*100%/,
  );
  assert.match(
    cssSource,
    /\.accountBody\s*\{[^}]*background:\s*#000000/,
  );
  assert.match(
    cssSource,
    /\.accountBody\s*\{[^}]*display:\s*flex/,
  );
  assert.match(
    cssSource,
    /\.accountBody\s*\{[^}]*overflow:\s*hidden/,
  );
  assert.match(
    cssSource,
    /\.accountContentViewport\s*\{[^}]*flex:\s*1 1 auto/,
  );
  assert.doesNotMatch(
    cssSource,
    /\.accountFrame::before/,
  );
  assert.doesNotMatch(
    cssSource,
    /\[class\*="middle11"\]/,
  );
  assert.doesNotMatch(
    cssSource,
    /\.accountFrame\s*\{[^}]*background:\s*#000000/,
  );
  assert.match(cssSource, /banner-label-bg\.png/);
  assert.match(cssSource, /width:\s*240px/);
  assert.doesNotMatch(cssSource, /linear-gradient\(90deg, #8f5639/);
  assert.match(cssSource, /account-page-locked/);
  assert.match(cssSource, /toggle-bar-dark-alt\.png/);
  assert.match(cssSource, /--account-tab-border/);
  assert.match(
    cssSource,
    /\.secondaryTabs button\s*\{[\s\S]*border:\s*1px solid var\(--account-tab-border\)/,
  );
  assert.match(cssSource, /button-dark-small-normal\.png/);
  assert.match(cssSource, /button-dark-small-hover\.png/);
  assert.match(cssSource, /button-dark-small-pushed\.png/);
  assert.doesNotMatch(cssSource, /button-purple-small-normal\.png/);
  assert.doesNotMatch(cssSource, /button-purple-small-hover\.png/);
  assert.doesNotMatch(cssSource, /button-purple-small-pushed\.png/);
  assert.match(cssSource, /slate-normal\.png/);
  assert.match(cssSource, /slate-hover\.png/);
  assert.match(cssSource, /slate-pressed\.png/);
  assert.match(cssSource, /gold-normal\.png/);
  assert.match(cssSource, /gold-hover\.png/);
  assert.match(cssSource, /gold-pressed\.png/);
  assert.match(cssSource, /account-balance-plate-wide@2x\.png/);
  assert.match(
    cssSource,
    /\.balancePlate\s*\{[^}]*background:\s*url\("\/ui-lab\/account-center\/account-balance-plate-wide@2x\.png"\) left center \/ 100% 100% no-repeat/,
  );
  assert.match(cssSource, /\.balancePlate\s*\{[^}]*width:\s*620px/);
  assert.match(cssSource, /\.balancePlate\s*\{[^}]*max-width:\s*620px/);
  assert.doesNotMatch(cssSource, /\.balancePlate\s*\{[^}]*width:\s*340px/);
  assert.doesNotMatch(cssSource, /cart-subtotal-strip@2x\.png/);
  assert.doesNotMatch(cssSource, /--account-subtotal-strip-reference/);
  assert.doesNotMatch(cssSource, /\.balancePlate::before/);
  assert.doesNotMatch(cssSource, /\.balancePlate::after/);
  assert.doesNotMatch(cssSource, /\.balancePlate img/);
  assert.match(cssSource, /--account-action-border/);
  assert.match(
    cssSource,
    /\.editButton,\s*\.iconButton,\s*\.backgroundEditButton\s*\{[\s\S]*border:\s*1px solid var\(--account-action-border\)/,
  );
  assert.match(
    cssSource,
    /\.editButton::before,\s*\.iconButton::before,\s*\.backgroundEditButton::before\s*\{[\s\S]*content:\s*none/,
  );
  assert.doesNotMatch(cssSource, /background:\s*linear-gradient\(180deg, #ffe2a8/);
  assert.match(cssSource, /\.accountTitleRow/);
  assert.match(cssSource, /\.secondaryTabs/);
  assert.match(cssSource, /\.profilePane/);
  assert.match(cssSource, /\.pointsPane/);
  assert.match(cssSource, /\.recordsPane/);
  assert.match(cssSource, /\.balancePlate/);
  assert.match(cssSource, /\.pointsTable/);
  assert.match(cssSource, /\.recordsTable/);
  assert.match(
    cssSource,
    /\.pointsTable th,\s*\.pointsTable td,\s*\.recordsTable th,\s*\.recordsTable td\s*\{[\s\S]*overflow:\s*hidden/,
  );
  assert.match(
    cssSource,
    /\.pointsTable th,\s*\.pointsTable td,\s*\.recordsTable th,\s*\.recordsTable td\s*\{[\s\S]*text-overflow:\s*ellipsis/,
  );
  assert.match(
    cssSource,
    /\.recordsTable th:nth-child\(1\),\s*\.recordsTable td:nth-child\(1\)\s*\{[\s\S]*width:\s*250px/,
  );
  assert.match(cssSource, /\.recordsHeader/);
  assert.match(cssSource, /\.visibilityToggle/);
  assert.match(cssSource, /\.visibilityPublic/);
  assert.match(cssSource, /\.visibilityHidden/);
  assert.match(cssSource, /\.tableActionButton/);
  assert.match(cssSource, /\.pageIndicator/);
  assert.match(cssSource, /\.pageSizeLabel/);
  assert.doesNotMatch(cssSource, /\.currentPage/);
  assert.doesNotMatch(cssSource, /\.pageSizeButton/);
  assert.doesNotMatch(cssSource, /\.pagination span::before/);
  assert.doesNotMatch(cssSource, /\.pagination button::before/);
  assert.match(
    cssSource,
    /@media \(min-width: 981px\) and \(max-height: 980px\)/,
  );
  assert.match(
    cssSource,
    /@media \(min-width: 981px\) and \(max-height: 980px\)[\s\S]*\.accountChrome\s*\{[\s\S]*flex-basis:\s*112px/,
  );
  assert.match(
    cssSource,
    /@media \(min-width: 981px\) and \(max-height: 980px\)[\s\S]*\.accountChrome\s*\{[\s\S]*min-height:\s*112px/,
  );
  assert.match(
    cssSource,
    /@media \(min-width: 981px\) and \(max-height: 980px\)[\s\S]*\.pointsTable th,\s*\.pointsTable td,\s*\.recordsTable th,\s*\.recordsTable td\s*\{[\s\S]*height:\s*37px/,
  );
  assert.match(
    cssSource,
    /@media \(min-width: 981px\) and \(max-height: 980px\)[\s\S]*\.balancePlate\s*\{[\s\S]*height:\s*88px/,
  );
  assert.match(cssSource, /\.placeholderRow/);
  assert.match(cssSource, /@media \(max-width: 980px\)/);
  assert.doesNotMatch(cssSource, /mediumActionSlot/);
});

test("account route loads restored personal center record sources", () => {
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
  assert.match(accountRouteSource, /const accountSections = \[/);
  assert.match(accountRouteSource, /"profile"/);
  assert.match(accountRouteSource, /"points-history"/);
  assert.match(accountRouteSource, /"orders"/);
  assert.match(accountRouteSource, /"models"/);
  assert.match(accountRouteSource, /"tasks"/);
  assert.match(accountRouteSource, /accountRecordLimit\s*=\s*200/);
  assert.match(accountRouteSource, /accountSummaryLimit\s*=\s*1/);
  assert.match(accountRouteSource, /if \(value === "billing"\) return "points-history"/);
  assert.match(accountRouteSource, /if \(value === "settings" \|\| value === "overview"\) return "profile"/);
  assert.match(
    accountRouteSource,
    /activeSection === "points-history"[\s\S]*\? accountRecordLimit[\s\S]*: accountSummaryLimit/,
  );
  assert.match(
    accountRouteSource,
    /getCurrentUserCreditTransactions\(\{[\s\S]*depth: 0,[\s\S]*limit: billingLimit,[\s\S]*select: accountBillingSelect/,
  );
  assert.match(accountRouteSource, /getCurrentUserTasks\(\{ limit: accountRecordLimit \}\)/);
  assert.match(accountRouteSource, /getCurrentUserModels\(\{ limit: accountRecordLimit \}\)/);
  assert.match(accountRouteSource, /getCurrentUserOrders\(\{ limit: accountRecordLimit \}\)/);
  assert.match(accountRouteSource, /rows:\s*\{[\s\S]*billing:/);
  assert.match(accountRouteSource, /models:\s*models\.docs\.map/);
  assert.match(accountRouteSource, /orders:\s*orders\.docs\.map/);
  assert.match(accountRouteSource, /tasks:\s*tasks\.docs\.map/);
  assert.match(accountRouteSource, /\/model-detail\?id=/);
  assert.match(accountRouteSource, /\/results\/\$\{encodeURIComponent/);
  assert.match(accountRouteSource, /transactionTypeLabels/);
  assert.match(accountRouteSource, /Model Generate/);
  assert.match(frontendSessionSource, /depth\?: number/);
  assert.match(frontendSessionSource, /select\?: Record<string, true>/);
  assert.match(marketingSource, /export async function getMarketingSiteSettings/);
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
