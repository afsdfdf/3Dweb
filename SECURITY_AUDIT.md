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

## 总体评级：A（修复后）

修复前的主要缺口集中在**可用性攻击面**（fragment 循环 DoS、限流竞态与 IP 识别失效），而非数据泄露或权限绕过——认证、访问控制、支付幂等与密钥管理在初版审计中即被确认为良好。本次修复消除了全部已确认问题，并补齐了依赖审计自动化与披露政策。
