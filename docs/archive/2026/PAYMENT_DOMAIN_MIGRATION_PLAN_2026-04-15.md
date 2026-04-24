# 支付领域命名迁移说明（2026-04-15）

## 当前结论

系统当前线上支付主通道是 **Stripe**，但历史数据层仍保留以下遗留命名：

- collection slug: `shopify-payments`
- field: `shopifyCheckoutId`
- field: `shopifyCheckoutUrl`
- field: `shopifyOrderId`

这些字段名已经不再准确表达当前支付实现，但它们已经进入：

- Payload schema
- 自动生成类型
- 数据库表结构
- 前后端调用路径
- 历史数据记录

因此本轮修复采取 **无损收口**，而不是直接重命名数据库字段。

---

## 本轮已完成的无损修复

### 1. 领域语义层
新增：

- `src/lib/paymentRecords.ts`

提供中性读取函数：

- `getPaymentCheckoutUrl()`
- `getPaymentSessionId()`
- `getPaymentOrderReference()`
- `getPaymentProviderLabel()`

前端和接口层优先通过这些函数读取支付信息，不再直接向用户暴露 `shopify*` 命名。

### 2. 后台展示层修复
已调整：

- `src/collections/ShopifyPayments.ts`
- `src/collections/PrintOrders.ts`

修复方式：

- collection 标签改为“支付记录” / “打印订单”
- 字段 label 改为“支付结算链接（兼容旧字段）”等中性名称
- admin description 明确说明：当前 Stripe 生效，Shopify 字段名仅为兼容保留

### 3. 前台/接口文案修复
已调整：

- `src/endpoints/printOrders.ts`
- `src/app/(frontend)/dashboard/orders/page.tsx`
- `src/app/(frontend)/dashboard/orders/[id]/page.tsx`

修复方式：

- 用户界面统一使用“支付会话 / 订单参考 / 继续支付”等中性表达
- 不再在用户可见界面直接出现 Shopify 字段语义

---

## 为什么这轮不直接改字段名

如果直接把：

- `shopify-payments` -> `payments`
- `shopifyCheckoutId` -> `paymentSessionId`
- `shopifyCheckoutUrl` -> `paymentCheckoutUrl`
- `shopifyOrderId` -> `paymentOrderReference`

会连带影响：

1. Payload collection slug
2. 数据库 schema 与迁移
3. 自动生成类型
4. 历史订单数据读取
5. webhook / sync / print order 流程
6. 可能存在的管理后台筛选、导出、运营流程

这类改动需要单独做一轮 **带迁移脚本、回滚策略、数据校验** 的结构迁移，不能在当前连续修复中直接硬改。

---

## 下一阶段推荐迁移路径

### Phase A：双写兼容
新增新字段：

- `paymentSessionId`
- `paymentCheckoutUrl`
- `paymentOrderReference`
- collection `payments`（或保留旧 collection，新增中性字段）

代码层：

- 新写入逻辑同时写新旧字段
- 读取逻辑优先新字段，兼容旧字段

### Phase B：数据回填
迁移历史数据：

- 将旧字段值批量回填到新字段
- 校验记录数、空值、唯一性

### Phase C：切换读取源

- 前后台全部切到新字段
- 保留旧字段只读一段时间

### Phase D：移除旧字段

- 最后再删旧字段/旧 slug 或建立正式别名迁移方案

---

## 当前建议

在正式上线前，如果时间有限：

- 当前这轮“无损收口”已经足够降低认知混乱
- 可以先继续业务开发与上线准备
- 等支付域稳定后，再做正式数据迁移
