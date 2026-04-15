# MiniForge AI 3D — 产品全框架文档

> 目的：让后续 AI / 开发者接手时，看到这份文档就知道项目是什么、结构在哪里、业务怎么跑、修改某个模块该从哪里入手、改完要如何验证。

---

## 1. 项目定位

MiniForge 不是单页展示站，而是一个完整产品：

- **产品站 Frontend**：首页、功能页、价格页、开发者页、资源页
- **Studio**：图生 3D / 文生 3D / 图文混合，任务提交与结果查看
- **Dashboard**：任务、模型库、订单、积分、订阅
- **Payload Admin**：内容运营、业务运营、平台配置
- **API / Endpoints**：给前端和外部系统提供稳定边界

核心主线：

1. 用户注册 / 登录
2. 提交 AI 生成任务
3. 任务完成后沉淀为模型
4. 模型可下载 / 可进入打印订单
5. 用户可订阅 / 获得积分 / 消耗积分
6. 后台统一管理内容、任务、订单、支付、积分、订阅

---

## 2. 技术栈

- **Next.js 16**
- **React 19**
- **Payload CMS 3**
- **SQLite（本地开发）**
- **Stripe（订阅 + 打印订单支付）**
- **Tailwind / shadcn 风格组件**

关键配置入口：

- `D:\web\payload-local-demo\src\payload.config.ts`
- `D:\web\payload-local-demo\next.config.ts`
- `D:\web\payload-local-demo\package.json`

---

## 3. 项目目录怎么理解

### 3.1 顶层

- `src/`：全部业务代码
- `docs/`：架构、规划、交接文档
- `scripts/`：保留真正需要的维护脚本
- `media/`：本地上传文件
- `payload.db`：本地 SQLite 数据库

### 3.2 `src/app`

#### `src/app/(frontend)`

用户可见产品站与工作台：

- `/` 首页
- `/generate` Studio 任务发起页
- `/results/[taskCode]` 结果页
- `/pricing` 订阅页
- `/dashboard/*` 用户工作台

#### `src/app/(payload)`

Payload Admin 与 Payload API 承载层：

- `/admin`
- `/api/[...slug]`
- `/api/graphql`

---

## 4. 数据层结构

### 4.1 Collections

#### 用户与平台

- `users`
- `media`
- `addresses`

#### AI 生产

- `generation-tasks`
- `task-events`
- `models`

#### 商务 / 支付 / 积分

- `credits`
- `credit-transactions`
- `credit-products`
- `billing-subscriptions`
- `print-orders`
- `shopify-payments`

### 4.2 Globals

- `site-settings`：站点设置、生成积分定价等
- `homepage-content`：首页内容
- `ai-provider-settings`：AI 供应商、轮询、积分规则

---

## 5. 路由与职责分层

### 5.1 Frontend 路由

- `src/app/(frontend)/page.tsx`：首页
- `src/app/(frontend)/generate/page.tsx`：Studio 入口
- `src/app/(frontend)/results/[taskCode]/page.tsx`：任务结果页
- `src/app/(frontend)/pricing/page.tsx`：订阅
- `src/app/(frontend)/dashboard/*`：用户工作台

### 5.2 自定义业务接口

#### Studio / AI

- `/api/studio/ai/tasks`
- `/api/studio/ai/tasks/:taskId/sync`
- `/api/platform/ai/webhooks/provider`

#### Commerce / Orders

- `/api/commerce/print-orders`
- `/api/commerce/print-orders/:orderId/sync`

#### Billing / Subscription

- `/api/billing/subscriptions/checkout`
- `/api/billing/subscriptions/sync`
- `/api/billing/subscriptions/portal`

#### Platform / Ops

- `/api/platform/ops/dashboard`
- `/api/platform/mock/models/:modelId/download`

---

## 6. 核心业务流怎么跑

### 6.1 注册 / 登录

入口：

- `src/app/(frontend)/_components/AuthForm.tsx`

行为：

1. 注册调用 `/api/users`
2. 登录调用 `/api/users/login`
3. 登录后跳转 `/generate`

补充：

- 新用户创建后会在 `Users.afterChange` 中自动创建积分账户

相关文件：

- `src/collections/Users.ts`
- `src/hooks/createDefaultCreditAccount.ts`

---

### 6.2 AI 生成任务

入口：

- `src/app/(frontend)/_components/GenerateForm.tsx`

服务端：

- `src/endpoints/aiTasks.ts`
- `src/lib/aiTaskFlow.ts`
- `src/lib/taskBilling.ts`
- `src/lib/creditLedger.ts`

流程：

1. 前端提交任务
2. 服务端读取后台配置的积分规则与生成定价
3. 预扣积分（如果开启）
4. 创建 `generation-tasks`
5. 创建 `task-events`
6. 前端在结果页轮询 `sync`
7. 成功后生成 `models`
8. 成功时实扣 / 失败时退款

---

### 6.3 模型结果与下载

结果页：

- `src/app/(frontend)/results/[taskCode]/page.tsx`

下载接口：

- `src/endpoints/mockDownloads.ts`

当前状态：

- 现在是 **mock 下载**
- 结构已具备，正式版可替换为真实文件存储与签名下载

---

### 6.4 打印订单

入口：

- `src/app/(frontend)/_components/CreatePrintOrderButton.tsx`

服务端：

- `src/endpoints/printOrders.ts`
- `src/lib/printOrderFlow.ts`
- `src/lib/stripeGateway.ts`

流程：

1. 从结果页发起打印订单
2. 创建 `print-orders`
3. 创建 `shopify-payments`（当前实际用 Stripe）
4. 跳转 Stripe Checkout
5. 成功后回到订单页
6. 用户触发 sync 推进订单状态

