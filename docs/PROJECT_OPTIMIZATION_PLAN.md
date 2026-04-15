# 项目全量分析与优化方案（Payload Local Demo）

## 1. 项目现状概览

### 1.1 技术栈与运行形态
- 前端与服务端：`Next.js 16` + `React 19` + TypeScript。
- CMS 与业务数据：`Payload 3.82.1`，当前数据库为 `SQLite`（本地文件 `payload.db`）。
- 业务域：AI 任务生成、模型管理、积分账户、打印订单、支付回调、营销内容管理。

### 1.2 代码结构（按职责）
- 配置组装：`src/payload.config.ts`
- 权限规则：`src/access/index.ts`
- 业务模型：`src/collections/*`
- 流程编排：`src/lib/aiTaskFlow.ts`、`src/lib/printOrderFlow.ts`、`src/lib/adminDashboard.ts`
- API 入口：`src/endpoints/*`
- 前端界面：`src/app/(frontend)/*`
- Payload 宿主：`src/app/(payload)/*`

### 1.3 结论（当前成熟度）
- 该项目已具备完整的“产品闭环最小形态”（内容 + 生产 + 订单 + 支付 + 管理后台）。
- 主要短板集中在：**安全边界显式化、性能扩展性、可观测性与自动化测试**。

---

## 2. 核心问题清单（按优先级）

## P0（必须优先处理）

### 2.1 Local API 未统一显式 `overrideAccess: false`
- 典型位置：`src/lib/aiTaskFlow.ts`、`src/hooks/createDefaultCreditAccount.ts`
- 现象：多个 `req.payload.find/create/update/findByID` 仅传 `req`，未显式设置 `overrideAccess: false`。
- 风险：在 Payload 语义中，若未显式约束，存在绕过访问控制的风险窗口（尤其是带 `user` 语义的场景）。
- 目标：所有用户上下文请求统一显式声明，形成安全编码基线。

### 2.2 媒体上传策略过宽
- 位置：`src/collections/Media.ts`
- 现象：`upload.mimeTypes` 允许 `*/*`。
- 风险：上传类型缺乏白名单控制，易成为恶意文件托管入口；且当前 `read: () => true`，曝光面较大。
- 目标：收紧 MIME 白名单，并按用途（input/preview/model/document）分层控制。

### 2.3 Webhook 校验机制偏弱
- 位置：`src/endpoints/aiTasks.ts`
- 现象：当前以共享密钥比对为主。
- 风险：缺乏 timestamp + HMAC + nonce 的抗重放体系。
- 目标：实现签名、时窗、重放拦截三段式校验。

## P1（近期迭代）

### 2.4 轮询触发全页面刷新
- 位置：`src/app/(frontend)/_components/ResultStatus.tsx`
- 现象：每 2.5 秒请求 `/sync` 后执行 `router.refresh()`。
- 风险：并发增大时 SSR 和数据库查询压力迅速上升，前端体验易抖动。
- 目标：改为局部状态更新 + 退避轮询 + 终态停止。

### 2.5 运营看板聚合查询较重
- 位置：`src/lib/adminDashboard.ts`
- 现象：单次请求内有多组 `count/find` 统计，且无缓存层。
- 风险：数据规模增长后响应时延和数据库负担会明显上升。
- 目标：增加短 TTL 缓存（30-60 秒）与查询降维策略。

### 2.6 关键筛选字段索引不足
- 范围：`generation-tasks`、`print-orders`、`shopify-payments`、`credits`
- 风险：`status/createdAt/user/providerTaskId/linkedOrder` 等高频字段查询退化。
- 目标：补齐集合层索引策略，提升筛选与排序稳定性。

## P2（中期优化）

### 2.7 测试基线缺失
- 现状：`src` 下未发现 `*.test.*` 或 `*.spec.*`。
- 风险：核心流程回归不可控（任务状态流转、支付同步、权限校验）。
- 目标：先建“最小可用测试金字塔”（lib 单测 + endpoint 集成测试）。

### 2.8 可观测性薄弱
- 范围：`src/endpoints/*`、`src/lib/*`
- 现状：结构化日志、请求链路与错误码体系尚未统一。
- 风险：线上定位成本高，无法形成有效告警与审计闭环。
- 目标：统一日志字段（requestId/taskId/orderId/userId）与错误分级。

---

## 3. 分阶段优化路线图

### 第一阶段（1-2 周）：安全与稳定性兜底
1. 补齐 Local API 显式访问控制参数（重点：`overrideAccess: false`）。
2. 收紧 `Media` 上传白名单，明确公开/私有资产边界。
3. 升级 Webhook 签名校验与重放防护。
4. 梳理编码异常文案，统一 UTF-8 文本与错误消息模板。

**阶段验收标准**
- 高风险路径完成安全基线检查（人工 + 静态扫描）。
- 未授权访问与伪造 webhook 的回归用例全部失败（符合预期拦截）。

### 第二阶段（2-4 周）：性能与扩展能力
1. 优化任务状态轮询（退避、局部更新、终态停止）。
2. 为运营看板引入缓存层，并减少重复统计查询。
3. 为高频查询字段补索引，核验慢查询改进。

**阶段验收标准**
- 任务列表与结果页平均响应时间下降。
- 看板接口在并发下保持稳定（无明显长尾抖动）。

### 第三阶段（4-6 周）：工程化与质量体系
1. 建立核心流程测试套件（AI 流程、订单支付、权限边界）。
2. 接入结构化日志与关键业务指标埋点。
3. 输出 SLO / 告警阈值与运维手册初版。

**阶段验收标准**
- 核心流程具备自动化回归能力。
- 关键失败场景可追踪、可告警、可快速复盘。

---

## 4. 具体落地清单（建议按 Issue 拆分）

1. **SEC-001**：扫描并补齐所有用户语义 Local API 的 `overrideAccess: false`。
2. **SEC-002**：收紧 `Media` 上传与读取策略（按业务用途分层）。
3. **SEC-003**：实现 webhook 签名验证中间层（HMAC + timestamp + nonce）。
4. **PERF-001**：重构 `ResultStatus` 为“局部刷新 + 退避轮询”。
5. **PERF-002**：`adminDashboard` 增加缓存与查询收敛。
6. **PERF-003**：集合索引清单与迁移脚本（按字段逐步上线）。
7. **ENG-001**：新增 `lib` 单测（状态机/支付流/权限边界）。
8. **OBS-001**：统一日志格式与错误码规范。

---

## 5. KPI 与验收指标（建议）

- 安全：高危接口未授权访问拦截率 100%。
- 性能：关键页面 P95 响应时延下降 30%+（以当前基线对比）。
- 稳定性：核心流程错误率下降，且可定位率达到 95%+。
- 质量：核心域测试覆盖率达到可维护阈值（先以“流程覆盖”而非行覆盖为目标）。

---

## 6. 实施注意事项（Payload 项目）

- 在 hooks 内进行嵌套操作时，持续传递 `req` 以保持事务一致性。
- 所有带用户上下文的 Local API 调用，统一显式设置 `overrideAccess: false`。
- 涉及 collection/global schema 改动后，执行：
  - `pnpm run generate:types`
  - `pnpm run generate:importmap`
  - `pnpm exec tsc --noEmit`

---

## 7. 建议执行顺序（最小风险）

1. 先做 P0 安全基线（不改业务行为，仅补边界）。
2. 再做 P1 性能改造（小步提交，逐项压测）。
3. 最后补 P2 测试与可观测性（沉淀长期收益）。

该顺序可在不明显影响当前业务流的前提下，优先降低线上风险并提升后续迭代效率。
