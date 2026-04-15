# Site Audit 2026-04-14

## 已执行检查
- `pnpm tsc --noEmit`
- `pnpm build`
- `pnpm lint`
- `pnpm test:smoke`
- 本地路由耗时采样
- 运行日志审计
- SQLite schema 漂移检查

## 当前结论

### 基础可用性
- 公开页面和关键接口已可访问。
- 构建通过。
- Lint 可运行，当前剩余 warning 主要集中在：
  - 少量 `any`
  - 少量原生 `<img>`
  - 少量未使用变量

### 发现的主要问题
1. SQLite schema 曾发生漂移
   - 用户表与锁定文档关系表和最新模型结构不同步。
   - 这类问题会导致登录或后台读取时直接 500。

2. 开发态邮件配置性能差
   - 原先会在构建阶段反复生成 Ethereal 账号。
   - 已改为 `jsonTransport`。

3. 3D Viewer 运行时告警较多
   - `PCFSoftShadowMap deprecated`
   - `THREE.Clock deprecated`
   - `WebGLRenderer: Context Lost`
   - 这些问题主要影响体验稳定性和控制台噪音。

4. Showcase 页面明显偏慢
   - 本地采样约 2s。
   - 主要怀疑点：公开模型查询、预览图 URL 处理、图片加载策略。

5. 环境配置仍偏开发态
   - `PAYLOAD_SECRET` 仍是占位值风格。
   - `.env` 中仍存在测试型 Stripe key。

## 已新增脚本
- `pnpm test:smoke`
- `pnpm cleanup:temp`

## 优先优化建议

### P0
- 给 SQLite schema 增加自动自检或修复脚本。
- 上线前强制校验 `.env` 中的 `PAYLOAD_SECRET`、Stripe、SMTP、APP_URL`。

### P1
- 优化 `showcase` 页面查询与图片加载。
- 把 `<img>` 改为 `next/image` 或统一图片组件。
- 控制 3D Viewer 默认加载成本，避免首页和结果页过重。

### P2
- 收紧 `overrideAccess: true` 的使用场景。
- 为关键接口补基于脚本的 API smoke test。
- 为用户中心和订单流程补 Playwright E2E。
