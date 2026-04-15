export type NavigationItem = {
  href: string
  label: string
}

export type FooterContent = {
  aboutEyebrow: string
  aboutText: string
  aboutTitle: string
  directionEyebrow: string
  directionText: string
  directionTitle: string
}

export type MarketingCard = {
  note?: string
  text: string
  title: string
}

export type MarketingSection = {
  bullets?: string[]
  cards?: MarketingCard[]
  eyebrow: string
  id: string
  text: string
  title: string
}

export type MarketingPageContent = {
  currentPath: string
  heroEyebrow: string
  heroPrimaryCTA: {
    href: string
    label: string
  }
  heroSecondaryCTA?: {
    href: string
    label: string
  }
  heroText: string
  heroTitle: string
  sections: MarketingSection[]
}

export type MarketingSiteSettings = {
  announcement: string
  creditPackages: {
    credits: number
    currency: string
    price: number
    title: string
  }[]
  footer: FooterContent
  generationPricing: {
    downloadCredits: number
    hybridCredits: number
    imageCredits: number
    textCredits: number
  }
  headerNav: NavigationItem[]
  siteDescription: string
  siteName: string
  supportEmail: string
}

export type MarketingHomepageContent = {
  entrySection: {
    eyebrow: string
    text: string
    title: string
  }
  faq: {
    answer: string
    question: string
  }[]
  faqSection: {
    eyebrow: string
    title: string
  }
  featuredWorks: {
    category: string
    summary: string
    title: string
    tone: 'blue' | 'pink' | 'violet'
  }[]
  hero: {
    eyebrow: string
    primaryCTA: {
      href: string
      label: string
    }
    secondaryCTA: {
      href: string
      label: string
    }
    subtitle: string
    title: string
  }
  introBand: {
    eyebrow: string
    text: string
    title: string
  }
  processSection: {
    eyebrow: string
    title: string
  }
  processSteps: {
    step: string
    text: string
    title: string
  }[]
  serviceBlocks: {
    text: string
    title: string
  }[]
  serviceIntro: {
    eyebrow: string
    text: string
    title: string
  }
  useCases: {
    label: string
  }[]
}

export const defaultFooter: FooterContent = {
  aboutEyebrow: '关于产品',
  aboutText:
    'MiniForge 把角色生成、模型管理、下载交付与打印订单串成一条完整链路，让团队可以像运营正式产品一样运营 3D 资产。',
  aboutTitle: '面向角色创作、模型交付与打印履约的一体化平台',
  directionEyebrow: '产品方向',
  directionText:
    '当前版本已经具备账号、任务、模型、订单、积分与后台运营结构，下一步将继续补齐正式营销站、Studio 和平台 API。',
  directionTitle: '从 AI 生成工具升级为可运营的产品网站',
}

export const defaultSiteSettings: MarketingSiteSettings = {
  announcement: '内测版已支持营销站、生成工作台、订单与积分链路，欢迎继续补齐正式产品能力。',
  creditPackages: [
    { credits: 120, currency: 'USD', price: 12, title: '入门包' },
    { credits: 380, currency: 'USD', price: 36, title: '进阶包' },
    { credits: 980, currency: 'USD', price: 88, title: '工作室包' },
  ],
  footer: defaultFooter,
  generationPricing: {
    downloadCredits: 5,
    hybridCredits: 25,
    imageCredits: 20,
    textCredits: 15,
  },
  headerNav: [
    { href: '/features', label: '产品能力' },
    { href: '/solutions', label: '解决方案' },
    { href: '/showcase', label: '案例展示' },
    { href: '/pricing', label: '价格方案' },
    { href: '/resources', label: '资源中心' },
    { href: '/developers', label: '开发者' },
    { href: '/generate', label: '进入 Studio' },
  ] satisfies NavigationItem[],
  siteDescription: '面向角色创作、模型资产管理和打印履约的一体化 AI 3D 产品平台。',
  siteName: 'MiniForge AI 3D',
  supportEmail: 'support@example.com',
}

