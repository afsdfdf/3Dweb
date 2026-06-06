# ThornsTavern 优化实施计划（OPTIMIZATION-PLAN）

> 本文档供**新会话窗口**的执行者（人或 AI）直接照做。执行者**没有**先前审计对话的上下文，因此本文档自包含。
> 配套审计报告见同目录 `AUDIT-REPORT.html`。

---

## 0. 项目背景（执行前必读）

- **项目**：ThornsTavern（3D 模型 / AI 生成平台），路径 `D:\web\payload-local-demo`。
- **技术栈**：Payload CMS 3.82 + Next.js 16 (App Router) + React 19 + PostgreSQL（`@payloadcms/db-postgres`）+ Supabase + Stripe + Three.js（`@react-three/fiber` / `drei`）+ Tailwind 4。
- **包管理器**：pnpm（见 `pnpm-lock.yaml`、`engines.pnpm`）。
- **规模**：365 个 TS/TSX 文件，约 66.8k 行 src 源码，25 个 Collections。
- **构建**：`build` 脚本强制 `next build --webpack`（Payload 兼容性，**勿改为 turbopack**）。

---

## 1. 铁律（每一步都必须遵守）

1. **不得影响现有业务功能**——任何改动不得改变既有接口的输入/输出语义、用户可见行为。
2. **不得影响性能**——不得引入额外同步阻塞、N+1、首屏体积膨胀；优化只能让性能持平或更好。
3. **每一步都谨慎**——一次只改一个**最小可验证单元**，改完立即验证再进行下一步。
4. **可回滚**——每个批次独立提交（git commit），便于单独回退；改动前确认 `git status` 干净。
5. **先读后改**——修改任何文件前先完整读取该文件，理解上下文。
6. **完成后测试 + 审查**——见 §7 验证协议；全部通过才算完成。

> **风险档位**：用户选择「包含资金重构」，但同时要求不得影响现有功能。两者有张力，故**资金重构置于最后（批次 D），且为高风险，需单独逐步确认**。建议先完成零/低风险批次（A→B→C）建立信心，再评估 D。

---

## 2. 推荐执行顺序（按"安全优先"重排，非按审计严重度）

| 批次 | 内容 | 风险 | 是否触碰业务逻辑 |
|---|---|---|---|
| **A** | 纯增量优化：SEO、Three.js 代码分割、typecheck、依赖治理、清理、README | 🟢 零/低 | 否 |
| **B** | 安全与 DB 加固：外键索引、webhook 加固、错误脱敏、限流 | 🟡 低-中 | 仅 API 响应体/DDL，不改业务结果 |
| **C** | next/image 改造 | 🟠 中 | 改渲染，需逐页验证布局 |
| **D** | 资金账本重构（三处真相 / 事务边界 / 数据源收敛） | 🔴 高 | **是，需单独确认** |

> 每批次完成 → 跑 §7 验证 → `git commit` → 再进入下一批次。**不要跨批次混合提交。**

---

## 3. 批次 A —— 纯增量优化（零/低风险，不碰业务逻辑）

### A-1　新增 `typecheck` 脚本（零风险）
- **文件**：`package.json`（`scripts` 段，当前第 7–21 行）。
- **现状**：无 `typecheck` 脚本。
- **改法**：在 `scripts` 中新增一行（放在 `lint` 之后）：
  ```json
  "typecheck": "cross-env NODE_OPTIONS=--no-deprecation tsc --noEmit",
  ```
- **为什么安全**：仅新增脚本，不改任何运行时代码与现有脚本。
- **验证**：`pnpm typecheck`，记录基线错误数（若现存报错属历史遗留，**不在本次修复范围**，仅记录，勿改动业务文件去迎合）。
- **回滚**：删除该行。

