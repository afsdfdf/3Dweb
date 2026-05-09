# Thorns Tavern 椤圭洰浣跨敤璇存槑涔?

鐗堟湰锛?026-05-07  
椤圭洰璺緞锛歚D:\web\payload-local-demo`

## 1. 璇存槑涔︾敤閫?

鏈枃闈㈠悜椤圭洰鎵€鏈夎€呫€佽繍钀ヤ汉鍛樺拰寮€鍙戜汉鍛橈紝鐢ㄦ潵蹇€熺悊瑙ｅ綋鍓嶉」鐩兘鍋氫粈涔堛€佹瘡涓〉闈㈠湪鍝噷銆佸悗鍙板唴瀹逛粠鍝噷绠＄悊銆佸父瑙佸姛鑳芥€庝箞楠岃瘉銆?

褰撳墠椤圭洰鏄竴涓熀浜?Next.js + Payload CMS + PostgreSQL/Supabase Storage 鐨?3D/AI 璧勪骇骞冲彴锛屼富瑕佸寘鍚細

- 鍏紑瀹樼綉鍜岃惀閿€椤甸潰銆?
- 鍏紑妯″瀷灞曠ず銆佹ā鍨嬪寘灞曠ず銆佹ā鍨嬭鎯呭拰妯″瀷棰勮銆?
- Workbench 宸ヤ綔鍙帮紝鐢ㄤ簬 AI 鍥剧墖鐢熸垚銆?D 妯″瀷鐢熸垚銆佷换鍔¤疆璇㈠拰妯″瀷鏌ョ湅銆?
- 璐︽埛涓績锛岀敤浜庤祫鏂欍€佸ご鍍忋€佹í骞呫€佺Н鍒嗐€佽鍗曘€佹ā鍨嬨€佷换鍔″拰璁㈤槄淇℃伅銆?
- Payload Admin 鍚庡彴锛岀敤浜庣鐞嗙敤鎴枫€佸獟浣撱€佹ā鍨嬨€佹ā鍨嬪寘銆侀椤靛唴瀹广€丄I 璁剧疆銆佸瓨鍌ㄨ缃€佽璐瑰拰杩愯惀鏁版嵁銆?

## 2. 鏈湴鍚姩

椤圭洰鏍圭洰褰曪細

```bash
cd D:\web\payload-local-demo
```

鎺ㄨ崘鍚姩锛?

```bash
pnpm dev
```

濡傛灉褰撳墠缁堢鎵句笉鍒?`pnpm`锛屽彲浠ヤ娇鐢ㄩ」鐩噷鐨勬湰鍦颁簩杩涘埗鍛戒护杩涜楠岃瘉锛屼緥濡傦細

```bash
D:\web\payload-local-demo\node_modules\.bin\tsc.CMD --noEmit
```

甯哥敤鍦板潃锛?

| 鍔熻兘 | 鍦板潃 |
|---|---|
| 鍏紑缃戠珯棣栭〉 | `http://127.0.0.1:3000/` |
| 鏈湴椤甸潰瀵艰埅 | `http://127.0.0.1:3000/test` |
| Workbench 宸ヤ綔鍙?| `http://127.0.0.1:3000/workbench` |
| 璐︽埛涓績 | `http://127.0.0.1:3000/account` |
| Payload 鍚庡彴 | `http://127.0.0.1:3000/admin` |
| 妯″瀷灞曠ず鍒楄〃 | `http://127.0.0.1:3000/showcase` |
| 妯″瀷鍖呭垪琛?| `http://127.0.0.1:3000/bundles` |
| 浠锋牸椤?| `http://127.0.0.1:3000/pricing` |

## 3. 鐢ㄦ埛瑙掕壊

| 瑙掕壊 | 涓昏鏉冮檺 |
|---|---|
| 娓稿 | 娴忚鍏紑棣栭〉銆佽惀閿€椤点€佸叕寮€妯″瀷銆佸叕寮€妯″瀷鍖咃紱鍙互杩涘叆 Workbench 鐪嬬晫闈紝浣嗕笉鑳芥彁浜ょ敓鎴愪换鍔°€?|
| customer | 鐧诲綍鍚庝娇鐢?Workbench 鐢熸垚銆佹煡鐪嬭嚜宸辩殑浠诲姟銆佹ā鍨嬨€佺Н鍒嗗拰璐︽埛璧勬枡銆?|
| operator | 鍙繘鍏?Payload Admin 杩涜杩愯惀鍐呭鍜岄儴鍒嗗钩鍙版暟鎹鐞嗐€?|
| admin | 鍙繘鍏?Payload Admin 骞舵嫢鏈夋渶楂樺悗鍙扮鐞嗘潈闄愩€?|

