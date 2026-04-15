# é£é©ä¿®å¤å·¥ä½æ¥å¿ï¼2026-04-15ï¼

## å®¡è®¡ç»è®º

### 1. AI ä»»å¡æäº¤é¡ºåºé®é¢
- ç»è®ºï¼**ç¡®è®¤æç«**
- ç­çº§ï¼**P0**
- ç°è±¡ï¼å¤é¨ AI provider ä»»å¡ååå»ºï¼ç§¯åé¢æ£ååçï¼è¥é¢æ£å¤±è´¥ï¼åæ¬å°ä»»å¡åæ»ï¼ä½ç¬¬ä¸æ¹ä»»å¡å·²ååºã
- ä¿®å¤ç®æ ï¼åå®ææ¬å°ä»»å¡åå»ºä¸ç§¯åé¢æ£ï¼ååèµ·å¤é¨ provider ä»»å¡ï¼å¤±è´¥æ¶ä¸åºè°ç¨å¤é¨ä»è´¹æå¡ã

### 2. ç§¯åè´¦æ¬å¹¶åä¸è´æ§
- ç»è®ºï¼**ç¡®è®¤æç«**
- ç­çº§ï¼**P1ï¼æ¥è¿ P0ï¼**
- ç°è±¡ï¼ä½é¢æ´æ°éç¨âæ¥-ç®-åâæ¨¡å¼ï¼ç¼ºå°çæ­£äºå¡/è¡éä¿æ¤ï¼éå¤äºä»¶åå¹¶åè¯·æ±ä¸å¯è½éè´¦ã
- ä¿®å¤ç­ç¥ï¼æ¬è½®åè®°å½ï¼ä¸åæ¿è¿æ¹å¨ï¼åç»­éè¦æ°æ®åºäºå¡æåå­ SQL æ´æ°æ¹æ¡ã

### 3. Shopify / Stripe è¯­ä¹æ··æ
- ç»è®ºï¼**ç¡®è®¤æç«**
- ç­çº§ï¼**P1**
- ç°è±¡ï¼æ°æ®ç»æåå­æ®µå½åä»å¸¦ Shopify è¯­ä¹ï¼ä½çå®æ¯ä»é¾è·¯å¤§éå·²åå° Stripeã
- ä¿®å¤ç­ç¥ï¼æ¬è½®åè®°å½ï¼ä¸ç´æ¥éå½åæ°æ®å±ï¼åç»­åé¢åç»ä¸è¿ç§»ã

### 4. operator è§è²æ æ³è¿å¥ Admin
- ç»è®ºï¼**ç¡®è®¤æç«**
- ç­çº§ï¼**P1**
- ç°è±¡ï¼operator å¨å­æ®µæééè¢«è§ä¸º staffï¼ä½çæ­£ç `canAccessAdmin` åªåè®¸ adminã
- ä¿®å¤ç­ç¥ï¼å¾ä¿®å¤ã

### 5. ä¸è½½æ£è´¹æ¶åºä¸éè¯¯è¿å
- ç»è®ºï¼**é¨åæç«**
- ç­çº§ï¼**P1**
- ç°è±¡ï¼æ§å®ç°ä¸­è¿ç¨èµæºè·åä¸æ£è´¹é¡ºåºä¸çæ³ï¼ä¸éè¯¯è¿åæ··æ·ï¼è¿æå·²é¨åä¼åï¼ä½ä»éè¦æ´æ¸æ°çéè¯¯è¯­ä¹ã
- ä¿®å¤ç­ç¥ï¼åç»­ä¸é¡¹å¤çã

### 6. demo æ®ç
- ç»è®ºï¼**ç¡®è®¤æç«**
- ç­çº§ï¼**P2**
- ç°è±¡ï¼é¡¹ç®å½åä¸åçæ®çä¸ä¸è´ã
- ä¿®å¤ç­ç¥ï¼åç»­ç»ä¸åçä¸ä»åºå½åã

---

## æ¬è½®ä¿®å¤æ­¥éª¤

### Step 1
- ç®æ ï¼ä¿®å¤ P0 ââ AI æäº¤é¡ºåºé®é¢
- ååï¼
  1. ååå»ºæ¬å°ä»»å¡éª¨æ¶
  2. åå®æç§¯åé¢æ£
  3. åè°ç¨å¤é¨ provider
  4. provider åå»ºå¤±è´¥æ¶ï¼ä»»å¡è¿å¥å¤±è´¥ç¶æå¹¶è§¦åéæ¬¾