### A-2　Three.js `ModelViewer` 代码分割（低风险，提升首屏性能）
- **目标**：让 `three`/`drei`/`GLTFLoader`/`DRACOLoader`（数百 KB）不进入路由首屏 bundle，按需加载。
- **关键事实（已核实）**：`ModelViewer` 是**具名导出**（`export { ModelViewer }` 形式），被以下 4 处**静态 import**：
  - `src/app/(frontend)/model-detail/ModelDetailNative.tsx:18`
  - `src/app/(frontend)/workbench/WorkbenchClient.tsx:15`
  - `src/app/(frontend)/workbench/_components/WorkbenchPanels.tsx:10`
  - `src/app/(frontend)/workbench/_components/WorkbenchScaffold.tsx:1`
- **改法（逐文件，一次一个，每改一个就验证）**：
  1. **先确认导入方所在文件是 client 组件**（文件顶部含 `"use client"`）。`dynamic(..., { ssr:false })` 必须在 client 组件中调用。若某文件不是 client 组件，**跳过该文件并记录**，不要为此添加 `"use client"`（会改变渲染语义，违反铁律）。
  2. 将静态导入替换为动态导入。因 `ModelViewer` 是具名导出，写法为：
     ```ts
     import dynamic from 'next/dynamic'

     const ModelViewer = dynamic(
       () => import('../_components/ModelViewer').then((m) => m.ModelViewer),
       { ssr: false, loading: () => null }, // loading 可按现有占位 UI 替换
     )
     ```
     > 注意各文件相对路径不同（`model-detail` 下是 `../_components/ModelViewer`；`workbench/_components` 下是 `../../_components/ModelViewer`），**按原 import 路径对应替换**。
  3. 删除原静态 `import { ModelViewer } from "..."`。
- **风险点**：`ssr:false` 后，3D 区域在首屏不再 SSR（这些是交互式 3D 查看器，本就依赖浏览器 WebGL，SSR 无意义，**不影响功能**）。`loading` 占位需与现有加载态一致，避免布局跳动。
- **验证**：
  - `pnpm dev`，访问 `/model-detail`、`/workbench`，确认 3D 模型仍正常加载、交互正常。
  - 确认无 hydration 警告。
- **回滚**：恢复静态 import。

### A-3　SEO 基础设施（零风险，纯新增文件）
> 全部为**新增文件**，不改现有页面行为。先确认站点 URL 环境变量名（查 `.env.example`，常见为 `NEXT_PUBLIC_SITE_URL` 或 `NEXT_PUBLIC_SERVER_URL`；**用项目实际存在的那个**）。

- **A-3.1 `robots`**：新增 `src/app/(frontend)/robots.ts`
  ```ts
  import type { MetadataRoute } from 'next'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com' // 改为项目实际变量

  export default function robots(): MetadataRoute.Robots {
    return {
      rules: { userAgent: '*', allow: '/', disallow: ['/account', '/api', '/admin'] },
      sitemap: `${siteUrl}/sitemap.xml`,
    }
  }
  ```
- **A-3.2 `sitemap`**：新增 `src/app/(frontend)/sitemap.ts`。先放**静态公共路由**（首页、pricing、features、blog 列表、bundles、showcase、about、contact、solutions、developers、resources、各 policy 页）。
  - 动态条目（模型详情、blog 文章、bundle 详情）可后续增量加入，**首版只放静态路由**以降风险。
  ```ts
  import type { MetadataRoute } from 'next'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'
  const staticPaths = ['', '/pricing', '/features', '/blog', '/bundles', '/showcase',
    '/about', '/contact', '/solutions', '/developers', '/resources',
    '/privacy-policy', '/refund-policy', '/shipping-policy']
  export default function sitemap(): MetadataRoute.Sitemap {
    return staticPaths.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }))
  }
  ```
- **A-3.3 商品页 metadata**：为 `src/app/(frontend)/model-detail/page.tsx`、`bundles/[slug]/page.tsx` 等**当前无 metadata 的页面**新增 `generateMetadata`（title/description/openGraph）。
  - **谨慎**：`generateMetadata` 若需取数据，**复用页面已有的数据获取函数**，不要新增独立请求（避免重复打 DB，违反性能铁律）。若无法零成本复用，**本项先跳过，记录待办**。
- **验证**：`pnpm dev` 后访问 `/robots.txt`、`/sitemap.xml` 返回正常；商品页查看 `<head>` 含 title/og。
- **回滚**：删除新增文件 / `generateMetadata`。

