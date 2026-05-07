# Thorns Tavern 项目使用说明书

版本：2026-05-07  
项目路径：`D:\web\payload-local-demo`

## 1. 说明书用途

本文面向项目所有者、运营人员和开发人员，用来快速理解当前项目能做什么、每个页面在哪里、后台内容从哪里管理、常见功能怎么验证。

当前项目是一个基于 Next.js + Payload CMS + PostgreSQL/Supabase Storage 的 3D/AI 资产平台，主要包含：

- 公开官网和营销页面。
- 公开模型展示、模型包展示、模型详情和模型预览。
- Workbench 工作台，用于 AI 图片生成、3D 模型生成、任务轮询和模型查看。
- 账户中心，用于资料、头像、横幅、积分、订单、模型、任务和订阅信息。
- Payload Admin 后台，用于管理用户、媒体、模型、模型包、首页内容、AI 设置、存储设置、计费和运营数据。

## 2. 本地启动

项目根目录：

```bash
cd D:\web\payload-local-demo
```

推荐启动：

```bash
pnpm dev
```

如果当前终端找不到 `pnpm`，可以使用项目里的本地二进制命令进行验证，例如：

```bash
D:\web\payload-local-demo\node_modules\.bin\tsc.CMD --noEmit
```

常用地址：

| 功能 | 地址 |
|---|---|
| 公开网站首页 | `http://127.0.0.1:3000/` |
| 本地页面导航 | `http://127.0.0.1:3000/test` |
| Workbench 工作台 | `http://127.0.0.1:3000/workbench` |
| 账户中心 | `http://127.0.0.1:3000/account` |
| Payload 后台 | `http://127.0.0.1:3000/admin` |
| 模型展示列表 | `http://127.0.0.1:3000/showcase` |
| 模型包列表 | `http://127.0.0.1:3000/bundles` |
| 价格页 | `http://127.0.0.1:3000/pricing` |

## 3. 用户角色

| 角色 | 主要权限 |
|---|---|
| 游客 | 浏览公开首页、营销页、公开模型、公开模型包；可以进入 Workbench 看界面，但不能提交生成任务。 |
| customer | 登录后使用 Workbench 生成、查看自己的任务、模型、积分和账户资料。 |
| operator | 可进入 Payload Admin 进行运营内容和部分平台数据管理。 |
| admin | 可进入 Payload Admin 并拥有最高后台管理权限。 |

重要原则：

- 公开预览不等于后台权限。
- Workbench 是“可匿名访问界面、登录后执行动作”的工作台。
- 账户中心是正式个人中心，不再使用旧的 `/dashboard`、`/personal-center-test` 或 `/personal-center-legacy` 页面。

## 4. `/test` 本地导航页

`/test` 现在是轻量页面导航，不再承担复杂 UI 预览或 API 调试。

用途：

- 查看当前项目有哪些正式页面、动态页面、本地页面和 Payload 页面。
- 每个页面有一行简介，方便判断页面是否有用。
- 开发环境可访问。
- 生产环境会返回 `notFound()`，不会暴露为正式用户页面。

如果要快速盘点页面，请先打开：

```text
http://127.0.0.1:3000/test
```

## 5. 公开网站页面

### 首页 `/`

用途：

- 展示品牌、精选模型、模型包、灵感网格和公开模型入口。

主要数据来源：

- `homepage-content`
- `homepage-items`
- 公开 `models`
- 公开或预览用途的 `media`
- 公开 `model-bundles`

运营方式：

- 后台进入 Payload Admin。
- 管理 `Homepage Items` 来控制首页重复卡片、徽标、按钮、关联模型或模型包。
- 管理 `Homepage Content` 来控制首页区块文案。

### 功能页 `/features`

用途：

- 介绍生成、资产管理、模型预览和交付能力。

当前状态：

- 正式公开营销页。

### 方案页 `/solutions`

用途：

- 面向创作者、工作室和品牌方展示使用场景。

当前状态：

- 正式公开营销页。

### 资源页 `/resources`

用途：

- 说明资源、模型交付、资产使用方式和产品教育内容。

当前状态：

- 正式公开营销页。

### 开发者页 `/developers`

用途：

- 展示平台边界、API 方向和开发者信息。