export const defaultHomepageContent: MarketingHomepageContent = {
  entrySection: {
    eyebrow: '进入方式',
    text:
      '如果访客已经理解产品价值，就应该能自然地进入生成、下载与打印流程，而不是一上来就被迫理解后台术语。',
    title: '先建立信任与认知，再引导用户进入操作流。',
  },
  faq: [
    {
      answer: '适合桌游角色、收藏模型、IP 衍生、角色概念验证，以及需要继续进入打印或交付链路的项目。',
      question: '适合什么类型的项目？',
    },
    {
      answer: '不是。MiniForge 更强调从 3D 结果继续走向下载、打印、订单与履约，而不是只停留在一次性生成。',
      question: '这只是一个生成工具吗？',
    },
    {
      answer: '个人创作者可以直接使用，工作室与品牌项目也可以在此基础上继续扩展团队协作和运营流程。',
      question: '更适合个人还是团队？',
    },
  ],
  faqSection: {
    eyebrow: '常见问题',
    title: '把产品边界、交付方式和适用场景讲清楚。',
  },
  featuredWorks: [
    { category: '桌游角色', summary: '偏写实比例，适合 32mm 打印与战棋桌面对战展示。', title: '圣骑士指挥官', tone: 'violet' },
    { category: '收藏模型', summary: '强化体块与结构层次，适合涂装、陈列与小批量打样。', title: '矮人重甲战士', tone: 'blue' },
    { category: '风格化角色', summary: '适合从角色设定继续延展系列化角色开发。', title: '暗影游侠', tone: 'pink' },
  ],
  hero: {
    eyebrow: 'MiniForge Studio',
    primaryCTA: { href: '/generate', label: '进入 Studio' },
    secondaryCTA: { href: '/showcase', label: '查看案例展示' },
    subtitle:
      '这不是一个孤立的功能入口，而是一套完整的产品体验：先展示作品、场景与能力，再自然进入生成、下载、打印与交付。',
    title: '为角色创作、模型交付与打印履约而设计的 AI 3D 产品站。',
  },
  introBand: {
    eyebrow: '网站定位',
    text: '首页应先展示作品、服务与场景，再承接行为入口，而不是把每一屏都做成操作说明。',
    title: '像一个正式产品网站一样，先讲清楚价值，再引导进入工作流。',
  },
  processSection: {
    eyebrow: '工作流程',
    title: '从创意输入到模型交付，再到打印履约。',
  },
  processSteps: [
    { step: '01', text: '上传参考图或直接描述角色外形、装备、材质和风格方向。', title: '提供角色设定' },
    { step: '02', text: '系统生成 3D 结果后，你可以继续查看进度、补充说明并沉淀资产。', title: '生成与调整' },
    { step: '03', text: '确认结果后可下载模型文件，或者继续进入打印、订单与履约流程。', title: '下载与交付' },
  ],
  serviceBlocks: [
    { text: '根据立绘、草图或文字设定快速生成角色模型基础稿，适合桌游、收藏和角色概念验证。', title: '角色概念到 3D' },
    { text: '提供更适合打印的文件与尺寸方案，减少从数字模型走向实体样件的切换成本。', title: '打印交付准备' },
    { text: '适合小团队统一管理角色资产、展示链接、样件输出和后续订单承接。', title: '工作室运营支撑' },
  ],
  serviceIntro: {
    eyebrow: '我们在做什么',
    text: '对外表达上，这里更像一个数字制作品牌网站；真正的重点，是让访客知道自己可以在这里完成什么。',
    title: '把角色创作、3D 结果与打印交付放进同一个产品里。',
  },
  useCases: [
    { label: '桌游角色与 NPC' },
    { label: '收藏雕像与限定模型' },
    { label: '品牌 IP 角色周边' },
    { label: '活动展示样件' },
    { label: '工作室提案与打样' },
    { label: '个人创作与自助打印' },
  ],
}