閲嶈鍘熷垯锛?

- 鍏紑棰勮涓嶇瓑浜庡悗鍙版潈闄愩€?
- Workbench 鏄€滃彲鍖垮悕璁块棶鐣岄潰銆佺櫥褰曞悗鎵ц鍔ㄤ綔鈥濈殑宸ヤ綔鍙般€?
- 璐︽埛涓績鏄寮忎釜浜轰腑蹇冿紝涓嶅啀浣跨敤鏃х殑 `/dashboard`銆乣/personal-center-test` 鎴?`/personal-center-legacy` 椤甸潰銆?

## 4. `/test` 鏈湴瀵艰埅椤?

`/test` 鐜板湪鏄交閲忛〉闈㈠鑸紝涓嶅啀鎵挎媴澶嶆潅 UI 棰勮鎴?API 璋冭瘯銆?

鐢ㄩ€旓細

- 鏌ョ湅褰撳墠椤圭洰鏈夊摢浜涙寮忛〉闈€佸姩鎬侀〉闈€佹湰鍦伴〉闈㈠拰 Payload 椤甸潰銆?
- 姣忎釜椤甸潰鏈変竴琛岀畝浠嬶紝鏂逛究鍒ゆ柇椤甸潰鏄惁鏈夌敤銆?
- 寮€鍙戠幆澧冨彲璁块棶銆?
- 鐢熶骇鐜浼氳繑鍥?`notFound()`锛屼笉浼氭毚闇蹭负姝ｅ紡鐢ㄦ埛椤甸潰銆?

濡傛灉瑕佸揩閫熺洏鐐归〉闈紝璇峰厛鎵撳紑锛?

```text
http://127.0.0.1:3000/test
```

## 5. 鍏紑缃戠珯椤甸潰

### 棣栭〉 `/`

鐢ㄩ€旓細

- 灞曠ず鍝佺墝銆佺簿閫夋ā鍨嬨€佹ā鍨嬪寘銆佺伒鎰熺綉鏍煎拰鍏紑妯″瀷鍏ュ彛銆?

涓昏鏁版嵁鏉ユ簮锛?

- `homepage-content`
- `homepage-items`
- 鍏紑 `models`
- 鍏紑鎴栭瑙堢敤閫旂殑 `media`
- 鍏紑 `model-bundles`

杩愯惀鏂瑰紡锛?

- 鍚庡彴杩涘叆 Payload Admin銆?
- 绠＄悊 `Homepage Items` 鏉ユ帶鍒堕椤甸噸澶嶅崱鐗囥€佸窘鏍囥€佹寜閽€佸叧鑱旀ā鍨嬫垨妯″瀷鍖呫€?
- 绠＄悊 `Homepage Content` 鏉ユ帶鍒堕椤靛尯鍧楁枃妗堛€?

### 鍔熻兘椤?`/features`

鐢ㄩ€旓細

- 浠嬬粛鐢熸垚銆佽祫浜х鐞嗐€佹ā鍨嬮瑙堝拰浜や粯鑳藉姏銆?

褰撳墠鐘舵€侊細

- 姝ｅ紡鍏紑钀ラ攢椤点€?

### 鏂规椤?`/solutions`

鐢ㄩ€旓細

- 闈㈠悜鍒涗綔鑰呫€佸伐浣滃鍜屽搧鐗屾柟灞曠ず浣跨敤鍦烘櫙銆?

褰撳墠鐘舵€侊細

- 姝ｅ紡鍏紑钀ラ攢椤点€?

### 璧勬簮椤?`/resources`

鐢ㄩ€旓細

- 璇存槑璧勬簮銆佹ā鍨嬩氦浠樸€佽祫浜т娇鐢ㄦ柟寮忓拰浜у搧鏁欒偛鍐呭銆?

褰撳墠鐘舵€侊細

- 姝ｅ紡鍏紑钀ラ攢椤点€?

### 寮€鍙戣€呴〉 `/developers`

鐢ㄩ€旓細

- 灞曠ず骞冲彴杈圭晫銆丄PI 鏂瑰悜鍜屽紑鍙戣€呬俊鎭€?

褰撳墠鐘舵€侊細

- 姝ｅ紡鍏紑钀ラ攢椤点€?

### 鍏充簬椤?`/about`

鐢ㄩ€旓細

- 灞曠ず浜у搧鑳屾櫙鍜屾柟鍚戙€?

### 鑱旂郴椤?`/contact`

鐢ㄩ€旓細

- 鎻愪緵鑱旂郴鍜屾敮鎸佸叆鍙ｃ€?

### 鏀跨瓥椤甸潰

| 椤甸潰 | 鍦板潃 |
|---|---|
| 闅愮鏀跨瓥 | `/privacy-policy` |
| 閫€娆炬斂绛?| `/refund-policy` |
| 杩愯緭鏀跨瓥 | `/shipping-policy` |

## 6. 妯″瀷灞曠ず鍜屾ā鍨嬭鎯?

### 妯″瀷灞曠ず鍒楄〃 `/showcase`

鐢ㄩ€旓細

- 灞曠ず鍏紑妯″瀷鍒楄〃銆?

鏁版嵁鏉ユ簮锛?

- `models`
- `models.previewImage`
- `media`

鏈瀹¤淇锛?

- 褰撴湰鍦版暟鎹簱璇诲彇瓒呮椂鎴栧け璐ユ椂锛岄〉闈細鏄剧ず绌虹姸鎬侊紝涓嶅啀鐩存帴鍙樻垚鍏紑 500 椤甸潰銆?

### 妯″瀷璇︽儏 `/model-detail?id=<modelId>`

鐢ㄩ€旓細

- 鎵撳紑鏌愪釜鍏紑妯″瀷鐨?3D 棰勮銆佷綔鑰呬俊鎭拰鐩稿叧妯″瀷銆?

鍏抽敭瑙勫垯锛?

- 妯″瀷棰勮閫氳繃 `/api/platform/models/:modelId/viewer?format=glb`銆?
- 娴忚鍣ㄤ笉搴旇鐩存帴鎷垮埌鏈巿鏉冪殑绉佹湁妯″瀷鏂囦欢銆?
- 浣滆€呭ご鍍忔垨妯箙鍙湁鍦ㄥ獟浣撴槸鍙叕寮€璁块棶鏃舵墠鏄剧ず銆?

褰撳墠闇€瑕佷綘鍚庣画鍐崇瓥鐨勫ぇ闂锛?

- 缂哄皯鎴栭敊璇殑 `id` 鐩墠浠嶅彲鑳借繘鍏ラ潤鎬佹紨绀哄洖閫€銆傚缓璁悗缁喅瀹氭敼鎴?`notFound()` 鎴栬烦鍥?`/showcase`銆?

## 7. 妯″瀷鍖?

### 妯″瀷鍖呭垪琛?`/bundles`

鐢ㄩ€旓細

- 灞曠ず宸插彂甯冦€佸彲瑙佺殑妯″瀷鍖呫€?

鏁版嵁鏉ユ簮锛?

- `model-bundles`
- 鍏紑 `models`
- 鍏紑鎴栭瑙堢敤閫旂殑灏侀潰 `media`

### 妯″瀷鍖呰鎯?`/bundles/[slug]`

鐢ㄩ€旓細

- 灞曠ず妯″瀷鍖呮爣棰樸€佸壇鏍囬銆佸皝闈€佹憳瑕併€佹爣绛俱€佹妧鏈鏍笺€佽鍙€丆TA銆佸彂甯冭鏄庡拰鍖呭惈鐨勫叕寮€妯″瀷銆?

閲嶈瑙勫垯锛?

- 鍙樉绀哄凡鍙戝竷涓斿彲瑙佺殑妯″瀷鍖呫€?
- 鍙寘鍚?`visibility = public` 鐨勬ā鍨嬨€?
- 妯″瀷鍖呭皝闈㈠繀椤绘槸娓稿鍙濯掍綋銆?
- 褰撳墠闃舵妯″瀷鍖呬环鏍?CTA 鏄睍绀哄瓧娈碉紝涓嶄唬琛ㄥ凡缁忓畬鎴愯喘涔般€佹巿鏉冩垨鏉冪泭鍙戞斁銆?

## 8. Workbench 宸ヤ綔鍙?

### 鍏ュ彛 `/workbench`

鐢ㄩ€旓細

- AI 鍥剧墖鐢熸垚銆?
- 3D 妯″瀷鐢熸垚銆?
- 涓婁紶鍙傝€冨浘銆?
- 鏌ョ湅褰撳墠鐢ㄦ埛妯″瀷搴撱€?
- 杞鐢熸垚浠诲姟鐘舵€併€?

娓稿琛屼负锛?

- 娓稿鍙互鎵撳紑 Workbench 椤甸潰銆?
- 鐐瑰嚮鐪熸鐢熸垚鍔ㄤ綔鏃堕渶瑕佺櫥褰曘€?

鐧诲綍鐢ㄦ埛琛屼负锛?

- 鍙互鎻愪氦鍥剧墖鐢熸垚鎴?3D 鐢熸垚浠诲姟銆?
- 鍙互鏌ョ湅鑷繁鐨勬ā鍨嬪拰鍥剧墖璧勪骇銆?
- 鍙互缁х画鏈畬鎴愮殑鍚庡彴浠诲姟銆?

### 3D 鐢熸垚

鍏稿瀷娴佺▼锛?

1. 鐢ㄦ埛杈撳叆鎻愮ず璇嶆垨閫夋嫨鍙傝€冨浘鐗囥€?
2. 鍓嶇鎻愪氦鍒?`/api/studio/ai/tasks`銆?
3. 鍚庣妫€鏌ョН鍒嗐€?
4. 鍒涘缓 `generation-tasks`銆?
5. 璋冪敤 Meshy/Tripo 绛夊悗绔厤缃殑 3D provider銆?
6. 鍓嶇杞 `/api/studio/ai/tasks/:taskId/sync`銆?
7. 鎴愬姛鍚庣敓鎴?`models` 鍜?`models_formats`锛屽苟閫氳繃 viewer endpoint 棰勮銆?

娉ㄦ剰锛?

- 榛樿鐢熸垚浠锋牸褰撳墠鎸夊悗鍙伴厤缃墽琛岋紝鍘嗗彶榛樿鍊兼槸 20 credits銆?
- 绉垎涓嶈冻搴旇杩斿洖 `402`锛屼笉搴斿垱寤烘棤鏁堜换鍔°€?
- 浠诲姟澶辫触鏃跺簲鏄剧ず `failureReason`锛屼笉鑳借鐢ㄦ埛鐪嬪埌闈欓粯鐨?100% pending 鐘舵€併€?

### 鍥剧墖鐢熸垚

鍏稿瀷娴佺▼锛?

1. 鐢ㄦ埛杈撳叆鎻愮ず璇嶏紝鍙€変竴寮犲弬鑰冨浘銆?
2. 鍓嶇鎻愪氦鍒?`/api/studio/ai/images`銆?
3. 鍚庣鍒涘缓 `taskType = image-generation` 鐨勪换鍔°€?
4. 鍚庡彴 provider 鎵ц鐢熸垚銆?
5. 鍓嶇杞鍥剧墖 sync endpoint銆?
6. 鎴愬姛鍚庣敓鎴愮鏈?`media` 鍥剧墖璧勪骇銆?

娉ㄦ剰锛?

- 鍥剧墖鐢熸垚鍜?3D 妯″瀷鐢熸垚鏄袱绉嶄笉鍚屼换鍔°€?
- 鍥剧墖鐢熸垚缁撴灉鏄鏈夎祫浜э紝涓嶈嚜鍔ㄥ彉鎴愬叕寮€妯″瀷銆?
- 鍥剧墖鐢熸垚鏈€澶氫娇鐢ㄤ竴寮犲弬鑰冨浘锛涘鍥炬槸 3D 鐢熸垚鍦烘櫙銆?

### 鍘嗗彶璁板綍 `/workbench/history`

鐢ㄩ€旓細

- 鐧诲綍鐢ㄦ埛鏌ョ湅鑷繁鐨?Workbench 浠诲姟鍘嗗彶銆?

褰撳墠鐘舵€侊細

- 鍙椾繚鎶ら〉闈€?

### Workbench model detail compatibility route `/workbench/models/[id]`

Status:

- This route now redirects to `/model-detail?id=<id>`.
- Account and Workbench history model detail links should target `/model-detail?id=<id>` directly.
- Do not rebuild a separate Workbench-owned detail UI unless a future product requirement clearly differs from the canonical model detail page.

## 9. 缁撴灉椤?`/results/[taskCode]`

鐢ㄩ€旓細

- 鏍规嵁浠诲姟浠ｇ爜灞曠ず鐢熸垚缁撴灉銆?

鏈瀹¤淇锛?

- 杩涘害鏉￠檺鍒跺湪 0 鍒?100锛岄伩鍏嶆孩鍑恒€?
- 涓嬭浇鎸夐挳鏍规嵁鐪熷疄瀛樺湪鐨勬ā鍨嬫牸寮忔覆鏌擄紝涓嶅啀鍥哄畾鍋囪涓€绉嶆牸寮忋€?

## 10. 鐧诲綍銆佹敞鍐屽拰瀵嗙爜鎭㈠

### 鐧诲綍 `/login`

鐢ㄩ€旓細

- 杩涘叆鍏变韩鐧诲綍鍗＄墖鎴栫櫥褰曞脊绐楁祦绋嬨€?

### 娉ㄥ唽 `/register`

鐢ㄩ€旓細

- 杩涘叆鍏变韩娉ㄥ唽娴佺▼銆?

褰撳墠娉ㄥ唽鏀寔锛?

- 閭楠岃瘉鐮佹ā寮忋€?
- 閭閾炬帴楠岃瘉鍏煎妯″紡銆?

### 蹇樿瀵嗙爜 `/forgot-password`

鐢ㄩ€旓細

- 鍙戣捣瀵嗙爜鎭㈠閭欢娴佺▼銆?

### 閲嶇疆瀵嗙爜 `/reset-password`

鐢ㄩ€旓細

- 閫氳繃鍏变韩 `AuthFlowCard` 鐨?reset 妯″紡鎻愪氦鏂板瘑鐮併€?

閲嶈瑙勫垯锛?

- 褰撳墠閲嶇疆瀵嗙爜鎻愪氦鍒?`/api/account/auth/reset-password`銆?
- 涓嶇洿鎺ヤ娇鐢?Payload 鍘熷 `/api/users/reset-password` 浣滀负鍓嶇姝ｅ紡鍏ュ彛銆?

## 11. 璐︽埛涓績 `/account`

鐢ㄩ€旓細

- 姝ｅ紡涓汉涓績銆?
- 鐧诲綍鍚庤闂€?

鍖呭惈鍔熻兘锛?

- 鏌ョ湅鍜岀紪杈戝熀纭€璧勬枡銆?
- 鏌ョ湅澶村儚鍜屼釜浜烘í骞呫€?
- 涓婁紶澶村儚鍜?profile banner銆?
- 淇敼瀵嗙爜銆?
- 鏌ョ湅绉垎浣欓鍜屼氦鏄撹褰曘€?
- 鏌ョ湅浠诲姟銆佹ā鍨嬨€佽鍗曘€佽闃呭拰璐﹀崟鐩稿叧淇℃伅銆?

鍚庣鏉ユ簮锛?

- 褰撳墠鐢ㄦ埛璇诲彇璧?server-side helper銆?
- 璧勬枡鎺ュ彛锛歚/api/account/profile`銆?
- 瀵嗙爜鎺ュ彛锛歚/api/account/password`銆?
- 涓婁紶鍏ュ彛锛歚/api/account/profile-media/upload-url`銆?
- 涓婁紶瀹屾垚锛歚/api/account/profile-media/complete`銆?

澶村儚鍜屾í骞呬笂浼犳祦绋嬶細

1. 鍓嶇璇锋眰 signed upload URL銆?
2. 娴忚鍣ㄦ妸鏂囦欢涓婁紶鍒?Supabase Storage銆?
3. 鍓嶇璋冪敤 complete 鎺ュ彛銆?
4. 鍚庣纭 owner/path 鍚庢洿鏂?`media`銆?
5. 鍓嶇璋冪敤 profile 鎺ュ彛鎶婂ご鍍忔垨妯箙鍏宠仈鍒扮敤鎴枫€?

閲嶈瑙勫垯锛?

- 涓嶈鍏堝垱寤?Payload 鏈湴涓婁紶鏂囦欢璁板綍鍐嶄笂浼犲璞★紱褰撳墠 runtime 鏄?Supabase Storage銆?
- 鍏紑灞曠ず澶村儚/妯箙鏃讹紝蹇呴』纭濯掍綋鏄父瀹㈠彲璇荤殑銆?

## 12. Payload Admin 鍚庡彴

鍦板潃锛?

```text
http://127.0.0.1:3000/admin
```

闇€瑕佽鑹诧細

- `admin`
- `operator`

涓昏绠＄悊鍖哄煙锛?

| 鍚庡彴鍖哄煙 | 鐢ㄩ€?|
|---|---|
| Users | 鐢ㄦ埛銆佽鑹层€佽祫鏂欍€佺Н鍒嗛暅鍍忋€佺ぞ浜よ鏁般€?|
| Media | 鍥剧墖銆佹ā鍨嬫枃浠躲€侀瑙堝浘銆佹枃妗ｅ拰璧勪骇銆?|
| Models | 鍏紑/绉佹湁 3D 妯″瀷璁板綍銆侀瑙堝浘銆佹牸寮忔枃浠躲€佹爣绛惧拰璁℃暟銆?|
| Model Bundles | 妯″瀷鍖呫€佸皝闈€丆TA銆佽鏍笺€佸彂甯冭鏄庡拰鍖呭惈妯″瀷銆?|
| Homepage Items | 棣栭〉閲嶅鍗＄墖銆佸窘鏍囥€佹寜閽€佸叧鑱旀ā鍨?妯″瀷鍖呫€?|
| Homepage Content | 棣栭〉鍖哄潡绾у唴瀹广€?|
| Generation Tasks | AI 鐢熸垚浠诲姟鐘舵€併€乸rovider 鐘舵€併€佺粨鏋滄ā鍨嬨€?|
| Task Events | 鐢熸垚浠诲姟鏃堕棿绾垮拰鎿嶄綔鏃ュ織銆?|
| Credits / Credit Transactions | 绉垎璐︽埛鍜岀Н鍒嗘祦姘淬€?|
| Credit Products | 鍙喘涔扮Н鍒嗗寘銆?|
| Billing Subscriptions | 璁㈤槄鐘舵€併€?|
| Addresses / Print Orders | 鍦板潃鍜屾墦鍗拌鍗曘€?|
| Site Settings | 绔欑偣璁剧疆銆佽闂瓥鐣ャ€侀偖绠遍厤缃瓑銆?|
| AI Provider Settings | Meshy銆丟emini銆丱penAI-compatible 绛?provider 璁剧疆銆?|
| Storage Settings | Supabase Storage 鐩稿叧杩愯璁剧疆銆?|
| Security Settings | 娉ㄥ唽楠岃瘉銆佸畨鍏ㄧ瓥鐣ャ€?|
| Runtime Deployment Settings | 杩愯鐜灞曠ず鍜岄儴缃叉鏌ャ€?|

## 13. API 杈圭晫

椤圭洰鑷畾涔?API 搴斾紭鍏堜娇鐢ㄤ互涓嬪懡鍚嶇┖闂达細

| 鍛藉悕绌洪棿 | 鐢ㄩ€?|
|---|---|
| `/api/studio/...` | Workbench銆丄I 鐢熸垚銆佷换鍔″悓姝ャ€?|
| `/api/platform/...` | 妯″瀷棰勮銆佷笅杞姐€佸钩鍙扮骇鍏紑鑳藉姏銆?|
| `/api/account/...` | 褰撳墠鐢ㄦ埛璧勬枡銆佽璇併€佽处鎴锋暟鎹€?|
| `/api/billing/...` | 绉垎璐拱銆佽闃呭拰缁撹处銆?|
| `/api/commerce/...` | 璁㈠崟鍜屽晢鍔℃祦绋嬨€?|
| `/api/social/...` | 璇勮銆佺偣璧炪€佹敹钘忋€佸叧娉ㄣ€佹祻瑙堢瓑绀句氦琛屼负銆?|

涓嶈鏂板鑷畾涔?Next route 鍒?`/api/<collection-slug>`锛屽洜涓鸿繖浜涜矾寰勫睘浜?Payload REST銆?

## 14. 濯掍綋鍜屽瓨鍌ㄨ鍒?

褰撳墠 runtime 鏂瑰悜锛?

- PostgreSQL 鏁版嵁搴撱€?
- Supabase Storage 濯掍綋鍜屾ā鍨嬫枃浠躲€?
- 涓嶆仮澶?AWS S3 runtime media銆?
- 涓嶆仮澶?SQLite runtime fallback銆?

娓稿鍙濯掍綋鏉′欢锛?

- `purpose = preview`
- 鎴?`publicAccess = true`

绉佹湁鐢熸垚璧勪骇锛?

- 閫氬父涓?`purpose = asset` 鎴?`purpose = model`銆?
- 涓嶅簲璇ョ洿鎺ユ毚闇茬粰娓稿銆?

## 15. 绉垎銆佷笅杞藉拰璁¤垂

褰撳墠浜у搧鍐崇瓥锛?

- 褰撳墠瀵煎叆鐨勫叕寮€妯″瀷棰勮鍜屼笅杞戒笉闇€瑕佹墸绉垎銆?
- 鏈潵棰勮绉垎鍜屼笅杞界Н鍒嗗簲璇ョ敱鍚庡彴璁剧疆鍒嗗埆鎺у埗銆?
- 涓嬭浇濡傛灉鍚敤鎵ｈ垂锛屽繀椤诲湪鍚庣鎵ц锛屽け璐ユ椂瑕佽嚜鍔ㄩ€€娆俱€?

涓昏鏁版嵁锛?

- `credits`
- `credit-transactions`
- `credit-products`
- `billing-subscriptions`
- `shopify-payments`

涓昏娉ㄦ剰浜嬮」锛?

- 鎵€鏈夌Н鍒嗗彉鍔ㄨ璧?ledger 鏈嶅姟銆?
- Stripe webhook 蹇呴』淇濇寔绛惧悕楠岃瘉鍜屽箓绛夊鐞嗐€?
- 涓嶈鍦ㄥ墠绔喅瀹氭槸鍚︽墸绉垎銆?

## 16. 甯哥敤楠岃瘉鍛戒护

婧愮爜璇█妫€鏌ワ細

```bash
node scripts/audit-source-language.mjs
```

TypeScript锛?

```bash
D:\web\payload-local-demo\node_modules\.bin\tsc.CMD --noEmit
```

鍗曞厓娴嬭瘯锛?

```bash
node scripts/run-unit-tests.mjs
```

Smoke test锛?

```bash
node scripts/smoke-test.mjs
```

Payload 绫诲瀷鐢熸垚锛?

```bash
D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:types
```

Payload 鏁版嵁搴?schema 蹇収锛?

```bash
D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:db-schema
```

Payload admin import map锛?

```bash
D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:importmap
```

浠€涔堟椂鍊欏繀椤昏繍琛岀敓鎴愬懡浠わ細

- 淇敼 collection/global/schema 鍚庤繍琛?`generate:types` 鍜?`generate:db-schema`銆?
- 淇敼 Payload admin component path 鍚庤繍琛?`generate:importmap`銆?
- 淇敼鏉冮檺銆乭ook銆乪ndpoint 鍚庤嚦灏戣繍琛?TypeScript 鍜岀浉鍏虫祴璇曘€?

## 17. 鏈瀹¤宸蹭慨澶嶇殑灏忛棶棰?

2026-05-07 瀹¤涓凡缁忓畬鎴愶細

- `/test` 鏀规垚杞婚噺椤甸潰瀵艰埅銆?
- `/api/locale` 闄愬埗 redirect 鍙兘璺冲洖绔欏唴鐩稿璺緞锛岄伩鍏嶅紑鏀鹃噸瀹氬悜銆?
- 鍓嶇 layout 鍘绘帀澶栧眰 `<main>`锛岄伩鍏嶅祵濂?main landmark銆?
- `/results/[taskCode]` 鐨勮繘搴︽潯闄愬埗鍦?0 鍒?100銆?
- 缁撴灉椤典笅杞芥寜閽牴鎹湡瀹炴牸寮忔覆鏌撱€?
- `/pricing` 鍜?`/showcase` 鍦ㄦ湰鍦版暟鎹簱璇诲彇澶辫触鏃舵樉绀虹┖鐘舵€侊紝閬垮厤鍏紑 500銆?
- 淇 `INFOMATION` 鎷煎啓涓?`Information`銆?
- 娓呯悊宸茬‘璁ゆ棤鐢ㄧ殑鏃?`GenerateForm` 鍜?`personal-center-legacy` 鏂囦欢銆?

## 18. 褰撳墠涓嶈鐩存帴鍒犻櫎鐨勫唴瀹?

浠ヤ笅鍐呭鏆傛椂淇濈暀锛?

- AI 璁板繂鏂囨。銆?
- `media/**` 鏈湴濯掍綋鐩綍锛岄渶瑕佸厛鍜屾暟鎹簱/media URL 浜ゅ弶鏍稿銆?
- `.env*`銆乂ercel local env銆佸浠界幆澧冩枃浠讹紝闇€瑕佹墍鏈夎€呯‘璁ゃ€?
- `public/home-test-assets/**`銆乣public/ui-lab/**`銆乣public/ui/**`锛屽叾涓粛鏈夋寮忛〉闈㈡垨 UI-lab 娲剧敓椤甸潰浣跨敤鐨勮祫浜с€?
- 鍘嗗彶 migrations銆佺敓鎴?schema 鍜屾祴璇曟枃浠躲€?

## 19. 闇€瑕佷綘鍚庣画璁ㄨ鐨勫ぇ闂

浠ヤ笅鏄璁″彂鐜扮殑 P1 绾ч棶棰橈紝涓嶅缓璁湪娌℃湁浜у搧/鏉冮檺鏂规纭鍓嶇洿鎺ヤ慨锛?

1. Payload REST 鐩存帴鍒涘缓璁板綍鏃讹紝閮ㄥ垎 owner/user 瀛楁鍙兘琚鎴风鎻愪氦锛岄渶瑕佽璁♀€滃垱寤烘椂寮哄埗缁戝畾褰撳墠鐢ㄦ埛鈥濈殑鏂规銆?
2. `Media.owner/purpose/publicAccess`銆佽瘎璁?鐐硅禐/鏀惰棌/浠诲姟浜嬩欢/鍦板潃绛夎韩浠藉瓧娈甸渶瑕佸鏍哥洿鎺?REST 鍐欏叆杈圭晫銆?
3. `/model-detail` 瀵圭己澶辨垨閿欒 `id` 鐨勯潤鎬佹紨绀哄洖閫€闇€瑕佷骇鍝佸喅绛栥€?

寤鸿澶勭悊鏂瑰紡锛?

- 鍏堢‘璁ゆ潈闄愪骇鍝佽鍒欍€?
- 鍐嶆坊鍔?create-specific access 鎴?beforeChange hook銆?
- 鍐嶆坊鍔犵洿鎺?REST 瀹夊叏鍥炲綊娴嬭瘯銆?
- 鏈€鍚庤繍琛屽畬鏁撮獙璇併€?

## 20. 鏃ュ父鎿嶄綔寤鸿

杩愯惀鍐呭锛?

- 棣栭〉銆佹ā鍨嬪寘銆佸叕寮€妯″瀷銆佸獟浣撱€佷环鏍煎睍绀哄拰閮ㄥ垎骞冲彴璁剧疆浼樺厛鍦?Payload Admin 绠＄悊銆?

寮€鍙戣皟璇曪細

- 鍏堢湅 `/test` 椤甸潰鐩樼偣鎵€鏈夎矾鐢便€?
- 鍐嶇敤鍏蜂綋椤甸潰鍜?API 楠岃瘉涓氬姟娴佺▼銆?

鍙戝竷鍓嶏細

- 杩愯婧愮爜璇█妫€鏌ャ€乀ypeScript銆佸崟鍏冩祴璇曞拰 smoke test銆?
- 濡傛灉鏀硅繃 Payload schema锛岀敓鎴?types 鍜?db schema銆?
- 妫€鏌ュ叕寮€椤甸潰涓嶈渚濊禆绉佹湁濯掍綋銆?
- 妫€鏌?Workbench 鐢熸垚鍜岃处鎴峰姛鑳藉繀椤荤櫥褰曞悗鎵嶈兘鎵ц銆?
