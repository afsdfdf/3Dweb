# Development Log

## 2026-04-14

### 全站审计与修复
- 修复 `tsc --noEmit` 被 `.next` 生成类型误伤的问题。
- 修复 ESLint flat config 崩溃问题，恢复 `pnpm lint` 可执行。
- 修复 `payload.config.ts` 邮件适配器改动时引入的语法错误。
- 将开发态邮件适配器改为 `jsonTransport`，避免构建阶段重复创建 Ethereal 账号拖慢速度。
- 新增 `scripts/smoke-test.mjs` 并添加 `pnpm test:smoke`。
- 新增 `scripts/cleanup-temp.cjs` 并添加 `pnpm cleanup:temp`。
- 清理历史临时日志、预览目录、测试上传文件等临时产物。

### 审计发现
- 公开路由 smoke test 通过：`/`、`/login`、`/register`、`/generate`、`/pricing`、`/showcase`、`/api/users/me`。
- Three.js 仍存在若干运行时告警：`PCFSoftShadowMap deprecated`、`THREE.Clock deprecated`、`Context Lost`。
- 本地数据库存在 schema 漂移历史，需持续确保与最新集合结构同步。
- `.env` 中仍存在默认/测试配置，上线前必须替换。

### 性能观察
- 本地测得页面耗时大致为：
  - `/` 约 297ms
  - `/login` 约 158ms
  - `/pricing` 约 221ms
  - `/generate` 约 169ms
  - `/showcase` 约 1998ms
- `showcase` 明显偏慢，应优先优化数据查询与图片加载策略。