### A-4　依赖治理（低风险）
- **文件**：`package.json`。
- **改动**：
  1. `shadcn`（当前 `dependencies` 第 48 行）——这是脚手架 CLI，应移到 `devDependencies`。**确认无运行时代码 import 'shadcn'**（用 grep 验证）后再移动。
  2. `sharp`（第 49 行 `"0.34.2"`）——可放开补丁位为 `"~0.34.2"`（安全敏感的原生图像库，便于补丁更新）。**可选**，保守起见也可不动。
- **验证**：改后执行 `pnpm install`（会更新 lockfile），随后 `pnpm build` 确认构建正常。
- **回滚**：还原 `package.json` 与 `pnpm-lock.yaml`。
- **注意**：此项会改 `pnpm-lock.yaml`，单独成一个 commit。

### A-5　清理调试残留（零风险）
- **空目录**（已核实为空且未被 git 跟踪，可安全删除）：
  - `src/app/api/__codex/`（及其子目录）
  - `src/app/(frontend)/test/`、`test-bundles/`、`formal-components/`
- **注意**：`src/components/ui-lab/` **不是死代码**（被 40+ 文件引用），**勿删**。
- **验证**：`pnpm build` 正常；`git status` 确认仅删除空目录。
- **回滚**：目录为空，无需恢复内容。

### A-6　补 `README.md`（零风险，纯新增）
- 根目录无 `README.md`。新增一份，含：项目简介、技术栈、环境搭建（`.env.example` 说明）、常用脚本（dev/build/test/typecheck/lint）、目录结构概览。内容可参考 `AGENTS.md` 与 `docs/`。
- **回滚**：删除文件。

---

## 4. 批次 B —— 安全与 DB 加固（低-中风险）

> 这些改动**不改变业务计算结果**，但 B-1 改 DDL（需迁移）、B-3 改 API 错误响应体（属可观察行为，需确认前端不依赖原始 message 文本）。

### B-1　补关键外键索引（中风险：需数据库迁移）
- **目标**：高频关联查询提速，不改数据。
- **涉及字段（已核实文件存在）**：
  - `src/collections/CreditTransactions.ts`：`user` / `creditAccount` / `sourceTask` / `sourceOrder`（约 25-26、45-46 行）
  - `src/collections/PrintOrders.ts`：约 24-26 行的 relationship
  - `src/collections/GenerationTasks.ts`：`user`（约 24）、`resultModel`（约 82）
  - `src/collections/Models.ts`：`owner` / `sourceTask`（约 46-47）
- **改法**：对上述 relationship 字段加 `index: true`。
- **关键步骤（Payload + Postgres）**：
  1. 改字段定义加 `index: true`。
  2. **生成迁移**：`pnpm payload migrate:create add_fk_indexes`（命令名以项目实际 payload CLI 为准）。
  3. **审查生成的迁移 SQL**：确认仅 `CREATE INDEX`，无 `DROP`/数据变更。
  4. 在**开发库**先跑迁移验证：`pnpm payload migrate`。
  5. 生产迁移由部署流程执行——**大表加索引可能锁表**，如数据量大，迁移里改用 `CREATE INDEX CONCURRENTLY`（手动调整迁移文件，且不能在事务内）。
- **风险**：加索引是增量、可回滚（`DROP INDEX`）。主要风险是大表加索引时的锁；用 CONCURRENTLY 规避。
- **验证**：迁移成功；`pnpm test:unit`、`pnpm build` 通过；抽样查询确认走索引（可选 `EXPLAIN`）。
- **回滚**：`down` 迁移 `DROP INDEX`。

