export const adminZh = {
  collections: {
    addresses: { plural: '地址簿', singular: '地址' },
    announcements: {
      plural: '公告',
      singular: '公告',
      description: '管理首页公告、系统通知与短内容提示。',
    },
    auditLogs: {
      plural: '审计日志',
      singular: '审计日志',
      description: '集中记录高风险后台操作、账务动作、Webhook 处理和配置变更。',
    },
    billingSubscriptions: {
      plural: '订阅记录',
      singular: '订阅记录',
      description: '记录 Stripe 订阅、当前周期和积分发放状态。',
    },
    creditProducts: { plural: '积分商品', singular: '积分商品' },
    credits: {
      plural: '积分账户',
      singular: '积分账户',
      description: '管理用户积分余额、预扣与累计消费。',
    },
    creditTransactions: {
      plural: '积分流水',
      singular: '积分流水',
      description: '记录每一笔积分变动。',
    },
    generationTasks: {
      plural: '生成任务',
      singular: '生成任务',
      description: '跟踪 AI 生成任务的排队、状态、回调和结果。',
    },
    homepageItems: {
      plural: '首页内容项',
      singular: '首页内容项',
      description: '管理首页展示卡片、板块内容、排序、显示隐藏和发布时间。',
    },
    media: {
      plural: '媒体资源',
      singular: '媒体资源',
      description: '图片、预览图和 3D 文件统一存放处。',
    },
    modelBundles: {
      plural: '专题包',
      singular: '专题包',
      description: '管理员可从用户模型中挑选多个模型组成专题包或合集。',
    },
    models: {
      plural: '模型',
      singular: '模型',
      description: '管理生成后的模型资产、文件格式和打印属性。',
    },
    payments: {
      plural: '支付记录',
      singular: '支付记录',
      description: '统一记录平台支付流水，当前以 Stripe 为主并保留 Shopify 兼容字段。',
    },
    posts: {
      plural: '文章与活动',
      singular: '文章/活动',
      description: '管理文章、活动帖与公告型长内容。',
    },
    printOrders: {
      plural: '打印订单',
      singular: '打印订单',
      description: '管理模型打印订单、收货信息和生产状态。',
    },
    taskEvents: { plural: '任务事件', singular: '任务事件' },
    users: {
      plural: '用户',
      singular: '用户',
      description: '平台用户、角色、资料与账户总览。',
    },
  },
  globals: {
    aiProviderSettings: {
      label: 'AI 提供方设置',
      description:
        '管理非敏感的 AI 提供方元数据。存储配置已迁移到独立的“存储设置”，真实密钥仍应保存在部署环境变量中。',
    },
    emailSettings: {
      label: '邮箱设置',
      description:
        '管理邮件品牌、发件显示信息与业务邮件文案。SMTP 账号密码仍通过环境变量配置。',
    },
    homepageContent: {
      label: '首页内容',
    },
    runtimeDeployment: {
      label: '运行时部署',
      description:
        '管理部署阶段的数据库和应用运行时变量。敏感密钥仍应保存在宿主平台环境变量中。',
    },
    securitySettings: {
      label: '安全设置',
      description:
        '在这里管理非敏感的请求来源和远程资源白名单。运行时安全检查会优先读取这个 Global，迁移期才会回退到旧环境变量。',
    },
    siteSettings: {
      label: '站点设置',
      description:
        '统一管理站点品牌、导航、定价、积分套餐与邮件通知文案。',
    },
    storageSettings: {
      label: '存储设置',
      description:
        '管理非敏感的对象存储配置。运行时代码只从这里读取 bucket、region、prefix、baseURL 和 signedDownloads，真实密钥仍保存在环境变量中。',
    },
  },
  groups: {
    aiProduction: 'AI 生产',
    commerce: '商务',
    content: '内容',
    platform: '平台',
    platformGovernance: '平台治理',
  },
  dashboard: {
    actions: {
      viewQueueItem: '查看',
    },
    cards: {
      abnormalCreditAccounts: { label: '积分异常账户', note: '低余额或存在预扣' },
      failedTasks: { label: '今日失败任务', note: '失败 / 超时' },
      newOrdersToday: { label: '今日新订单', note: '新增打印订单' },
      newTasksToday: { label: '今日新任务', note: '提交的生成任务' },
      pendingOrders: { label: '待推进订单', note: '待支付 / 待履约' },
      successfulPaymentsToday: { label: '今日成功支付', note: '已支付记录' },
      succeededTasksToday: { label: '今日成功任务', note: '成功完成' },
    },
    empty: {
      failedTasks: '当前没有失败或超时任务。',
      highBalance: '当前没有高余额账户。',
      lowBalance: '当前没有低余额账户。',
      orders: '当前没有需要跟进的订单。',
      payments: '当前没有支付异常记录。',
    },
    headings: {
      exceptionReview: '异常巡检',
      operationsConsole: '运营总览',
      operationsOverview: '任务、订单、支付与积分概览',
      paymentsAndBalances: '支付与余额看板',
      tasksAndOrders: '任务与订单异常',
    },
    labels: {
      generatedAt: '生成时间',
      paymentRecords: '支付记录',
      totalOrders: '订单总数',
      totalTasks: '任务总数',
      totalUsers: '用户总数',
    },
    meta: {
      balance: '余额',
      noLinkedUser: '未关联用户',
      reserved: '预扣',
    },
    queues: {
      failedTasks: '失败任务队列',
      highBalance: '高余额账户',
      lowBalance: '低余额账户',
      orderExceptions: '订单异常队列',
      paymentExceptions: '支付异常队列',
    },
    summary: '把任务、订单、支付、积分和异常集中到一个总览里，方便运营快速判断优先事项。',
    titles: {
      orderStatusDistribution: '订单状态分布',
      orderTrend: '订单走势（最近 7 天）',
      paymentTrend: '支付走势（最近 7 天）',
      taskStatusDistribution: '任务状态分布',
      taskTrend: '任务走势（最近 7 天）',
    },
  },
  languageSwitcher: {
    chinese: '中文',
    documentHint: '这里只切换后台界面语言，本地化内容请使用文档自己的语言切换器。',
    english: 'English',
    hint: '这里只影响后台导航、标签和仪表板文案。',
    label: '界面语言',
  },
  status: {
    common: { justNow: '刚刚', unknown: '未知' },
    order: {
      cancelled: '已取消',
      completed: '已完成',
      inProduction: '生产中',
      paid: '已支付',
      pendingPayment: '待支付',
      shipped: '已发货',
    },
    payment: {
      failed: '失败',
      paid: '已支付',
      pending: '待支付',
      refunded: '已退款',
    },
    task: {
      failed: '失败',
      processing: '处理中',
      queued: '排队中',
      succeeded: '已完成',
      timeout: '超时',
    },
  },
} as const
