# 生产部署准备说明（2026-04-15）

## 推荐生产架构
- App: Next.js + Payload
- DB: PostgreSQL（推荐 AWS RDS）
- Storage: AWS S3
- Email: SMTP（Nodemailer）
- Payment: Stripe
- AI: Meshy

---

## 必备环境变量

### 核心
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_PROVIDER=postgres`
- `DATABASE_URL` 或 AWS RDS 相关变量

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Meshy / AI
- `MESHY_API_KEY`（或后台配置）
- `AI_WEBHOOK_SECRET` / `PAYLOAD_AI_WEBHOOK_SECRET`

### SMTP
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

### S3
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_REGION`
- `S3_PREFIX`
- `S3_CDN_URL`（可选）
- `S3_SIGNED_DOWNLOADS=true`

---

## 推荐部署前动作

### 1. 数据库
- 使用 Postgres，不建议正式环境继续使用 `payload.db`
- 执行：
  - `pnpm run generate:types`
  - `pnpm payload generate:db-schema`
- 首次部署前确认 schema 与环境一致

### 2. 构建校验
执行：
- `pnpm exec tsc --noEmit`
- `pnpm build`

### 3. 媒体与模型
- 确认上传后自动同步到 S3
- 确认前台预览与详情页走受控访问路径
- 确认 S3 私有对象不能被匿名直接访问

### 4. 后台设置
上线后优先检查：
- `site-settings`
  - 站点名
  - 说明文案
  - 订阅方案
  - 支付提供方
  - 邮件模板
- `ai-provider-settings`
  - Meshy Key
  - webhook secret
- `runtime-deployment-settings`
  - 数据库 / 存储相关环境说明

---

## 冒烟测试建议

### 用户侧
1. 注册
2. 邮箱验证
3. 登录
4. 发起生成
5. 查看结果
6. 下载模型
7. 创建打印订单
8. 完成支付
9. 后台查看记录

### 支付侧
1. 新订阅
2. webhook 同步
3. 积分发放
4. Billing Portal
5. 支付取消
6. 重复 webhook

### 异常侧
1. 积分不足提交生成
2. 积分不足下载模型
3. 模型资源拉取失败退款
4. AI 回调异常
5. Stripe webhook 签名错误

---

## 本仓库当前不建议直接提交到生产的内容
- `payload.db`
- `dev-server.log`
- 本地测试日志
- 临时测试脚本输出
- 任何测试 API Key / Access Key

---

## 建议发布方式
### 方案 A：单机 / VPS
- PM2 或 systemd 托管 Node 进程
- Nginx 反代
- S3 + RDS 使用云服务

### 方案 B：云平台
- App 部署到 Vercel / 自建容器平台
- Payload 与 DB/S3/SMTP 走独立正式服务

---

## 上线后第一周重点观察
- 支付成功率
- webhook 失败率
- AI 生成成功率
- 下载失败率
- S3 带宽与存储增长
- 邮件退信率