### B-2　Meshy webhook 加固（低风险）
- **文件**：`src/endpoints/aiTasks.ts`，第 246 行 `if (getMeshyWebhookToken(req) !== expectedToken)`；取值函数在第 38 行 `getMeshyWebhookToken`（含从 `?token=` query 回退取值，约第 46 行）。
- **改法**：
  1. 将 `!==` 比较改为**恒定时间比较** `crypto.timingSafeEqual`（注意两侧需等长 Buffer，长度不等先判失败）：
     ```ts
     import { timingSafeEqual } from 'node:crypto'
     function safeEqual(a: string, b: string) {
       const ba = Buffer.from(a); const bb = Buffer.from(b)
       return ba.length === bb.length && timingSafeEqual(ba, bb)
     }
     ```
  2. **移除 query 参数回退**，仅接受请求头令牌（避免令牌落入访问日志/Referer）。
     > ⚠️ **确认 Meshy 实际回调方式**：若 Meshy 平台只能通过 URL query 传 token，则**保留 query 但仍改为 timingSafeEqual**，不要贸然移除导致回调失效（影响业务）。先查 `getMeshyWebhookToken` 实现与 Meshy 配置。
- **验证**：`pnpm test:unit`（若有 webhook 测试）；构造合法/非法 token 请求确认行为不变（合法通过、非法拒绝）。
- **回滚**：还原比较逻辑。

### B-3　API 错误信息脱敏（中风险：改可观察响应体）
- **现状**：约 12 个端点用 `error instanceof Error ? error.message : '兜底'` 直接返回给客户端（`account.ts`、`aiTasks.ts:371`、`engagement.ts:39`、`modelComments.ts:68`、`modelDetails.ts`、`adminRepair.ts` 等）。
- **风险**：前端可能**依赖**某些原始 message 文案做判断/展示。直接全局改会影响现有功能。
- **谨慎改法**：
  1. **先调研**前端是否消费 `error.message` 文本（grep 前端对这些端点响应的处理）。
  2. 引入统一辅助：内部细节走 `payload.logger.error(error)`；对外仅对**显式校验错误**（如 `ValidationError`）透出 message，其余返回稳定错误码 + 通用文案。
  3. **保留 HTTP 状态码不变**（不要把 400 改成 500 等，避免影响前端分支）。
- **验证**：`pnpm test:unit`；手动触发各端点错误路径，确认状态码不变、前端展示无异常。
- **回滚**：还原各端点 catch 块。
- **备注**：若调研发现前端强依赖原始文案且改动面大，**本项降级为"仅加日志、暂不改对外文案"**，记录待办。

### B-4　限流兜底（低-中风险）
- **现状**：auth 端点已有 `rejectRateLimitedEndpoint`；`profile-media/*`、`media/upload-url`、`locale` 等缺限流。
- **改法**：对缺失的 **mutation** 路由复用现有 `rejectRateLimitedEndpoint`（参考 auth 端点用法），并尽量前置于 `getCachedPayload()` 等重操作之前。
- **谨慎**：限流阈值要足够宽松，**避免误伤正常用户**（影响功能）。复用现有阈值配置，勿自定激进值。
- **验证**：正常频率请求不被限流；`pnpm test:smoke` 通过。
- **回滚**：移除新增的限流调用。

---

## 5. 批次 C —— next/image 改造（中风险，逐页验证）

- **现状（已核实）**：`next/image` 引用 = **0**，原生 `<img>` = **67**，55 处 `eslint-disable no-img-element`。
- **风险**：`next/image` 强制要求尺寸（`width/height` 或 `fill`），处理不当会**改变布局**（违反"不影响功能"）。故**逐页、逐图改造并目视验证**。
- **前置改 `next.config.ts`**（当前第 14–20 行 `images.localPatterns` 仅含 `/api/media/file/**`）：
  - 新增 `remotePatterns`，把 Supabase 图源域名加入白名单（域名见 `.env` 中 Supabase URL）。**只加必要域名**。
  ```ts
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
    remotePatterns: [{ protocol: 'https', hostname: '<your-supabase-host>' }],
  },
  ```
- **改造顺序（按 LCP 收益从高到低，一次一页）**：
  1. 首页 `src/app/(frontend)/page.tsx`（第 45/102/120 行附近的 `<img>`）——首屏大图收益最大。
  2. 模型详情 `model-detail/ModelDetailNative.tsx`（582/712 行）。
  3. `bundles/[slug]/page.tsx`（75 行）。
  4. 其余页面逐步跟进。