说明：

- 当前订单金额仍由服务端静态价格表控制
- 这是能跑通的版本，不是最终商用报价系统

---

### 6.5 订阅

入口：

- `src/app/(frontend)/pricing/page.tsx`

服务端：

- `src/endpoints/subscriptions.ts`
- `src/lib/stripeBilling.ts`
- `src/lib/subscriptionFlow.ts`
- `src/lib/subscriptionPlans.ts`

流程：

1. 选择 Starter / Pro / Studio
2. 创建 Stripe Checkout Session
3. 支付成功后回跳 pricing
4. 前端触发 sync
5. 创建 / 更新 `billing-subscriptions`
6. 发放订阅积分到账户
7. Billing Portal 管理订阅

---

## 7. 权限与安全规则

### 7.1 角色

- `admin`
- `operator`
- `customer`

定义位置：

- `src/access/index.ts`
- `src/collections/Users.ts`

### 7.2 必须遵守的 Payload 规则

#### 规则 A：带 user 的 Local API 必须 `overrideAccess: false`

典型位置：

- `src/app/(frontend)/_lib/session.ts`
- `src/app/(frontend)/_lib/payload-data.ts`
- `src/lib/aiTaskFlow.ts`
- `src/lib/printOrderFlow.ts`
- `src/lib/subscriptionFlow.ts`

#### 规则 B：hooks 中嵌套操作必须传 `req`

典型位置：

- `src/hooks/createDefaultCreditAccount.ts`

#### 规则 C：不要把前端传入的积分 / 价格视为可信

当前做法：

- 生成积分价格由服务端 `taskBilling` 读取后台配置
- 不信任前端的 `creditsReserved`

---

## 8. 后续 AI 接手时，应该怎么入手

### 8.1 如果要改首页 / 营销站

先看：

- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/_components/MarketingPage.tsx`
- `src/app/(frontend)/_lib/marketing-content.ts`
- `src/app/(frontend)/_lib/marketing.ts`
- `src/globals/HomepageContent.ts`
- `src/globals/SiteSettings.ts`

### 8.2 如果要改 Studio 生成

先看：

- `src/app/(frontend)/generate/page.tsx`
- `src/app/(frontend)/_components/GenerateForm.tsx`
- `src/endpoints/aiTasks.ts`
- `src/lib/aiTaskFlow.ts`
- `src/lib/taskBilling.ts`
- `src/lib/creditLedger.ts`

### 8.3 如果要改结果页 / 模型库

先看：

- `src/app/(frontend)/results/[taskCode]/page.tsx`
- `src/app/(frontend)/dashboard/library/page.tsx`
- `src/collections/Models.ts`
- `src/endpoints/mockDownloads.ts`

### 8.4 如果要改积分系统

先看：

- `src/collections/Credits.ts`
- `src/collections/CreditTransactions.ts`
- `src/lib/creditLedger.ts`
- `src/lib/taskBilling.ts`
- `src/app/(frontend)/dashboard/credits/page.tsx`

### 8.5 如果要改支付 / 订阅

先看：

- `src/endpoints/subscriptions.ts`
- `src/lib/stripeBilling.ts`
- `src/lib/subscriptionFlow.ts`
- `src/lib/subscriptionPlans.ts`
- `src/endpoints/printOrders.ts`
- `src/lib/printOrderFlow.ts`
- `src/lib/stripeGateway.ts`

### 8.6 如果要改后台 Admin

先看：

- `src/payload.config.ts`
- `src/components/admin/OpsDashboard.tsx`
- `src/lib/adminDashboard.ts`
- 各 `collections/*.ts`
- 各 `globals/*.ts`

---

## 9. 开发修改后的最低验证步骤

### 9.1 通用

```bash
pnpm exec tsc --noEmit
pnpm build
```

### 9.2 如果改了 Payload schema

```bash
pnpm run generate:types
pnpm run generate:importmap
pnpm exec tsc --noEmit
```

### 9.3 如果改了支付 / 订阅

最少手工验证：

1. 登录
2. 发起订阅 / 打印支付
3. 回跳成功页
4. 手动 sync
5. 检查数据库记录 / 页面状态 / 积分变化

### 9.4 如果改了任务链路

最少手工验证：

1. 提交任务
2. 结果页轮询
3. 检查模型生成
4. 检查积分预扣 / 实扣 / 退款

---

## 10. 当前状态判断

### 已经具备

- 完整产品站 + Studio + Dashboard + Admin + API 分层
- 用户、任务、模型、订单、积分、订阅基础闭环
- Stripe 订阅与打印支付主链路
- Payload Admin 运营后台

### 仍然是“开发版 / 内测版”的部分

- 下载仍是 mock
- AI 供应商仍以 mock 流程为主
- 打印报价仍是静态规则
- 订单与订阅同步仍偏前端触发，不是完整 webhook 驱动
- SQLite 适合本地，不适合正式生产

---

## 11. 后续正式化优先级建议

### P0

- 正式生产数据库替换 SQLite
- 正式环境密钥与 Secret 管理
- 支付 / 订阅 webhook 完整化
- 真实对象存储与文件下载

### P1

- 自动化测试体系
- 统一日志 / 监控 / 告警
- 后台报价与订单规则配置化
- 真实 AI Provider 接入

### P2

- 团队协作 / 多角色精细化
- 真实下载计费
- 更完整的运营报表
- 内容运营自动化

---

## 12. 给后续 AI 的一句话指令

> 先判断要改的是 Frontend、Studio、Dashboard、Admin、API、Billing、Credits、AI Task 哪一层；然后从本文件第 8 节对应入口开始读代码，再按第 9 节做验证，不要跨层乱改。

