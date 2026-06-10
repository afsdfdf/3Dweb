# ThornsTavern 安全与代码质量审计报告（严格复审版）

**审计日期**: 2026-06-10（复审并修复）  
**项目**: ThornsTavern — 3D 模型 / AI 生成平台  
**技术栈**: Next.js 16 · React 19 · Payload CMS 3.82 · PostgreSQL · Supabase · Stripe · Three.js  
**审计方式**: 逐文件人工核查关键安全路径（认证、限流、支付、GraphQL、迁移、集合定义）

> 本版报告对初版结论做了**实证复核**：每个问题都核对了实际代码；初版中两项被夸大的风险已更正，同时新发现三个初版遗漏的真实问题。**所有确认的问题已在本次提交中修复**，并通过 typecheck、ESLint（0 错误）和 351 项单元测试验证。

---

## 一、已修复的问题

### 🔴 F-1 · GraphQL fragment 循环递归导致 DoS（新发现，初版遗漏）

**文件**: `src/lib/graphqlSecurity.ts`

**问题**: 安全校验器在展开 `FragmentSpread` 时没有循环检测。恶意构造相互引用的 fragment（`fragment A { ...B }` / `fragment B { ...A }`）会让 `visitSelection` 无限递归，在限流和深度检查生效之前就触发栈溢出，使生产 GraphQL 端点崩溃。`graphql.parse()` 不拒绝循环 fragment（循环检测属于执行期 validation，而此校验器运行在执行之前）。

**修复**:
- 递归时携带"活跃 fragment 集合"，遇到已展开的 fragment 直接判为超深（拒绝请求）
- 增加 64 层的绝对遍历深度上限作为兜底

---

### 🟠 F-2 · 速率限制读改写竞态（新发现，初版遗漏）

**文件**: `src/lib/rateLimit.ts`、`src/lib/kvStore.ts`

**问题**: 原实现为 `get → 判断 → set`，非原子操作。并发请求会同时读到相同计数并各自加一写回，使实际通过量超过配置上限——对登录、注册等低限额（5～10 次）的敏感端点，攻击者用并发请求即可成倍放大尝试次数。

**修复**:
- `KVStore` 接口新增原子 `increment(key, ttlMs)`：Redis 用 `INCR` + 首次创建时 `PEXPIRE`；内存实现利用 Node 单线程同 tick 原子性
- `enforceRateLimit` 改为基于原子自增判断，彻底消除竞态
- 顺带修复：原实现每次请求对内存存储做 O(n) 全量过期清理，现节流为每 60 秒一次

---

### 🟠 F-3 · 限流 IP 识别在 Vercel 上失效（新发现，初版遗漏）

**文件**: `src/lib/requestSecurity.ts`、`.env.example`

**问题**: `getRequestIP` 只信任 `cf-connecting-ip` 和 `x-real-ip`。Vercel 平台主要提供 `x-forwarded-for`，因此即使设置了 `TRUST_PROXY_HEADERS=true`，限流键也会退化为 User-Agent 桶——攻击者轮换 UA 即可绕过限流，而使用常见 UA 的正常用户会共享配额、被他人刷爆而误伤。

**修复**:
- 受信代理头列表加入 `x-forwarded-for`（取首跳 IP，已有的 `normalizeIP` 负责拆分）
- `.env.example` 显式说明生产环境必须设置 `TRUST_PROXY_HEADERS=true` 与 `REDIS_URL`，否则限流降级

---

### 🟡 F-4 · Stripe 测试密钥可在生产环境使用

**文件**: `src/lib/stripeGateway.ts`

**问题**: 无任何校验阻止 `sk_test_*` 密钥部署到生产环境，会导致支付静默走测试模式。

**修复**: `getStripeClient()` 在 `NODE_ENV=production` 下检测到 `sk_test_` 前缀时直接抛错，启动即失败。

---

### 🟡 F-5 · Stripe Webhook 错误状态码语义不正确

**文件**: `src/endpoints/stripeWebhook.ts`

**问题**: 签名验证失败和业务处理失败统一返回 400。签名失败重试永远不会成功（应永久拒绝）；业务处理失败（如数据库瞬时故障）应返回 5xx 让 Stripe 按退避策略重试。

**修复**: 拆分两个 try 块——签名验证失败返回 400（含审计日志），事件处理失败返回 500 触发 Stripe 重试。finalize 流程具备幂等键保护，重试不会重复入账。

---

### 🟡 F-6 · GraphQL 端点缺少请求频率限制

**文件**: `src/app/(payload)/api/graphql/route.ts`

**问题**: 仅有深度/复杂度限制，无频率限制，可被用于持续慢速枚举。

