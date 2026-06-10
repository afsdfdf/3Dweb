# ThornsTavern 安全与代码质量审计报告

**审计日期**: 2026-06-10  
**项目**: ThornsTavern — 3D 模型 / AI 生成平台  
**技术栈**: Next.js 16 · React 19 · Payload CMS 3.82 · PostgreSQL · Supabase · Stripe · Three.js

---

## 总体评级：A－（优秀）

| 维度 | 评分 |
|------|------|
| 认证与鉴权 | ✅ 优秀 |
| 输入验证 | ✅ 优秀 |
| 密钥管理 | ✅ 优秀 |
| 速率限制 | ✅ 优秀 |
| 支付安全 | ✅ 良好，有改进项 |
| 类型安全 | ⚠️ 有少量问题 |
| 依赖管理 | ⚠️ 需周期性维护 |
| 可观测性 | ❌ 缺少错误追踪 |

---

## 一、安全问题

### 🔴 严重（Critical）

> 未发现严重漏洞。

---

### 🟠 高风险（High）

> 未发现高风险漏洞。

---

### 🟡 中风险（Medium）

#### M-1 · 迁移文件中的 SQL 字符串拼接

**文件**: `src/migrations/20260509_074100_formal_pages_blog_header.ts`

**问题**: 迁移文件使用 `quote()` 函数手工拼接 SQL UPDATE 语句，绕过了 ORM 的参数化查询保护。若 `quote()` 实现不够健壮，存在 SQL 注入风险。

**解决方案**:
```ts
// ❌ 当前写法
sql`UPDATE "models" SET "title" = ${quote(title)} WHERE id = ${id}`

// ✅ 改用 Drizzle 参数化占位符
await db.update(models).set({ title }).where(eq(models.id, id))
```
若必须使用原始 SQL，则切换为 `$1`/`$2` 占位符并传参数组：
```ts
await payload.db.pool.query(
  'UPDATE "models" SET "title" = $1 WHERE id = $2',
  [title, id]
)
```

---

#### M-2 · Auth 工具函数中的 `as any` 类型强转

**文件**: `src/lib/payloadAuthFallback.ts`，约第 90 行

**问题**: 使用 `as any` 跳过 TypeScript 类型检查，若数据库 schema 变更可能引发运行时类型错误。

**解决方案**:
```ts
// ❌ 当前写法
const user = (await payload.findByID({ ... })) as any as AuthenticatedUser

// ✅ 使用类型守卫
function isAuthenticatedUser(u: unknown): u is AuthenticatedUser {
  return (
    typeof u === 'object' && u !== null &&
    'id' in u && 'email' in u && 'role' in u
  )
}

const rawUser = await payload.findByID({ ... })
if (!isAuthenticatedUser(rawUser)) {
  throw new Error('Unexpected user shape from Payload')
}
const user = rawUser // 类型已推断为 AuthenticatedUser
```

---

### 🟢 低风险（Low）

#### L-1 · 配置文件中硬编码 Supabase 项目地址

**文件**: `src/next.config.ts`，第 12 行

**问题**: `umxjtmlmxwjwnbivuxep.supabase.co` 直接写入代码，暴露项目 ID。

**解决方案**:
```ts
// next.config.ts
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : 'placeholder.supabase.co'
```

---

#### L-2 · 控制台日志替代结构化日志

**文件**: `src/lib/kvStore.ts`，第 128 行

**问题**: `console.warn()` 在生产环境中输出内部状态信息，不易聚合分析。

**解决方案**: 引入轻量日志库（如 `pino`）：
```ts
import pino from 'pino'
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

// 替换 console.warn
logger.warn({ store: 'memory' }, 'Redis unavailable, falling back to in-memory KV store')
```

---

#### L-3 · Stripe 生产环境未禁止测试密钥

**文件**: `src/lib/stripeGateway.ts`

**问题**: 若误将 `sk_test_*` 密钥部署到生产环境，支付将静默失败。

**解决方案**: 在应用启动时加入校验：
```ts
// src/lib/envGuard.ts 或 stripeGateway.ts 初始化处
if (
  process.env.NODE_ENV === 'production' &&
  process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
) {
  throw new Error('[Fatal] Stripe test key detected in production environment.')
}
```

---

#### L-4 · 用户简介（bio）字段缺少长度限制

**文件**: `src/collections/Users.ts`

**问题**: `bio` 文本域无最大长度限制，可导致超大 payload 写入数据库。

**解决方案**:
```ts
{
  name: 'bio',
  type: 'textarea',
  maxLength: 500,   // 添加此行
  validate: (val: string | null) => {
    if (val && val.length > 500) return '简介不能超过 500 字符'
    return true
  }
}
```

---

#### L-5 · GraphQL 端点未加速率限制

**问题**: `/api/graphql` 仅有深度和复杂度限制，缺少请求频率限制，可被用于慢速枚举攻击。

**解决方案**:
```ts
// src/app/api/graphql/route.ts
import { rateLimiter } from '@/lib/rateLimiter'

export async function POST(req: Request) {
  const limited = await rateLimiter('graphql', req, { max: 60, window: '1m' })
  if (limited) return limited
  // ... 原有逻辑
}
```