- å·²å®æï¼
  - `submitAITask` ç°å¨ååå»ºæ¬å°ä»»å¡ï¼åé¢æ£ç§¯åï¼åè°ç¨å¤é¨ providerã
  - provider åå»ºå¤±è´¥æ¶ï¼ä¸åå é¤æ¬å°ä»»å¡ï¼èæ¯å°ä»»å¡æ è®°ä¸ºå¤±è´¥ï¼å¹¶å°è¯éæ¬¾ã

### Step 2
- ç®æ ï¼ä¿®å¤ operator åå°è®¿é®ä¸ä¸è´é®é¢
- å·²å®æï¼
  - `canAccessAdmin` å·²ä»ä»åè®¸ `admin` æ¹ä¸ºåè®¸ `admin / operator`ï¼ä¸ç°æ staff è¯­ä¹ä¿æä¸è´ã

### Step 3
- ç¼è¯ä¸æå»ºéªè¯
- å·²å®æï¼
  - éè¿ `pnpm exec tsc --noEmit`
  - éè¿ `pnpm build`

### Step 4
- ç®æ ï¼ä¿æ Stripe / Shopify åæ¯ä»åç»æï¼ä½æç¡®å½å Stripe çæãShopify é¢çï¼åæ¶å°è®¢éä»·æ ¼äº¤ç»åå°éç½®
- è®¡åï¼
  1. å¨ `site-settings` ä¸­å¢å å¯è¿è¥çè®¢éæ¹æ¡éç½®
  2. è®¢éé¡µä¸ Stripe è®¢éæµç¨ç»ä¸è¯»ååå°æ¹æ¡
  3. å¨åå°éç½®ä¸­å¢å æ¯ä»ééè¯´æï¼é¿ååç»­å¼åè¯¯è§£å½åç¶æ

---

## å¾åç»­ç»§ç»­å¤ç

### A. ç§¯åè´¦æ¬å¹¶åä¸è´æ§
- ä»å¾ä¿®å¤
- éè¦æ°æ®åºäºå¡/åå­æ´æ°ç­ç¥ï¼ä¸è½åªé å¹ç­é®ã

### B. Shopify / Stripe é¢åå½åç»ä¸
- ä»å¾ä¿®å¤
- éè¦è°¨æåæ°æ®ç»æè¿ç§»ã

### C. ä¸è½½æ£è´¹ä¸éè¯¯è¯­ä¹ä¼å
- ä»å¾ä¿®å¤
- éè¦æâé¢è§ / ä¸è½½ / æ£è´¹ / å¤±è´¥åå âè¿ä¸æ­¥ææ¸ã

## 2026-04-15 ²¹³ä¼ÇÂ¼
- ÒÑÐÂÔö `src/lib/paymentProviders.ts`£¬Í³Ò»´Ó `site-settings.paymentProviders` ¶ÁÈ¡¶©ÔÄ/¶©µ¥Ö§¸¶Í¨µÀ¡£
- ÒÑ½«¶©ÔÄ·½°¸¸ÄÎª´Ó `site-settings.subscriptionPlans` ¶¯Ì¬¶ÁÈ¡£¬Ç°Ì¨ pricing Ò³Óë Stripe ¶©ÔÄÁ÷³ÌÊ¹ÓÃÍ¬Ò»·ÝºóÌ¨ÅäÖÃ¡£
- µ±ºóÌ¨°Ñ `subscriptionProvider` »ò `orderProvider` ÇÐ»»Îª `shopify` Ê±£¬ÏÖÓÐ Stripe Á÷³Ì»á·µ»ØÃ÷È·µÄ¡°Ô¤ÁôÎ´ÆôÓÃ¡±ÌáÊ¾£¬±ÜÃâ¼ÌÐøÎó×ß Stripe¡£
- ÒÑÍê³ÉÐ£Ñé£º`pnpm exec tsc --noEmit`¡¢`pnpm build`¡£