**修复**: 接入既有 `enforceRateLimit` 基础设施，按 IP（或 UA 兜底）限流，默认 120 次/60 秒，可经 `GRAPHQL_RATE_LIMIT_MAX` / `GRAPHQL_RATE_LIMIT_WINDOW_MS` 调整，超限返回 429 + `Retry-After`。

---

### 🟢 F-7 · 用户文本字段缺少长度限制

**文件**: `src/collections/Users.ts`

**修复**: `bio` 加 `maxLength: 500` + 服务端 validate；`fullName` 加 `maxLength: 100`；`phone` 加 `maxLength: 32`。

---

### 🟢 F-8 · 认证回退工具中的 `as any` 强转

**文件**: `src/lib/payloadAuthFallback.ts`

**修复**: `findByID` 调用改用 `CollectionSlug` 类型化的 slug 与原生 `id`，`req.user` 赋值改用 Payload 导出的 `TypedUser`。（`AuthenticatedUser` 的宽松记录类型保留——下游 `session.ts` 依赖其字段访问形态，已加注 eslint 豁免说明。）

---

### 🟢 F-9 · next.config 硬编码 Supabase 主机

**文件**: `next.config.ts`

**修复**: 改为环境变量（`SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`）优先；仅当两者都未配置时才回退到演示项目主机，便于本地零配置开发。

---

### 🟢 F-10 · 缺少依赖审计自动化与披露政策

**新增文件**:
- `.github/workflows/security-audit.yml` — push / PR / 每周一定时运行 `pnpm audit --prod --audit-level=high`
- `SECURITY.md` — 漏洞披露渠道、响应时限，以及生产部署必配的安全环境变量清单

---

## 二、复核后撤销或降级的初版结论

| 初版结论 | 复核结果 |
|----------|----------|
| 迁移文件 `quote()` 存在 SQL 注入风险（中危） | **撤销**。三个迁移文件中 `quote()`（单引号转义）仅作用于文件内硬编码的常量字符串，无任何用户输入路径，实际注入面为零。 |
| `first-register` 自动授予 admin 角色疑似提权 | **确认安全**。该路径是 Payload 内置的 first-register 操作，框架在已存在用户时拒绝执行；`usersUpdateAccess` 的豁免也仅允许该流程写入 `_verified` 单字段。 |
| 建议 Webhook 失败也返回 200 | **更正**。失败返回 200 会让 Stripe 放弃重试、丢失事件。正确做法是签名错误 400、瞬时错误 500（已按此实现，见 F-5）。 |

---

## 三、已知但未修复（含理由）

| 项 | 理由 |
|----|------|
| `creditLedger.ts` / `ledgerStore.ts` 中对原始 SQL 行的 `as any` 转换 | 原始 `pg` 查询结果本质无类型，转换处紧跟 `Number()` 规范化与 `satisfies` 校验，风险已被约束；强行建模收益低 |
| 生产 CSP 含 `'unsafe-inline'`（script-src） | Payload Admin 与 Next 内联脚本依赖，移除需配套 nonce 改造，属架构级变更，建议单独立项 |
| 未集成 Sentry 等错误追踪 | 引入第三方服务需要账号与 DSN 决策，不适合在审计修复中代为决定；建议作为独立任务 |
| 4 个存量失败的前端 UI 测试（inspiration search / accountShell CSS） | 与安全无关的 UI 断言漂移，修改前即失败，已确认非本次引入；建议前端同步修复 |

---

## 四、验证记录

| 检查 | 结果 |
|------|------|
| `pnpm typecheck` | ✅ 通过 |
| `pnpm lint` | ✅ 0 错误（88 个存量 warning，均为既有 `no-explicit-any` 等） |
| `pnpm test:unit` | ✅ 351 通过 / 4 失败（4 个失败为存量 UI 测试，已用干净工作树复跑确认与本次修改无关） |
| 密钥扫描（sk_live / AKIA / AIza / JWT / 明文密码模式） | ✅ 仓库内无真实密钥，仅 `.env.example` 占位符与测试 fixture |

---

## 五、生产部署检查清单（运维必读）

- [ ] `TRUST_PROXY_HEADERS=true` —— 否则限流按 UA 分桶，可绕过且易误伤
- [ ] `REDIS_URL` —— 否则限流/令牌吊销仅在单实例内存中，serverless 多实例下形同虚设
- [ ] `STRIPE_SECRET_KEY` 使用 `sk_live_*`（现在启动时强制校验）
- [ ] `PAYLOAD_SECRET` ≥ 32 字符（已有启动校验）
- [ ] `ALLOWED_REQUEST_ORIGINS` 配置为真实前端域名
- [ ] `ENABLE_GRAPHQL_INTROSPECTION` / `ENABLE_GRAPHQL_PLAYGROUND` / `ENABLE_PUBLIC_ACCESS_ENDPOINT` 保持未启用
- [ ] `SMTP_SKIP_VERIFY` 保持 false（生产启动已强制）