当前状态：

- 正式公开营销页。

### 关于页 `/about`

用途：

- 展示产品背景和方向。

### 联系页 `/contact`

用途：

- 提供联系和支持入口。

### 政策页面

| 页面 | 地址 |
|---|---|
| 隐私政策 | `/privacy-policy` |
| 退款政策 | `/refund-policy` |
| 运输政策 | `/shipping-policy` |

## 6. 模型展示和模型详情

### 模型展示列表 `/showcase`

用途：

- 展示公开模型列表。

数据来源：

- `models`
- `models.previewImage`
- `media`

本次审计修复：

- 当本地数据库读取超时或失败时，页面会显示空状态，不再直接变成公开 500 页面。

### 模型详情 `/model-detail?id=<modelId>`

用途：

- 打开某个公开模型的 3D 预览、作者信息和相关模型。

关键规则：

- 模型预览通过 `/api/platform/models/:modelId/viewer?format=glb`。
- 浏览器不应该直接拿到未授权的私有模型文件。
- 作者头像或横幅只有在媒体是可公开访问时才显示。

当前需要你后续决策的大问题：

- 缺少或错误的 `id` 目前仍可能进入静态演示回退。建议后续决定改成 `notFound()` 或跳回 `/showcase`。

## 7. 模型包

### 模型包列表 `/bundles`

用途：

- 展示已发布、可见的模型包。

数据来源：

- `model-bundles`
- 公开 `models`
- 公开或预览用途的封面 `media`

### 模型包详情 `/bundles/[slug]`

用途：

- 展示模型包标题、副标题、封面、摘要、标签、技术规格、许可、CTA、发布说明和包含的公开模型。

重要规则：

- 只显示已发布且可见的模型包。
- 只包含 `visibility = public` 的模型。
- 模型包封面必须是游客可读媒体。
- 当前阶段模型包价格/CTA 是展示字段，不代表已经完成购买、授权或权益发放。

## 8. Workbench 工作台

### 入口 `/workbench`

用途：

- AI 图片生成。
- 3D 模型生成。
- 上传参考图。
- 查看当前用户模型库。
- 轮询生成任务状态。

游客行为：

- 游客可以打开 Workbench 页面。
- 点击真正生成动作时需要登录。

登录用户行为：

- 可以提交图片生成或 3D 生成任务。
- 可以查看自己的模型和图片资产。
- 可以继续未完成的后台任务。

### 3D 生成

典型流程：

1. 用户输入提示词或选择参考图片。
2. 前端提交到 `/api/studio/ai/tasks`。
3. 后端检查积分。
4. 创建 `generation-tasks`。
5. 调用 Meshy/Tripo 等后端配置的 3D provider。
6. 前端轮询 `/api/studio/ai/tasks/:taskId/sync`。
7. 成功后生成 `models` 和 `models_formats`，并通过 viewer endpoint 预览。

注意：

- 默认生成价格当前按后台配置执行，历史默认值是 20 credits。
- 积分不足应该返回 `402`，不应创建无效任务。
- 任务失败时应显示 `failureReason`，不能让用户看到静默的 100% pending 状态。

### 图片生成

典型流程：

1. 用户输入提示词，可选一张参考图。
2. 前端提交到 `/api/studio/ai/images`。
3. 后端创建 `taskType = image-generation` 的任务。
4. 后台 provider 执行生成。
5. 前端轮询图片 sync endpoint。
6. 成功后生成私有 `media` 图片资产。

注意：

- 图片生成和 3D 模型生成是两种不同任务。
- 图片生成结果是私有资产，不自动变成公开模型。
- 图片生成最多使用一张参考图；多图是 3D 生成场景。

### 历史记录 `/workbench/history`

用途：

- 登录用户查看自己的 Workbench 任务历史。

当前状态：

- 受保护页面。

### Workbench 模型详情 `/workbench/models/[id]`

用途：

- 从账户或 Workbench 模型库打开用户自己的模型详情。

当前需要后续处理：

- 页面里仍有部分静态/演示内容，需要单独做正式化。

## 9. 结果页 `/results/[taskCode]`

用途：

- 根据任务代码展示生成结果。

本次审计修复：