- **每张图改法**：
  - 已知固定尺寸 → 用 `width`/`height`。
  - 容器自适应 → 用 `fill` + 父元素 `position:relative` + 合适的 `sizes`。
  - 保留原 `alt`（现状 alt 覆盖率 100%，勿丢失）。
  - 移除对应的 `eslint-disable no-img-element` 注释。
- **验证（每页改完即验）**：
  - `pnpm dev` 目视对比改造前后布局**像素级一致**（重点看有无 CLS 跳动、尺寸错乱）。
  - 移动端宽度抽查。
  - 全部改完 `pnpm lint` 确认 `no-img-element` 告警减少且无新错误。
- **回滚**：单页还原为 `<img>`。
- **策略**：本批次**可分多次提交**（每页一提交），便于精确回退。若某页布局复杂、改造风险高，**保留 `<img>` 并记录**，不强行改。

---

## 6. 批次 D —— 资金账本重构（🔴 高风险，最后做，需单独确认）

> ⚠️ **此批次会改变核心资金逻辑的内部实现。执行前必须：(a) 数据库完整备份；(b) 与项目负责人确认；(c) 在隔离的开发库上完成全部验证后再考虑生产。每一小步单独提交、单独验证。**
>
> **若对任何一步没有十足把握，停止并上报，不要继续。** 资金逻辑错误的代价远高于本优化的收益。

### 背景（已核实的问题）
1. **三处真相**：`users.credits_balance` 有三条写路径——
   - 原生 SQL（`src/lib/creditLedger.ts:366-391`，直接 `UPDATE credits` + `UPDATE users`）
   - 镜像 hook（`src/hooks/syncCreditBalanceMirror.ts:24`，经 `req.payload.update` 写回 users）
   - Admin 手改
   且原生 SQL 路径**不触发**镜像 hook。
2. **跨事务不一致**：`src/lib/ledgerStore.ts:22-51` 的 `withLedgerTransaction` 从 `req.payload.db.drizzle.$client` 自取连接开 `BEGIN/COMMIT`，与 Payload 自身 `req.transactionID` 事务**不是同一事务**，无法共同回滚 → 可能产生孤儿扣款。
3. **数据源混乱**：`src/lib/supabase/queries.ts`、`billing.ts` 仍读写旧 Supabase 表（`public.profiles`/`ai_tasks`/`credit_ledger_entries`），与 Payload 表（`users`/`generation-tasks`/`credit_transactions`）并存。

### 推荐分步（每步独立验证 + 提交）

- **D-0 准备**：
  - 数据库快照/备份。
  - 通读 `creditLedger.ts`、`ledgerStore.ts`、`syncCreditBalanceMirror.ts`、`collections/Credits.ts`、`collections/CreditTransactions.ts`、`collections/Users.ts`、`lib/supabase/queries.ts`、`lib/supabase/billing.ts`，画出**当前所有读写余额的调用链**。
  - 跑现有资金相关单测建立基线（`creditLedger`、`taskBilling`、`stripeWebhook` 等），记录全绿。

- **D-1 消除资金路径的 `any`（先做，零行为变更，降后续风险）**：
  - 为 `creditLedger.ts` 的原始 SQL 行定义 `interface CreditLedgerRow { balance: number; reserved_balance: number; ... }`，集中映射，替换 `(row as any).x`。
  - **纯类型改动，不改运行逻辑**。验证 `pnpm typecheck` + 资金单测全绿。

- **D-2 统一事务边界**：
  - 让账本事务复用 Payload 事务（透传 `req`、使用同一 drizzle transaction），使「扣费 + 业务写入」能共同回滚。
  - **风险极高**：改事务管理可能引入死锁/连接泄露。务必在开发库压测并发场景。
  - 验证：并发扣费 + 业务失败场景，确认全部回滚、无孤儿扣款、无连接泄露。

- **D-3 收敛为单一真相**：
  - 设 `credits.balance` 为唯一真相，`users.credits_balance` 改为只读派生（或仅由单一同步点维护）。
  - 移除冗余写路径，使所有写入经同一服务层。
  - 验证：所有充值/扣费/退款流程余额正确；镜像与真相一致。