export const marketingPages = {
  features: {
    currentPath: '/features',
    heroEyebrow: '产品能力',
    heroPrimaryCTA: { href: '/generate', label: '进入 Studio' },
    heroSecondaryCTA: { href: '/pricing', label: '查看价格方案' },
    heroText: '把角色生成、模型沉淀、下载交付、打印订单和后台运营放在一条连续产品链路里。',
    heroTitle: '不仅生成 3D，更要让结果可管理、可交付、可履约。',
    sections: [
      {
        cards: [
          { title: '多输入模式', text: '兼容图像、文本与混合输入，适合不同阶段的角色设定。' },
          { title: '任务进度跟踪', text: '从排队、处理中到完成，结果页持续刷新状态与交付信息。' },
          { title: '结果沉淀为资产', text: '生成成功后自动落到模型库，便于下载、归档与后续订单承接。' },
        ],
        eyebrow: '生成能力',
        id: 'generation',
        text: '支持图生 3D、文生 3D 与图文混合输入，并保留任务进度、结果页和后续交付入口。',
        title: '围绕任务生命周期设计 Studio。',
      },
      {
        bullets: [
          '支持 GLB / STL / OBJ 等交付格式',
          '支持模型状态、标签、可见性和打印就绪状态',
          '可从来源任务回溯到提示词、输入模式和处理进度',
        ],
        eyebrow: '资产能力',
        id: 'assets',
        text: '模型不是一次性附件，而是可复用、可交付、可打印的长期资产。',
        title: '把模型库做成资产中心。',
      },
      {
        cards: [
          { title: '内容运营', text: '站点设置、首页内容、未来的案例与资源页都能由 Payload 管理。' },
          { title: '业务运营', text: '任务、订单、支付、积分与用户可以在后台统一查看。' },
          { title: '配置运营', text: 'AI 供应商、轮询、积分规则等基础配置集中管理。' },
        ],
        eyebrow: '运营能力',
        id: 'operations',
        text: 'Payload Admin 负责内容运营、任务运营、订单与积分运营，便于向正式业务系统演进。',
        title: '同一后台管理内容、业务与配置。',
      },
    ],
  },
  pricing: {
    currentPath: '/pricing',
    heroEyebrow: '价格方案',
    heroPrimaryCTA: { href: '/generate', label: '进入 Studio' },
    heroSecondaryCTA: { href: '/resources', label: '了解交付流程' },
    heroText: '当前版本以积分和打印订单两种定价形式承接生成与交付，后续可继续扩展订阅和团队方案。',
    heroTitle: '让生成成本、下载成本和打印履约成本都可被清楚解释。',
    sections: [
      {
        cards: [
          { title: '图生 3D', text: '建议用于已有设定图的高确定性项目。', note: '20 积分 / 次' },
          { title: '文生 3D', text: '适用于早期概念验证与快速探索。', note: '15 积分 / 次' },
          { title: '图文混合', text: '推荐默认路径，兼顾控制力与生成质量。', note: '25 积分 / 次' },
        ],
        eyebrow: '生成积分',
        id: 'credits',
        text: '不同输入模式对应不同积分消耗，便于控制成本和引导用户选择。',
        title: '先用积分描述生成成本。',
      },
      {
        bullets: ['下载文件可单独计费', '打印订单按尺寸和材质继续报价', '后续可补齐团队套餐与正式订阅方案'],
        eyebrow: '交付与下载',
        id: 'delivery',
        text: '下载可独立计费，打印则通过订单流程继续承接。',
        title: '把结果交付明确成下一段产品能力。',
      },
      {
        bullets: ['测试环境优先验证生成到交付闭环', '正式环境再接 Shopify Checkout 与 Webhook', '未来可增加工作室套餐和团队协作席位'],
        eyebrow: '建议的商业化节奏',
        id: 'growth',
        text: '先跑通积分、订单和支付链路，再逐步扩展更复杂的套餐。',
        title: '先把链路打通，再追求复杂定价。',
      },
    ],
  },
  developers: {
    currentPath: '/developers',
    heroEyebrow: '开发者',
    heroPrimaryCTA: { href: '/generate', label: '进入 Studio' },
    heroSecondaryCTA: { href: '/features', label: '查看产品能力' },
    heroText: '这里不是孤立的 API 演示，而是围绕 Studio、模型资产、订单与平台能力组织出来的真实产品接口边界。',
    heroTitle: '为完整产品而设计的 API、后台结构与接入边界。',
    sections: [
      {
        cards: [
          { title: 'Studio API', text: '处理生成任务提交、任务同步、结果查询等与用户工作流直接相关的接口。' },
          { title: 'Commerce API', text: '承接打印订单、支付推进和履约状态同步。' },
          { title: 'Platform API', text: '提供模型下载、平台运营视图和系统级扩展能力。' },
        ],
        eyebrow: '接口分层',
        id: 'api-domains',
        text: '按业务域拆分接口，而不是把所有能力都塞进一个混乱的通用入口。',
        title: '先把接口边界划清楚。',
      },
      {
        bullets: [
          '产品站负责产品介绍、转化和内容运营',
          'Studio 负责生成、结果与模型沉淀',
          'Admin 负责 Payload 内容与业务运营',
          'API 负责稳定的程序化接入边界',
        ],
        eyebrow: '产品架构',
        id: 'system-structure',
        text: '前台、工作台、后台和 API 之间职责清晰，网站才能同时承载营销与完整功能。',
        title: '网站不是展示层，而是完整产品外壳。',
      },
      {
        cards: [
          { title: 'Payload 访问控制', text: '用户参与的 Local API 调用明确使用 overrideAccess: false。' },
          { title: '事务安全', text: 'Hooks 中的嵌套操作要求传递 req，保证同事务原子性。' },
          { title: '运营安全边界', text: '管理视图和平台接口只向管理员与运营角色开放。' },
        ],
        eyebrow: '安全开发',
        id: 'security',
        text: '我们按 Payload 的安全开发规则组织数据访问、角色边界和后台接口。',
        title: '把安全规则写进产品结构，而不是事后补丁。',
      },
    ],
  },
  resources: {
    currentPath: '/resources',
    heroEyebrow: '资源中心',
    heroPrimaryCTA: { href: '/features', label: '查看产品能力' },
    heroSecondaryCTA: { href: '/generate', label: '前往 Studio' },
    heroText: '这里将逐步沉淀使用说明、交付规范、打印建议和案例材料，让网站不只是一组页面。',
    heroTitle: '把产品经验沉淀成可复用的内容资产。',
    sections: [
      {
        bullets: ['如何选择图生、文生和图文混合', '如何从结果页继续进入模型库', '如何从模型库进入打印订单流程'],
        eyebrow: '上手指南',
        id: 'guides',
        text: '帮助新用户理解输入方式、结果页、模型库与订单流程。',
        title: '先让新用户理解产品闭环。',
      },
      {
        bullets: ['GLB / STL / OBJ 文件的使用建议', '打印前的比例、材质与后处理说明', '订单、支付与履约状态的解释方式'],
        eyebrow: '交付规范',
        id: 'delivery-spec',
        text: '面向工作室与品牌项目，说明文件格式、打印建议和履约节奏。',
        title: '把交付边界写清楚。',
      },
      {
        cards: [
          { title: '案例模板', text: '沉淀标准案例结构，便于快速扩展 Showcase。' },
          { title: 'FAQ 模块化', text: '把常见问题拆成多个页面复用。' },
          { title: '资源页产品化', text: '让资源中心逐步承接 SEO 与产品教育。' },
        ],
        eyebrow: '内容运营',
        id: 'content-ops',
        text: '后续可以把案例、FAQ、方案页和资源页逐步迁入 Payload 进行统一运营。',
        title: '让内容真正成为运营资产。',
      },
    ],
  },
  showcase: {
    currentPath: '/showcase',
    heroEyebrow: '案例展示',
    heroPrimaryCTA: { href: '/generate', label: '试试你的角色' },
    heroSecondaryCTA: { href: '/solutions', label: '查看解决方案' },
    heroText: '这些示例展示的不是单次生成截图，而是可以继续进入资产、交付和打印链路的产品结果。',
    heroTitle: '用案例告诉访客：这个网站到底能产出什么。',
    sections: [
      {
        cards: [
          { title: '圣骑士指挥官', text: '重甲、战旗与符文盾牌，适合阵营核心角色。' },
          { title: '地下城 NPC 套组', text: '统一风格的守卫、法师与酒馆角色，适合批量生成。' },
        ],
        eyebrow: '桌游角色',
        id: 'tabletop',
        text: '适合 28mm~32mm 的战棋角色、小队单位和 NPC 打样。',
        title: '从概念图到可打印棋子。',
      },
      {
        cards: [
          { title: '矮人重甲战士', text: '强调体块层次，适合树脂打印与后处理。' },
          { title: '机甲侦察兵', text: '适合概念验证与系列化延展。' },
        ],
        eyebrow: '收藏模型',
        id: 'collectible',
        text: '适合更重视体块、陈列性和上色表现的收藏类模型。',
        title: '为陈列和涂装准备的角色资产。',
      },
      {
        bullets: ['可服务活动样件、快闪陈列和宣传素材', '适合从单个角色逐步扩展为角色矩阵', '可继续接订单与打印履约能力'],
        eyebrow: '品牌角色',
        id: 'brand-ip',
        text: '适合把品牌视觉角色扩展成数字展示与实体样件。',
        title: '从品牌 IP 到周边样件。',
      },
    ],
  },
  solutions: {
    currentPath: '/solutions',
    heroEyebrow: '解决方案',
    heroPrimaryCTA: { href: '/showcase', label: '查看案例方向' },
    heroSecondaryCTA: { href: '/resources', label: '浏览资源中心' },
    heroText: '我们把同一套产品能力打包成不同业务场景下的解决方案，而不是让每个团队重新拼装工具链。',
    heroTitle: '适合创作者、工作室、品牌项目与展示履约场景。',
    sections: [
      {
        bullets: ['从草图与设定直接起步', '自动沉淀为个人模型资产', '可继续下单打印样件'],
        eyebrow: '个人创作者',
        id: 'creator',
        text: '快速把角色设定变成 3D 结果，并继续进入下载、展示或打样。',
        title: '为独立创作者提供一站式工作流。',
      },
      {
        cards: [
          { title: '统一资产目录', text: '模型、订单、积分、任务和结果页统一归档。' },
          { title: '运营后台', text: '运营同学可在 Admin 内快速查看任务、支付与履约状态。' },
          { title: '后续可扩展团队协作', text: '现有结构适合继续补齐更细粒度的角色和权限体系。' },
        ],
        eyebrow: '工作室',
        id: 'studio',
        text: '适合需要批量管理角色资产、任务进度与交付状态的小型工作室。',
        title: '让工作室从“做模型”升级为“运营模型资产”。',
      },
      {
        bullets: ['适合展示样件快速打样', '可继续接支付与订单系统', '支持输出可展示的案例与资源页'],
        eyebrow: '品牌与活动',
        id: 'brand',
        text: '适用于角色 IP 周边、展示样件、活动快闪以及联名项目的快速验证。',
        title: '把数字内容延伸到实体样件与履约链路。',
      },
    ],
  },
} satisfies Record<string, MarketingPageContent>