## 2026-04-15 ·çÏÕÐÞ¸´²¹³ä£¨¶þ£©
- ÒÑÖØ¹¹ `src/lib/creditLedger.ts`£º»ý·Ö±ä¸üÏÖÔÚ»á·µ»Ø¡°ÊÇ·ñÊµ¼ÊÉúÐ§¡±µÄ½á¹û£¬²¢Í³Ò»Å×³ö `InsufficientCreditsError`£¬±ãÓÚÇ°ºó¶ËÃ÷È·Ê¶±ðÓà¶î²»×ã¡£
- ÒÑ¸ø `credits.user` Ôö¼ÓÎ¨Ò»Ô¼Êø£¬±ÜÃâÍ¬Ò»ÓÃ»§³öÏÖ¶à¸ö»ý·ÖÕË»§£»²¢½«Ä¬ÈÏ»ý·ÖÕË»§´´½¨ hook ¸ÄÎª¸´ÓÃÕË±¾ÄÜÁ¦¡£
- ÒÑÐÞÕýÏÂÔØ¿Û·ÑÊ±Ðò£ºÏÈ×öÈ¨ÏÞ/¸ñÊ½¼ì²é£¬ÔÙÖ´ÐÐ¿Û·Ñ£¬×îºóÀ­È¡Ô¶³Ì×ÊÔ´£»ÈôÔ¶³Ì×ÊÔ´»ñÈ¡Ê§°Ü£¬»á×Ô¶¯Ö´ÐÐÏÂÔØÍË¿î¡£
- ÒÑÐÞÕý´íÎóÓïÒå£ºAI Ìá½»Ê±»ý·Ö²»×ã·µ»Ø 402£»Ä£ÐÍÏÂÔØÊ±»ý·Ö²»×ã·µ»Ø 402£¬×ÊÔ´À­È¡Ê§°Ü·µ»Ø 502£¬²»ÔÙÍ³Ò»Î±×°³É 404¡£
- ÒÑÍê³ÉÐ£Ñé£º`pnpm run generate:types`¡¢`pnpm payload generate:db-schema`¡¢`pnpm exec tsc --noEmit`¡¢`pnpm build`¡£

## 2026-04-15 ·çÏÕÐÞ¸´²¹³ä£¨Èý£©
- ÒÑÐÂÔö `src/lib/paymentRecords.ts`£¬×÷ÎªÖÐÐÔÖ§¸¶ÓïÒå²ã£¬Í³Ò»¶ÁÈ¡Ö§¸¶Á´½Ó¡¢»á»°ºÅÓë¶©µ¥²Î¿¼ºÅ£¬±ÜÃâÔÚÇ°Ì¨ºÍ½Ó¿Ú²ã¼ÌÐøÖ±½Ó±©Â¶ `shopify*` ÃüÃû¡£
- ÒÑµ÷Õû `ShopifyPayments` Óë `PrintOrders` µÄºóÌ¨±êÇ©¡¢ÃèÊöÓë×Ö¶ÎËµÃ÷£º±£ÁôÀúÊ·×Ö¶ÎÃû¼æÈÝ£¬µ«ºóÌ¨Õ¹Ê¾¸ÄÎªÖÐÐÔÖ§¸¶ÓïÒå£¬²¢Ã÷È·µ±Ç° Stripe ÉúÐ§¡¢Shopify Îª¼æÈÝ±£Áô¡£
- ÒÑÐÞÕý¶©µ¥Ïà¹ØÇ°Ì¨Óë½Ó¿ÚÎÄ°¸£ºÓÃ»§²àÍ³Ò»Ê¹ÓÃ¡°Ö§¸¶»á»° / Ö§¸¶Á´½Ó / ¶©µ¥²Î¿¼¡±±í´ï£¬²»ÔÙÖ±½Ó³öÏÖ Shopify ×Ö¶ÎÓïÒå¡£
- ÒÑÐÂÔöÇ¨ÒÆËµÃ÷ÎÄµµ£º`docs/PAYMENT_DOMAIN_MIGRATION_PLAN_2026-04-15.md`£¬ËµÃ÷ÎªºÎµ±Ç°½×¶Î²ÉÓÃÎÞËðÊÕ¿Ú£¬ÒÔ¼°ºóÐøÕýÊ½Êý¾ÝÇ¨ÒÆµÄ½¨ÒéÂ·¾¶¡£
- ÒÑÍê³ÉÐ£Ñé£º`pnpm exec tsc --noEmit`¡¢`pnpm build`¡£