- **D-4 数据源收敛**：
  - 下线或改写 `supabase/queries.ts`、`billing.ts` 中对旧表的读写，统一指向 Payload 表。
  - **先确认线上是否仍在用旧表**（`reset-public-business-schema.sql` 已 drop 它们）。
  - 验证：所有相关读路径返回正确数据。

- **回滚**：每步独立 commit；任一步验证不通过立即 `git revert` 该步并停止。

> **保守替代方案**：若团队判断 D 风险不可接受，可仅保留 **D-1（类型安全）** 作为低风险改进，D-2/D-3/D-4 转为**独立技术债工单**，由专人在充分测试环境另行推进。

---

## 7. 验证协议（每批次完成后必跑，全绿才算完成）

按顺序执行，**任一失败则停止并修复**：

```bash
# 1. 类型检查（A-1 新增后可用）
pnpm typecheck

# 2. Lint
pnpm lint

# 3. 单元测试（65 个测试文件，全部应有断言）
pnpm test:unit

# 4. 生产构建（验证不破坏构建）
pnpm build

# 5. 冒烟测试（校验 7 条关键路由 HTTP 状态）—— 需先启动服务
pnpm start &   # 或 pnpm dev
pnpm test:smoke
```

**人工审查清单（每批次）**：
- [ ] `git diff` 通读，确认**仅**改了计划内文件，无意外改动。
- [ ] 无新增 `console.log`（项目现状仅 2 处合理 `console.warn`）。
- [ ] 无新增 `any` / `@ts-ignore`（资金/认证路径尤其禁止）。
- [ ] 无新增空 `catch`（现状为 0）。
- [ ] 改动文件的现有功能手动走查一遍（关键页面/接口）。
- [ ] 性能未退化：首屏 bundle 未增大（A-2/C 应使其减小）、无新增同步阻塞、无 N+1。
- [ ] 该批次**独立提交**，commit message 说明改了什么、为什么。

---

## 8. 不要做的事（红线）

- ❌ 不要把 `build` 改成 turbopack（Payload 兼容性，现状强制 webpack 有意为之）。
- ❌ 不要删 `src/components/ui-lab/`（是生产 UI 库，被 40+ 文件引用）。
- ❌ 不要为代码分割给非 client 组件添加 `"use client"`（改变渲染语义）。
- ❌ 不要在未确认 Meshy 回调方式前移除 token 的 query 回退（可能中断回调）。
- ❌ 不要为了过 typecheck/lint 去改动计划外的业务文件。
- ❌ 不要跨批次混合提交；不要 `--no-verify` 跳过 hook；不要 force push。
- ❌ 资金重构（批次 D）未经备份与确认，不得在生产执行。

---

## 9. 执行进度追踪（执行者勾选）

**批次 A（零/低风险）**
- [ ] A-1 typecheck 脚本
- [ ] A-2 ModelViewer 代码分割（4 处，逐个）
- [ ] A-3 SEO：robots / sitemap / 商品页 metadata
- [ ] A-4 依赖治理（shadcn → dev；sharp 补丁位）
- [ ] A-5 清理空目录（__codex / test / test-bundles / formal-components）
- [ ] A-6 README.md

**批次 B（低-中风险）**
- [ ] B-1 外键索引（含迁移，审查 SQL）
- [ ] B-2 Meshy webhook timingSafeEqual（+ 确认回调方式）
- [ ] B-3 错误脱敏（先调研前端依赖）
- [ ] B-4 限流兜底

**批次 C（中风险）**
- [ ] next.config remotePatterns
- [ ] 首页图 → next/image（验证布局）
- [ ] 详情页 / bundles 图（验证布局）
- [ ] 其余页面逐步

**批次 D（高风险，需单独确认）**
- [ ] D-0 备份 + 调用链梳理 + 基线测试
- [ ] D-1 资金路径类型安全
- [ ] D-2 统一事务边界
- [ ] D-3 收敛单一真相
- [ ] D-4 数据源收敛

---

_本计划基于只读审计（`AUDIT-REPORT.html`）。所有行号为审计时快照，执行前以实际文件为准。每一步先读后改、改后即验、独立提交。_