- 进度条限制在 0 到 100，避免溢出。
- 下载按钮根据真实存在的模型格式渲染，不再固定假设一种格式。

## 10. 登录、注册和密码恢复

### 登录 `/login`

用途：

- 进入共享登录卡片或登录弹窗流程。

### 注册 `/register`

用途：

- 进入共享注册流程。

当前注册支持：

- 邮箱验证码模式。
- 邮箱链接验证兼容模式。

### 忘记密码 `/forgot-password`

用途：

- 发起密码恢复邮件流程。

### 重置密码 `/reset-password`

用途：

- 通过共享 `AuthFlowCard` 的 reset 模式提交新密码。

重要规则：

- 当前重置密码提交到 `/api/account/auth/reset-password`。
- 不直接使用 Payload 原始 `/api/users/reset-password` 作为前端正式入口。

## 11. 账户中心 `/account`

用途：

- 正式个人中心。
- 登录后访问。

包含功能：

- 查看和编辑基础资料。
- 查看头像和个人横幅。
- 上传头像和 profile banner。
- 修改密码。
- 查看积分余额和交易记录。
- 查看任务、模型、订单、订阅和账单相关信息。

后端来源：

- 当前用户读取走 server-side helper。
- 资料接口：`/api/account/profile`。
- 密码接口：`/api/account/password`。
- 上传入口：`/api/account/profile-media/upload-url`。
- 上传完成：`/api/account/profile-media/complete`。

头像和横幅上传流程：

1. 前端请求 signed upload URL。
2. 浏览器把文件上传到 Supabase Storage。
3. 前端调用 complete 接口。
4. 后端确认 owner/path 后更新 `media`。
5. 前端调用 profile 接口把头像或横幅关联到用户。

重要规则：

- 不要先创建 Payload 本地上传文件记录再上传对象；当前 runtime 是 Supabase Storage。
- 公开展示头像/横幅时，必须确认媒体是游客可读的。

## 12. Payload Admin 后台

地址：

```text
http://127.0.0.1:3000/admin
```

需要角色：

- `admin`
- `operator`

主要管理区域：

| 后台区域 | 用途 |
|---|---|
| Users | 用户、角色、资料、积分镜像、社交计数。 |
| Media | 图片、模型文件、预览图、文档和资产。 |
| Models | 公开/私有 3D 模型记录、预览图、格式文件、标签和计数。 |
| Model Bundles | 模型包、封面、CTA、规格、发布说明和包含模型。 |
| Homepage Items | 首页重复卡片、徽标、按钮、关联模型/模型包。 |
| Homepage Content | 首页区块级内容。 |
| Generation Tasks | AI 生成任务状态、provider 状态、结果模型。 |
| Task Events | 生成任务时间线和操作日志。 |
| Credits / Credit Transactions | 积分账户和积分流水。 |
| Credit Products | 可购买积分包。 |
| Billing Subscriptions | 订阅状态。 |
| Addresses / Print Orders | 地址和打印订单。 |
| Site Settings | 站点设置、访问策略、邮箱配置等。 |
| AI Provider Settings | Meshy、Gemini、OpenAI-compatible 等 provider 设置。 |
| Storage Settings | Supabase Storage 相关运行设置。 |
| Security Settings | 注册验证、安全策略。 |
| Runtime Deployment Settings | 运行环境展示和部署检查。 |

## 13. API 边界

项目自定义 API 应优先使用以下命名空间：

| 命名空间 | 用途 |
|---|---|
| `/api/studio/...` | Workbench、AI 生成、任务同步。 |
| `/api/platform/...` | 模型预览、下载、平台级公开能力。 |
| `/api/account/...` | 当前用户资料、认证、账户数据。 |
| `/api/billing/...` | 积分购买、订阅和结账。 |
| `/api/commerce/...` | 订单和商务流程。 |
| `/api/social/...` | 评论、点赞、收藏、关注、浏览等社交行为。 |

不要新增自定义 Next route 到 `/api/<collection-slug>`，因为这些路径属于 Payload REST。

## 14. 媒体和存储规则

当前 runtime 方向：

- PostgreSQL 数据库。
- Supabase Storage 媒体和模型文件。
- 不恢复 AWS S3 runtime media。
- 不恢复 SQLite runtime fallback。

