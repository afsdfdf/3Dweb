import { adminEn } from './en'

type AnyRecord = Record<string, unknown>

const mergeAdminText = <T extends AnyRecord>(base: T, override: AnyRecord): T => {
  const output: AnyRecord = { ...base }

  Object.entries(override).forEach(([key, value]) => {
    const baseValue = output[key]

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === 'object' &&
      !Array.isArray(baseValue)
    ) {
      output[key] = mergeAdminText(baseValue as AnyRecord, value as AnyRecord)
      return
    }

    output[key] = value
  })

  return output as T
}

const adminZhOverrides = {
  collections: {
    addresses: { plural: '地址簿', singular: '地址' },
    announcements: { plural: '公告', singular: '公告', description: '管理首页公告、系统通知和短提示文案。' },
    avatarFrameStyles: { plural: '头像框样式', singular: '头像框样式', description: '管理用户可选头像框的元数据、缩略图、解锁规则和排序。' },
    auditLogs: { plural: '审计日志', singular: '审计日志', description: '集中记录高风险后台操作、财务动作、Webhook 处理和配置变更。' },
    billingSubscriptions: { plural: '订阅记录', singular: '订阅记录', description: '跟踪 Stripe 订阅、账期和积分发放状态。' },
    creditProducts: { plural: '积分商品', singular: '积分商品' },
    credits: { plural: '积分账户', singular: '积分账户', description: '管理用户积分余额、预留积分和累计使用情况。' },
    creditTransactions: { plural: '积分流水', singular: '积分流水', description: '记录每一次积分余额变动。' },
    generationTasks: { plural: '生成任务', singular: '生成任务', description: '跟踪 AI 生成任务的排队、状态、回调和输出。' },
    homepageItems: { plural: '首页内容项', singular: '首页内容项', description: '管理首页卡片、展示位置、排序、可见性和发布时间。' },
    media: { plural: '媒体资源', singular: '媒体资源', description: '统一存放图片、预览图和 3D 文件。' },
    modelBundles: { plural: '模型合集', singular: '模型合集', description: '将多个模型组合为合集、精选组和专题系列。' },
    models: { plural: '模型', singular: '模型', description: '管理生成后的模型资产、文件格式和打印属性。' },
    payments: { plural: '支付记录', singular: '支付记录', description: '集中管理平台支付记录。Stripe 是当前启用的支付通道，Shopify 兼容字段保留给后续迁移。' },
    posts: { plural: '文章与活动', singular: '文章 / 活动', description: '管理文章、活动内容和详情页长内容。' },
    printOrders: { plural: '打印订单', singular: '打印订单', description: '管理模型打印订单、收货信息和生产状态。' },
    taskEvents: { plural: '任务事件', singular: '任务事件' },
    users: { plural: '用户', singular: '用户', description: '管理平台用户、角色、资料和账户状态。' },
  },
  globals: {
    shared: {
      changeSummary: '变更摘要',
      effectiveMode: '生效模式',
      enabled: '已启用',
      lastModifiedBy: '最后修改人',
      lastRotatedAt: '最后轮换时间',
      lastValidatedAt: '最后验证时间',
    },
    aiProviderSettings: {
      label: 'AI 提供方设置',
      description: '在这里管理非敏感的 AI 提供方元数据。存储设置已迁移到独立的存储设置，全量密钥必须继续保存在托管环境变量中。',
      tabs: {
        general: { label: '通用' },
        imageGenerationAPI: { label: '图像生成 API' },
        llmAPI: { label: 'LLM API' },
        model3DAPI: { label: '3D 模型 API' },
      },
      fields: {
        defaultProvider: { label: '默认提供方' },
        mockMode: '模拟模式',
        credentialsNotice: { label: '密钥管理提示' },
        polling: { label: '轮询', fields: { intervalSeconds: '间隔秒数', timeoutMinutes: '超时分钟数' } },
        creditRules: { label: '积分规则', fields: { reserveOnSubmit: '提交时预留积分', refundOnFailure: '失败时退还积分' } },
        model3DAPI: {
          label: '3D 模型 API',
          fields: {
            apiKeyHint: '环境变量提示',
            baseURL: '基础 URL',
            provider: { label: '提供方' },
            statusPath: '状态路径',
            submitPath: '提交路径',
          },
        },
        meshy: {
          label: 'Meshy',
          fields: {
            apiKey: 'Meshy API 密钥',
            apiKeyDescription: '可选。留空时运行时会回退到 MESHY_API_KEY 环境变量。',
            baseURL: 'Meshy API 基础 URL',
            credentialsSource: '凭据来源',
            enablePBR: '启用 PBR 输出',
            imageEnhancement: '启用图像增强',
            imageTo3DAiModel: { label: '图生 3D 模型' },
            moderation: '启用内容审核',
            removeLighting: '移除烘焙光照',
            shouldTexture: '生成贴图',
            textTo3DAiModel: { label: '文生 3D 模型' },
          },
        },
        imageGenerationAPI: {
          label: '图像生成 API',
          fields: {
            apiKeyHint: '环境变量提示',
            baseURL: '基础 URL',
            model: '默认模型',
            provider: { label: '提供方' },
            statusPath: '状态路径',
            submitPath: '提交路径',
          },
        },
        llmAPI: {
          label: 'LLM API',
          fields: {
            apiKeyHint: '环境变量提示',
            baseURL: '基础 URL',
            model: '默认模型',
            provider: { label: '提供方' },
            statusPath: '状态路径',
            submitPath: '提交路径',
          },
        },
        providers: {
          label: '提供方注册表',
          description: '保留的旧版注册元数据，用于兼容已有后台记录。',
          fields: { apiKeyHint: '环境变量提示', baseURL: '基础 URL', provider: { label: '提供方' }, statusPath: '状态路径', submitPath: '提交路径' },
        },
      },
      options: {
        imageProvider: { custom: '自定义', fal: 'Fal', openai: 'OpenAI', replicate: 'Replicate' },
        llmProvider: { anthropic: 'Anthropic', custom: '自定义', google: 'Google', openai: 'OpenAI' },
        meshyModel: { latest: 'latest', meshy5: 'meshy-5', meshy6: 'meshy-6' },
        provider: { custom: '自定义', meshy: 'Meshy', tripo: 'Tripo' },
      },
    },
    emailSettings: {
      label: '邮件设置',
      description: '管理邮件品牌、发件人展示信息和业务邮件文案。SMTP 凭据仍然通过环境变量配置。',
      tabs: {
        authEmails: { label: '认证邮件', fields: { templates: { label: '认证邮件文案', fields: { forgotPassword: { label: '密码重置' }, verify: { label: '邮箱验证' }, welcome: { label: '欢迎邮件' } } } } },
        businessNotifications: { label: '业务通知', fields: { businessTemplates: { label: '业务邮件文案', fields: { orderPaid: { label: '订单支付成功' }, subscriptionSuccess: { label: '订阅成功' } } } } },
        senderInfo: {
          label: '发件人信息',
          fields: {
            branding: { label: '品牌展示', fields: { footerText: '邮件页脚文案', productName: '产品名称' } },
            sender: { label: '发件人信息', fields: { fromAddress: '发件邮箱', fromName: '发件人名称', replyTo: '回复地址' } },
          },
        },
      },
      shared: { ctaLabel: '按钮文案', intro: '正文文案', subject: '主题' },
    },
    homepageContent: {
      label: '首页内容',
      shared: { eyebrow: '眉标', href: '链接', label: '标签', text: '正文', title: '标题' },
      fields: {
        entrySection: { label: '入口区块' },
        faq: { label: '常见问题', fields: { answer: '回答', question: '问题' } },
        faqSection: { label: 'FAQ 区块' },
        featuredWorks: { label: '精选方向', fields: { category: '分类', summary: '摘要', tone: { label: '色调', options: { blue: '蓝色', pink: '粉色', violet: '紫色' } } } },
        hero: { label: '首屏', fields: { eyebrow: '眉标', primaryCTA: { label: '主按钮' }, secondaryCTA: { label: '次按钮' }, subtitle: '副标题', title: '标题' } },
        introBand: { label: '定位介绍' },
        processSection: { label: '流程区块' },
        processSteps: { label: '流程步骤', fields: { step: '步骤编号', text: '描述' } },
        serviceBlocks: { label: '服务卡片', fields: { text: '描述' } },
        serviceIntro: { label: '服务介绍' },
        useCases: { label: '使用场景', fields: { label: '使用场景' } },
      },
    },
    runtimeDeployment: {
      label: '运行时部署',
      description: '管理部署阶段的数据库和应用运行变量。密钥仍必须保存在托管平台环境变量中。',
      tabs: {
        appRuntime: {
          label: '应用运行时',
          fields: {
            nextPublicAppUrl: 'NEXT_PUBLIC_APP_URL',
            payloadSecretRotationNote: { label: '密钥轮换备注', description: '可选。记录当前 PAYLOAD_SECRET 存放位置及轮换时间。' },
          },
        },
        databaseRuntime: {
          label: '数据库运行时',
          fields: {
            awsRdsDbName: '旧版组合 Postgres 数据库',
            awsRdsHost: '旧版组合 Postgres 主机',
            awsRdsPort: '旧版组合 Postgres 端口',
            awsRdsSslMode: { label: '旧版组合 Postgres SSL 模式', options: { disable: 'disable', require: 'require', verifyFull: 'verify-full' } },
            awsRdsSslRejectUnauthorized: '旧版组合 Postgres SSL 拒绝未授权证书',
            awsRdsUsername: '旧版组合 Postgres 用户名',
            databaseConnectionMode: { label: '连接模式', options: { awsRdsFields: '旧版组合 Postgres 变量', databaseUrl: '直接使用 DATABASE_URL' } },
            databaseSecurityChecklist: { label: '安全检查清单', description: '可选。记录当前安全组、公开访问状态或生产服务器允许 IP 等运维备注。' },
            databaseUrlTemplate: { label: 'DATABASE_URL 模板', description: '可粘贴不含真实密码的部署 DATABASE_URL 模板。Supabase Postgres 是推荐的生产数据库。' },
          },
        },
      },
    },
    securitySettings: {
      label: '安全设置',
      description: '在这里管理非敏感的请求来源和远程资源白名单。运行时安全检查优先读取此全局配置，缺失时再回退到旧环境变量白名单。',
      tabs: {
        mutationOrigins: { label: '变更请求来源', fields: { allowedMutationOrigins: { label: '允许的来源', description: '默认留空。每行添加一个绝对来源，例如 https://app.example.com。本地开发在非生产环境仍允许无 Origin 请求。', fields: { origin: '来源' } } } },
        remoteAssets: { label: '远程资源', fields: { allowedRemoteAssetHosts: { label: '允许的主机模式', description: '默认留空。可添加 cdn.example.com 或 example.com 等主机名，子域会自动匹配。', fields: { host: '主机模式' } } } },
        authentication: {
          label: '认证',
          fields: {
            registrationVerificationMode: {
              label: '注册验证模式',
              description: '邮箱验证码是默认注册流程。邮箱链接用于保留旧版 Payload 验证链接流程。',
              options: { emailCode: '邮箱验证码', emailLink: '邮箱链接' },
            },
            registrationCodeExpiresMinutes: {
              label: '注册验证码过期分钟数',
              description: '仅在注册验证模式为邮箱验证码时使用。',
            },
          },
        },
      },
    },
    siteSettings: {
      label: '站点设置',
      description: '统一管理站点品牌、导航、定价、积分套餐和通知文案。',
      tabs: {
        emailSettings: { label: '邮件设置', fields: { emailSettings: { label: '邮件设置' } } },
        pricingAndCredits: {
          label: '定价与积分',
          fields: {
            creditPackages: { label: '积分套餐', fields: { credits: '积分', currency: '币种', price: '价格', shopifyVariantId: 'Shopify 变体 ID', title: '标题' } },
            generationPricing: { label: '生成定价', fields: { downloadCredits: '下载积分', hybridCredits: '混合输入积分', imageCredits: '图像输入积分', textCredits: '文本输入积分' } },
            paymentProviders: { label: '支付通道备注', fields: { orderProvider: { label: '订单支付通道' }, providerNotice: '支付通道提示', subscriptionProvider: { label: '订阅支付通道' } } },
            subscriptionPlans: { label: '订阅方案', fields: { creditPackages: { label: '积分套餐', fields: { credits: '积分', currency: '币种', price: '价格', shopifyVariantId: 'Shopify 变体 ID', title: '标题' } }, generationPricing: { label: '生成定价' } } },
          },
        },
        siteBasics: {
          label: '站点基础',
          fields: {
            announcement: '公告',
            footer: {
              label: '页脚',
              fields: {
                aboutEyebrow: '左侧眉标',
                aboutText: '左侧描述',
                aboutTitle: '左侧标题',
                directionEyebrow: '右侧眉标',
                directionText: '右侧描述',
                directionTitle: '右侧标题',
              },
            },
            headerNav: { label: '顶部导航' },
            siteDescription: '站点描述',
            siteName: '站点名称',
            supportEmail: '支持邮箱',
          },
        },
      },
      shared: {
        copyLabel: '标签',
        creditsPerMonth: '每月积分',
        featureHighlights: '功能亮点',
        link: '链接',
        monthlyPrice: '月费（USD）',
        planDescription: '方案描述',
        planName: '方案名称',
        shortLabel: '短标签',
      },
      options: { provider: { shopify: 'Shopify（预留集成）', stripe: 'Stripe（当前已接入）' } },
    },
    storageSettings: {
      label: '存储设置',
      description: '在这里管理非敏感的 Supabase Storage 设置。运行时代码只从此全局读取 bucket、prefix、baseURL 和 signedDownloads。Supabase service key 必须继续保存在环境变量中。',
      fields: {
        baseURL: { label: 'Supabase 公共基础 URL', description: '默认留空。可选的 Supabase Storage 公共对象基础 URL，用于生成媒体访问地址。' },
        bucket: { label: '存储桶名称', description: '默认留空。例如 media-assets-prod。' },
        credentialsSource: { label: '凭据来源', description: '默认：环境变量。这里只作为运维备注；真实密钥仍保存在环境变量中。' },
        enabled: { label: '启用存储集成', description: '默认关闭。仅在 Supabase 存储桶和环境密钥配置完成后开启。' },
        lastRotatedAt: { label: '最近轮换时间', description: '可选。记录外部密钥轮换事件的运维时间戳。' },
        lastValidatedAt: { label: '最近验证时间', description: '可选。记录最近一次存储验证成功的运维时间戳。' },
        prefix: { label: '对象前缀', description: '默认：media。文件会存储在该逻辑目录前缀下。' },
        signedDownloads: { label: '使用签名下载', description: '默认启用。关闭后会直接返回绝对媒体 URL，不再签名。' },
      },
    },
  },
  groups: { aiProduction: 'AI 生产', commerce: '商务', content: '内容', platform: '平台', platformGovernance: '平台治理' },
  dashboard: {
    actions: {
      exportDailyReport: '导出每日运营报告',
      viewFailedTasks: '查看失败任务',
      viewLowBalanceAccounts: '查看低余额账户',
      viewPaymentExceptions: '查看支付异常',
      viewPendingPaymentOrders: '查看待支付订单',
      viewQueueItem: '查看',
    },
    cards: {
      abnormalCreditAccounts: { label: '积分异常', note: '低余额或存在预留积分' },
      failedTasks: { label: '今日失败任务', note: '失败 / 超时' },
      newOrdersToday: { label: '今日新增订单', note: '新建打印订单' },
      newTasksToday: { label: '今日新增任务', note: '任务提交量' },
      newUsersToday: { label: '今日新增用户', note: '用户注册量' },
      pendingOrders: { label: '待处理打印订单', note: '待支付 / 待处理' },
      successfulPaymentsToday: { label: '今日成功支付', note: '已支付记录' },
      succeededTasksToday: { label: '今日成功任务', note: '成功状态' },
    },
    empty: {
      failedTasks: '当前没有失败或超时任务。',
      highBalance: '当前没有高余额账户。',
      lowBalance: '当前没有低余额账户。',
      orders: '当前没有需要跟进的订单。',
      payments: '当前没有支付异常。',
    },
    headings: {
      exceptionReview: '异常复核',
      operationsConsole: '运营控制台 / 仪表盘',
      operationsOverview: '运营概览与异常处理',
      paymentsAndBalances: '支付与余额观察列表',
      tasksAndOrders: '任务与订单异常',
    },
    labels: {
      generatedAt: '生成时间',
      paymentRecords: '支付记录',
      totalOrders: '订单总数',
      totalTasks: '任务总数',
      totalUsers: '用户总数',
    },
    meta: { balance: '余额', noLinkedUser: '无关联用户', reserved: '预留' },
    queues: {
      failedTasks: '失败任务队列',
      highBalance: '高余额账户',
      lowBalance: '低余额账户',
      orderExceptions: '订单异常队列',
      paymentExceptions: '支付异常队列',
    },
    summary: '集中查看今日运营热点：任务、支付、订单、积分和常见异常都汇总在这里。',
    titles: {
      orderStatusDistribution: '订单状态分布',
      orderTrend: '订单趋势（最近 7 天）',
      paymentTrend: '支付趋势（最近 7 天）',
      taskStatusDistribution: '任务状态分布',
      taskTrend: '任务趋势（最近 7 天）',
    },
  },
  languageSwitcher: {
    chinese: '中文',
    documentHint: '这里只切换后台界面语言。本地化内容请使用文档自身的语言切换器。',
    english: 'English',
    hint: '这里只影响后台导航、标签和仪表盘文案。',
    label: '界面语言',
  },
  status: {
    common: { justNow: '刚刚', unknown: '未知' },
    order: { cancelled: '已取消', completed: '已完成', inProduction: '生产中', paid: '已支付', pendingPayment: '待支付', shipped: '已发货' },
    payment: { failed: '失败', paid: '已支付', pending: '待支付', refunded: '已退款' },
    task: { failed: '失败', processing: '处理中', queued: '排队中', succeeded: '已成功', timeout: '已超时' },
  },
} as const

export const adminZh = mergeAdminText(adminEn, adminZhOverrides)