---

---

# 第二轮审计：支付 / 业务 / 性能 / 可用性（2026-06-10）

针对"支付、业务、前后端可用性"做了四个维度的深度复审，逐文件追踪资金流与生命周期。以下为**已确认并修复**的问题。

## 六、支付 / 计费正确性

### ✅ 已确认正确（无需修改）
- 积分交易表 `idempotencyKey` 有**数据库级唯一约束**，配合 `SELECT ... FOR UPDATE` 行锁与 `BEGIN/COMMIT` 事务，双花防护扎实
- Stripe 入账前校验 `payment_status === 'paid'`，金额全程用整数分（`Math.round(x*100)`），负数被 `Math.max(0, ...)` 拦截
- 订阅按 `lastGrantedPeriodKey` 去重，每计费周期只发一次积分
- 任务失败/超时在 `reserveOnSubmit + refundOnFailure` 下会退还预留积分

### 🟠 P-1 · 支付记录"已付"与积分入账非原子（已修复）
**文件**: `src/lib/creditTopupFlow.ts`、`src/lib/printOrderFlow.ts`

原实现先把 `shopify-payments.status` 改为 `paid`，再调用 `purchaseCredits()`。若入账失败，支付显示已付但积分未到账，且 Webhook 不会重试该状态。

**修复**: 调整顺序——**先**完成幂等的积分入账，**再**标记支付为 paid；并在入口加 `if (payment.status === 'paid') return`（订单流加 `&& order.status !== 'pending-payment'`）短路，使 sync 端点与重复 Webhook 的重放变为无操作。若标记 paid 的更新失败，Webhook 重试会重跑幂等入账后再次尝试，最终一致。

## 七、业务逻辑

### 🔴 B-1 · AI 任务无超时清扫，卡死任务永久锁定积分（已修复）
**文件**: `src/lib/aiTaskFlow.ts`、`src/endpoints/aiTasks.ts`、`vercel.json`

原本只有用户主动调用 sync 时才检测超时。若 serverless 函数中途死亡且用户不再打开页面，任务永远停留在 `processing`，预留积分永久冻结。

**修复**: 新增 `reconcileStaleAITasks()`——扫描 `startedAt` 超过 `TASK_TIMEOUT_MS` 仍处于 queued/processing 的任务，复用 `updateTaskStatus({ status: 'timeout' })`（含退款路径）批量收尾；新增受 `CRON_SECRET` 保护的 `/studio/ai/tasks/cron-reconcile` 端点，并在 `vercel.json` 配置每 10 分钟运行。

### 🟡 B-2 · 点赞 / 关注 check-then-create 竞态（已修复）
**文件**: `src/lib/reactionService.ts`、`src/lib/followService.ts`

并发的相同点赞/关注请求可能同时通过存在性检查再各自插入。**修复**: 插入包 try/catch，捕获后重查——若已存在则视为竞态成功（计数随后按实际行数重算），否则抛出原错误。

## 八、性能

### 🟡 PF-1 · 安全设置每请求查库（已修复）
**文件**: `src/lib/securitySettings.ts`

`getSecuritySettingsSnapshot` 在每次变更来源校验、远程资源白名单校验时都 `findGlobal` 查一次库。**修复**: 按 Payload 实例加 30 秒 TTL 的 `WeakMap` 缓存（与 `storageSettings.ts` 一致）。

### 复审确认已做好的部分
GLB 流式下发（非缓冲入内存）、Three.js 经 `next/dynamic` 懒加载不进主包、模型详情 LRU+TTL 缓存、首页 owner 资料请求内去重、连接池单例、`getCachedPayload` 单例。报告另记录了若干**建议项**（首页加 `revalidate`、`<img>` 换 `next/image`、owner 批量查询），属优化非缺陷，未改动。

## 九、可用性 / 韧性

### 🔴 A-1 · Redis 故障会挂起所有限流端点（已修复）
**文件**: `src/lib/kvStore.ts`、`src/lib/rateLimit.ts`

原 ioredis 客户端用默认配置——Redis 宕机时命令会无限排队，使 `enforceRateLimit` 挂起，进而拖垮所有受限端点直到函数超时。