游客可读媒体条件：

- `purpose = preview`
- 或 `publicAccess = true`

私有生成资产：

- 通常为 `purpose = asset` 或 `purpose = model`。
- 不应该直接暴露给游客。

## 15. 积分、下载和计费

当前产品决策：

- 当前导入的公开模型预览和下载不需要扣积分。
- 未来预览积分和下载积分应该由后台设置分别控制。
- 下载如果启用扣费，必须在后端执行，失败时要自动退款。

主要数据：

- `credits`
- `credit-transactions`
- `credit-products`
- `billing-subscriptions`
- `shopify-payments`

主要注意事项：

- 所有积分变动要走 ledger 服务。
- Stripe webhook 必须保持签名验证和幂等处理。
- 不要在前端决定是否扣积分。

## 16. 常用验证命令

源码语言检查：

```bash
node scripts/audit-source-language.mjs
```

TypeScript：

```bash
D:\web\payload-local-demo\node_modules\.bin\tsc.CMD --noEmit
```

单元测试：

```bash
node scripts/run-unit-tests.mjs
```

Smoke test：

```bash
node scripts/smoke-test.mjs
```

Payload 类型生成：

```bash
D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:types
```

Payload 数据库 schema 快照：

```bash
D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:db-schema
```

Payload admin import map：

```bash
D:\web\payload-local-demo\node_modules\.bin\payload.CMD generate:importmap
```

什么时候必须运行生成命令：

- 修改 collection/global/schema 后运行 `generate:types` 和 `generate:db-schema`。
- 修改 Payload admin component path 后运行 `generate:importmap`。
- 修改权限、hook、endpoint 后至少运行 TypeScript 和相关测试。

## 17. 本次审计已修复的小问题

2026-05-07 审计中已经完成：

- `/test` 改成轻量页面导航。
- `/api/locale` 限制 redirect 只能跳回站内相对路径，避免开放重定向。
- 前端 layout 去掉外层 `<main>`，避免嵌套 main landmark。
- `/results/[taskCode]` 的进度条限制在 0 到 100。
- 结果页下载按钮根据真实格式渲染。
- `/pricing` 和 `/showcase` 在本地数据库读取失败时显示空状态，避免公开 500。
- 修正 `INFOMATION` 拼写为 `Information`。
- 清理已确认无用的旧 `GenerateForm` 和 `personal-center-legacy` 文件。

## 18. 当前不要直接删除的内容

以下内容暂时保留：

- AI 记忆文档。
- `media/**` 本地媒体目录，需要先和数据库/media URL 交叉核对。
- `.env*`、Vercel local env、备份环境文件，需要所有者确认。
- `public/home-test-assets/**`、`public/ui-lab/**`、`public/ui/**`，其中仍有正式页面或 UI-lab 派生页面使用的资产。
- 历史 migrations、生成 schema 和测试文件。

## 19. 需要你后续讨论的大问题

以下是审计发现的 P1 级问题，不建议在没有产品/权限方案确认前直接修：

1. Payload REST 直接创建记录时，部分 owner/user 字段可能被客户端提交，需要设计“创建时强制绑定当前用户”的方案。
2. `Media.owner/purpose/publicAccess`、评论/点赞/收藏/任务事件/地址等身份字段需要复核直接 REST 写入边界。
3. `/model-detail` 对缺失或错误 `id` 的静态演示回退需要产品决策。
4. `/workbench/models/[id]` 仍有静态/演示内容，需要单独正式化。

建议处理方式：

- 先确认权限产品规则。
- 再添加 create-specific access 或 beforeChange hook。
- 再添加直接 REST 安全回归测试。
- 最后运行完整验证。

## 20. 日常操作建议

运营内容：

- 首页、模型包、公开模型、媒体、价格展示和部分平台设置优先在 Payload Admin 管理。

开发调试：

- 先看 `/test` 页面盘点所有路由。
- 再用具体页面和 API 验证业务流程。

发布前：

- 运行源码语言检查、TypeScript、单元测试和 smoke test。
- 如果改过 Payload schema，生成 types 和 db schema。
- 检查公开页面不要依赖私有媒体。
- 检查 Workbench 生成和账户功能必须登录后才能执行。