## 2026-04-15 ·çÏÕÐÞ¸´²¹³ä£¨ËÄ£©
- ÒÑÐÂÔöÉÏÏßÇ°Éó¼ÆÇåµ¥£º`docs/PRODUCTION_LAUNCH_AUDIT_CHECKLIST_2026-04-15.md`¡£
- ÒÑÐÂÔö²¿Êð×¼±¸ÎÄµµ£º`docs/PRODUCTION_DEPLOYMENT_PREP_2026-04-15.md`¡£
- ÎÄµµÒÑ¸²¸Ç£ºÉú²ú»·¾³±äÁ¿¡¢Ö§¸¶/ÓÊ¼þ/AI/S3 ¼ì²éÏî¡¢ÉÏÏß×è¶ÏÏî¡¢Ã°ÑÌ²âÊÔÓë·¢²¼½¨Òé¡£

## 2026-04-16 Task 1: secret-hardening
- Removed all runtime secret reads from `ai-provider-settings` global.
- `AI webhook secret`, `Meshy API key`, `S3 access key ID`, and `S3 secret access key` now resolve from environment variables only.
- Kept non-sensitive metadata in Payload global so product behavior and operator-facing runtime metadata remain intact.
- Tightened AI provider settings global access to admin-only because the page still contains sensitive infrastructure metadata.
- Validation passed: `pnpm run generate:types`, `pnpm payload generate:db-schema`, `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 2: canonical-origin
- Added `src/lib/getCanonicalAppURL.ts` as the single trusted app URL resolver.
- Replaced per-request origin/host/header URL assembly in Stripe billing, print-order checkout, and Meshy media URL generation.
- Scope intentionally limited to URL source replacement only, so checkout parameters and existing flow behavior remain unchanged.
- Validation passed: `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 3: signed-ai-webhook
- Added `src/lib/webhookSignature.ts` with HMAC-SHA256 verification, timestamp validation, replay cache, and timing-safe signature comparison.
- Kept the webhook endpoint path unchanged while moving AI webhook auth away from plain shared-secret string comparison.
- Added explicit response handling for replay detection (`409`) and verification failure (`401`).
- Validation passed: `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 4: remote-asset-allowlist
- Added `src/lib/remoteAssetSecurity.ts` to centralize remote asset host allowlist decisions.
- Download endpoint now rejects non-allowlisted remote asset sources before server-side fetch.
- Result-model creation now drops disallowed remote model URLs before they can flow into model format records.
- Validation passed: `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 5: ledger-db-compat
- Added `src/lib/ledgerStore.ts` as a minimal DB-compatible transaction layer for ledger mutations.
- Ledger mutations now route through sqlite/libsql interactive transactions or postgres pooled transactions, without changing the external credit ledger API.
- Kept mutation semantics stable while removing the direct SQLite-only `BEGIN IMMEDIATE` dependency from the main ledger logic.
- Validation passed: `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 6: s3-download-fix
- Fixed `src/lib/s3SignedURL.ts` so CDN/baseURL matches no longer return a relative object key.
- The helper now either returns the original accessible URL or a proper signed S3 URL derived from the resolved object key.
- This keeps download callers on a stable contract: fetchable URL in, fetchable URL out.
- Validation passed: `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 7: order-validation
- Removed demo fallback shipping data from print-order creation.
- Added required shipping field validation and explicit printability / ownership checks before entering the payment flow.
- Added `paymentStatus` to print orders so payment state and fulfillment state no longer fully share one field.
- Validation passed: `pnpm run generate:types`, `pnpm payload generate:db-schema`, `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Task 8: test-foundation
- Added a lightweight Node test foundation instead of introducing a heavier external framework.
- Added unit coverage for webhook signing, canonical app URL resolution, remote asset allowlist, S3/CDN media URL resolution, and credit ledger idempotent mutations.
- Added `scripts/run-unit-tests.mjs` plus a small alias loader so tests can execute TypeScript modules with the existing `@/` path alias safely.
- Validation passed: `pnpm test:unit`, `pnpm exec tsc --noEmit`, `pnpm build`.

## 2026-04-16 Config hardening follow-up
- Added startup environment guards for PAYLOAD_SECRET and production SMTP verification safety.
- Moved allowed dev origins to env-driven configuration with a safe development fallback.
- Tightened media uploads by removing application/octet-stream and adding a 64 MB upload size limit.
- Removed the example my-route endpoint.
- Migration note: set ALLOWED_DEV_ORIGINS in non-local environments if custom dev origins are required.