---

## 二、代码质量问题

### Q-1 · 支付 Webhook 响应状态码未明确返回 200

**文件**: `src/endpoints/stripeWebhook.ts`

**问题**: 若处理器未在所有分支中明确返回 HTTP 200，Stripe 会重试事件，可能导致重复扣款。

**解决方案**: 确保所有代码路径均返回 `NextResponse.json({ received: true }, { status: 200 })`：
```ts
export async function POST(req: Request) {
  try {
    // ... 处理逻辑
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    // 仍返回 200 以防 Stripe 重试，同时记录错误
    logger.error(err, 'Stripe webhook processing error')
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
```

---

### Q-2 · 缺少错误追踪（Error Tracking）

**问题**: 代码中无 Sentry 或等价工具集成，生产环境异常只能通过日志被动发现。

**解决方案**: 安装 Sentry Next.js SDK：
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
在 `next.config.ts` 中包裹配置：
```ts
import { withSentryConfig } from '@sentry/nextjs'
export default withSentryConfig(nextConfig, { silent: true })
```

---

### Q-3 · 无 `pnpm audit` CI 自动化

**问题**: 依赖漏洞只能手动发现。

**解决方案**: 在 CI/CD 流程（GitHub Actions）中加入：
```yaml
- name: Dependency audit
  run: pnpm audit --audit-level=high
```

---

## 三、安全检查清单

| 控制项 | 状态 | 说明 |
|--------|------|------|
| HTTPS/TLS | ✅ | Vercel 强制启用 |
| 密码哈希 | ✅ | Payload 默认 bcrypt |
| JWT 会话管理 | ✅ | 含过期与吊销机制 |
| CSRF 防护 | ✅ | Origin 头校验 |
| SQL 注入防护 | ✅ | ORM 参数化；迁移文件需额外审查 |
| XSS 防护 | ⚠️ | 依赖 React 转义，建议验证评论渲染路径 |
| 密钥管理 | ✅ | 仓库中无真实密钥 |
| 速率限制 | ✅ | 23 个独立限流作用域 |
| 输入验证 | ✅ | 所有端点严格校验 |
| 文件上传安全 | ✅ | MIME 类型白名单 + 文件名净化 |
| 访问控制 | ✅ | 基于角色（admin/operator/customer） |
| 审计日志 | ✅ | 涵盖支付、认证、AI 任务 |
| 安全响应头 | ✅ | CSP/HSTS/X-Frame-Options 已配置 |
| Stripe Webhook 验签 | ✅ | Constructive Event 验证 |
| 依赖版本锁定 | ✅ | pnpm-lock.yaml 已追踪 |
| 生产依赖审计 | ⚠️ | 建议加入 CI 自动化 |
| 错误追踪 | ❌ | 未集成 Sentry 等工具 |
| Stripe 测试密钥保护 | ❌ | 需加启动时校验 |

---

## 四、优先级行动计划

### 立即处理（本周）

| # | 任务 | 文件 | 工时估算 |
|---|------|------|---------|
| 1 | 添加 Stripe 测试密钥生产环境校验 | `src/lib/stripeGateway.ts` | 0.5h |
| 2 | 确保 Stripe Webhook 所有分支返回 200 | `src/endpoints/stripeWebhook.ts` | 1h |
| 3 | 迁移文件改用参数化 SQL | `src/migrations/*.ts` | 2h |

### 近期处理（1-2 周内）

| # | 任务 | 文件 | 工时估算 |
|---|------|------|---------|
| 4 | 替换 `as any` 为类型守卫 | `src/lib/payloadAuthFallback.ts` | 1h |
| 5 | 用户 bio 字段加长度限制 | `src/collections/Users.ts` | 0.5h |
| 6 | GraphQL 端点加速率限制 | `src/app/api/graphql/route.ts` | 1h |
| 7 | 集成 Sentry 错误追踪 | 全局 | 2h |

### 计划处理（1 个月内）

| # | 任务 |
|---|------|
| 8 | CI 流程加入 `pnpm audit` |
| 9 | 引入 pino 替换 console.warn |
| 10 | 将硬编码 Supabase 主机改为环境变量 |
| 11 | 编写 `SECURITY.md` 漏洞披露政策 |
| 12 | 为认证和支付流程补充集成测试 |

---

## 五、亮点（已做好的部分）

- **完善的速率限制**：23 个独立作用域，涵盖注册、登录、AI 提交、社交互动等
- **多层访问控制**：admin / operator / customer 角色体系，集合级别权限执行
- **Redis 令牌吊销**：支持即时强制登出
- **支付安全**：Stripe Webhook 签名验证 + 幂等键防重放
- **审计日志**：覆盖支付、认证变更、AI 任务全链路
- **安全响应头**：生产环境 CSP 严格策略，开发环境宽松策略分离
- **无仓库密钥泄露**：所有 `.env.example` 文件使用占位符

---

*本报告基于静态代码审计生成，建议结合动态渗透测试和 `pnpm audit` 做进一步验证。*