**修复**:
- ioredis 配置 `maxRetriesPerRequest: 1`、`enableOfflineQueue: false`、`connectTimeout: 3000`、有界 `retryStrategy`，并监听 `error` 事件防止进程崩溃
- `enforceRateLimit` 整体包 try/catch，KV 后端异常时**失败放行**（fail-open）——宁可短时不限流，也不阻断全站

### 🟡 A-2 · 注册验证码邮件失败抛原始 500（已修复）
**文件**: `src/lib/emailVerificationCodes.ts`

**修复**: `sendEmail` 包 try/catch，记录日志并抛出用户友好提示，而非裸 500。

### 🟡 A-3 · Payload 初始化失败退避过短（已修复）
**文件**: `src/lib/getCachedPayload.ts`

DB 短暂抖动时 1 秒退避会快速重试打爆数据库。**修复**: 默认退避 1s → 5s。

### 🟡 A-4 · 前端无错误边界（已修复）
**文件**: `src/app/(frontend)/error.tsx`（新增）

数据获取失败会导致整页崩溃。**修复**: 新增前端路由组 `error.tsx`，展示友好错误页与"重试"按钮。

## 十、第二轮验证记录

| 检查 | 结果 |
|------|------|
| `pnpm typecheck` | ✅ 通过 |
| `pnpm lint` | ✅ 0 错误（88 存量 warning） |
| `pnpm test:unit` | ✅ 351 通过 / 4 失败（均为与本次无关的存量 UI 测试） |
| 新增 cron 测试断言 | ✅ 已同步更新 `modelOptimizationEndpoint.test.ts` |

## 十一、第三轮跟进修复（原"未修复"清单的消化）

| 项 | 状态 | 处理方式 |
|----|------|---------|
| 订单已付后财务字段可被改写 | ✅ 已修复 | `PrintOrders` 新增 `beforeChange` 守卫：订单离开 `pending-payment` 后冻结 `amount`/`currency`/`creditsUsed`/`model`/`user`，staff 仍可推进状态、物流单号与备注 |
| 通知表无保留策略 | ✅ 已修复 | 新增 `purgeExpiredNotifications()`（默认删除 90 天前**已读**通知，可经 `NOTIFICATION_RETENTION_DAYS` 调整），挂载到每 10 分钟的 reconcile cron 上 |
| `markAllNotificationsRead` 逐行 UPDATE | ✅ 已修复 | 改为单次按 `where` 批量更新，大量未读时不再每行一条 UPDATE |
| 图片生成任务缺超时清扫 | ✅ 已确认覆盖 | 图片任务与 3D 任务共用 `generation-tasks` 集合（核实了 `createImageGenerationTask` 的写入），上一轮的 reconcile 清扫天然覆盖，无需额外代码 |
| Stripe 调用无显式超时 | ✅ 已修复 | Stripe 客户端配置 `timeout: 20s` + `maxNetworkRetries: 1` |
| Supabase 调用无显式超时 | ✅ 已修复 | admin 客户端注入带 `AbortSignal.timeout` 的 fetch（默认 60s，可经 `SUPABASE_REQUEST_TIMEOUT_MS` 调整） |

### 第四轮修复（原"留给后续"三项全部关闭）

| 项 | 状态 | 修复方式 |
|----|------|---------|
| 客户端 fetch 无统一超时 | ✅ 已修复 | 新增 `src/app/(frontend)/_lib/apiFetch.ts`：默认 30s `AbortSignal.timeout`，与调用方自带 signal 合并取先触发者；全部 14 处前端 fetch 调用点已迁移（模型下载放宽到 120s、upload-url 收紧到 15s） |
| 计数器（关注/点赞/评论）外部删除导致漂移 | ✅ 已修复 | 三个 service 各新增全量 reconcile 函数（分页 100/批，按实际行数重写计数），挂载到既有 cron-reconcile 端点，幂等可重复执行 |
| Meshy 并发上限窗口竞态 | ✅ 已修复 | 改为**先占位再检查**：`dispatchStartedAt` 在容量检查前先写入 DB，使并发实例计数时已能看到本任务；占位后复查超限则回滚为 `queued`，任务不会卡死 |

---

## 总体评级：A（修复后）

修复前的主要缺口集中在**可用性攻击面**（fragment 循环 DoS、限流竞态与 IP 识别失效），而非数据泄露或权限绕过——认证、访问控制、支付幂等与密钥管理在初版审计中即被确认为良好。本次修复消除了全部已确认问题，并补齐了依赖审计自动化与披露政策。第四轮已将原"留给后续"的三项（客户端超时、计数器漂移、Meshy 并发竞态）全部关闭，审计清单清零。
