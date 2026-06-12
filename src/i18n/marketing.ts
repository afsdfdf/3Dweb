import type {
  FooterContent,
  MarketingHomepageContent,
  MarketingPageContent,
  MarketingSiteSettings,
} from '@/app/(frontend)/_lib/marketing-content'

export const zhFooterContent: FooterContent = {
  aboutEyebrow: '关于产品',
  aboutText:
    'Thorns Tavern 将角色生成、模型管理、数字交付和打印订单连接到同一个产品流程，让团队可以像经营真实业务一样运营 3D 资产。',
  aboutTitle: '面向角色创作、资产交付和打印履约的一体化平台',
  directionEyebrow: '产品方向',
  directionText:
    '当前版本已经包含账户、任务、模型、订单、积分和后台结构。下一步会继续打磨公开站点、Studio 和平台 API。',
  directionTitle: '从 AI 生成工具演进为可运营的产品网站',
}

export const zhSiteSettings: MarketingSiteSettings = {
  announcement: 'Beta 版已支持营销站点、生成工作台、订单流程和积分体系。公开发布前的体验打磨正在进行中。',
  creditPackages: [
    { credits: 120, currency: 'USD', price: 12, title: '入门包' },
    { credits: 380, currency: 'USD', price: 36, title: '成长包' },
    { credits: 980, currency: 'USD', price: 88, title: '工作室包' },
  ],
  footer: zhFooterContent,
  generationPricing: {
    downloadCredits: 5,
    hybridCredits: 20,
    imageCredits: 20,
    textCredits: 20,
  },
  headerNav: [
    { href: '/', label: '首页' },
    { href: '/workbench', label: '工作台' },
    { href: '/assets', label: '资产' },
    { href: '/about', label: '关于' },
  ],
  siteDescription: '面向角色创作、资产管理和打印履约的 AI 3D 产品平台。',
  siteName: 'Thorns Tavern',
  supportEmail: 'support@example.com',
}

export const zhHomepageContent: MarketingHomepageContent = {
  collectionShelf: {
    allLabel: '全部关注',
    hotLabel: '热门',
    moreLabel: '更多',
    newLabel: '最新',
    title: '已关注',
  },
  entrySection: {
    eyebrow: '入口',
    text:
      '当访客理解产品价值后，应能自然进入生成、下载和打印流程，而不是先理解内部后台术语。',
    title: '先建立信任，再引导用户进入工作流。',
  },
  featuredRail: {
    eyebrow: '精选图片',
    moreLabel: '更多',
    searchLabel: '搜索',
    title: '新品',
  },
  faq: [
    {
      answer: '适合桌游角色、收藏模型、IP 衍生品、概念验证，以及需要继续进入打印或交付的项目。',
      question: '适合哪些项目？',
    },
    {
      answer: '不是。Thorns Tavern 设计为从生成继续走向下载、打印订单和履约，而不是停在一次性结果。',
      question: '这只是另一个生成工具吗？',
    },
    {
      answer: '个人创作者可以直接使用，工作室或品牌团队也可以在此基础上搭建更完整的运营流程。',
      question: '更适合个人还是团队？',
    },
  ],
  faqSection: {
    eyebrow: '常见问题',
    title: '说明产品边界、交付模式和使用场景。',
  },
  featuredWorks: [
    { category: '桌游英雄', summary: '真实比例，适合 32mm 打印和战术棋盘。', title: '圣骑士指挥官', tone: 'violet' },
    { category: '收藏模型', summary: '强化体量和层次，适合涂装、展示和小批量样品。', title: '矮人重装战士', tone: 'blue' },
    { category: '风格化角色', summary: '适合把单个概念逐步扩展成更完整的角色阵容。', title: '暗影游侠', tone: 'pink' },
  ],
  hero: {
    eyebrow: 'Thorns Tavern Studio',
    primaryCTA: { href: '/generate', label: '打开 Studio' },
    secondaryCTA: { href: '/showcase', label: '查看作品' },
    subtitle:
      '这是一个完整的产品体验，可从发现价值自然延伸到生成、下载、打印订单和交付。',
    title: '面向角色创作、交付和打印履约的 AI 3D 产品站点。',
  },
  introBand: {
    eyebrow: '站点定位',
    text: '首页应优先呈现作品、服务和使用场景，再承接用户行动，而不是像一份操作说明。',
    title: '真正的产品网站应先说明价值，再说明操作。',
  },
  processSection: {
    eyebrow: '工作流',
    title: '从创意输入到交付，再到实体生产。',
  },
  processSteps: [
    { step: '01', text: '上传参考图，或描述角色轮廓、装备、材质线索和风格方向。', title: '定义角色' },
    { step: '02', text: '跟踪生成进度，审核结果，并让资产保持可用于后续交付的状态。', title: '生成并审核' },
    { step: '03', text: '下载文件，或直接继续进入打印订单和履约流程。', title: '交付并履约' },
  ],
  serviceBlocks: [
    { text: '将插画、草图或文字描述转化为可用于桌游、收藏品和概念验证的 3D 生产基础。', title: '角色概念转 3D' },
    { text: '准备更容易进入打样和实体输出的模型格式与尺寸。', title: '打印交付准备' },
    { text: '让小团队在一个地方管理资产、展示链接、样品输出和后续订单处理。', title: '工作室运营支持' },
  ],
  serviceIntro: {
    eyebrow: '我们做什么',
    text: '对外，它应像一个数字产品品牌网站；对内，它的任务是帮助访客理解他们可以在这里完成什么。',
    title: '把角色创作、3D 输出和打印交付放进同一个产品界面。',
  },
  useCases: [
    { label: '桌游角色和 NPC' },
    { label: '收藏雕像和限量模型' },
    { label: '品牌 IP 衍生品' },
    { label: '活动展示样品' },
    { label: '工作室提案和原型验证' },
    { label: '个人创作和自助打印' },
  ],
}

export const zhMarketingPages: Record<string, MarketingPageContent> = {
  developers: {
    currentPath: '/developers',
    heroEyebrow: '开发者',
    heroPrimaryCTA: { href: '/generate', label: '打开 Studio' },
    heroSecondaryCTA: { href: '/features', label: '查看功能' },
    heroText: '围绕 Studio、资产、商务和运营组织的产品化集成界面。',
    heroTitle: '为真实产品提供清晰 API 边界，而不是松散演示。',
    sections: [
      {
        cards: [
          { title: 'Studio API', text: '处理生成提交、轮询和结果获取。' },
          { title: '商务 API', text: '负责打印订单、支付进度和履约更新。' },
          { title: '平台 API', text: '覆盖下载、账户中心和未来的平台能力。' },
        ],
        eyebrow: 'API 域',
        id: 'api-domains',
        text: '接口按业务职责拆分，而不是按便利性拆分。',
        title: '清晰可见的领域边界。',
      },
      {
        bullets: ['用于转化的营销站点', '用于创建和结果的 Studio', '用于运营的后台', '用于稳定集成的 API'],
        eyebrow: '架构',
        id: 'system-structure',
        text: '公开站点、工作区、后台和 API 各自承担不同职责。',
        title: '像产品外壳一样运作的网站。',
      },
    ],
  },
  features: {
    currentPath: '/features',
    heroEyebrow: '功能',
    heroPrimaryCTA: { href: '/generate', label: '打开 Studio' },
    heroSecondaryCTA: { href: '/pricing', label: '查看价格' },
    heroText: '在一个产品界面内连接生成、资产存储、交付、打印订单和运营。',
    heroTitle: '生成 3D 后，让它继续可管理、可交付、可履约。',
    sections: [
      {
        cards: [
          { title: '多输入生成', text: '根据角色想法的成熟度，选择图像、文字或混合请求。' },
          { title: '进度跟踪', text: '查看排队、处理和完成状态，同时保持后续交付可见。' },
          { title: '资产捕获', text: '成功结果会自动进入模型库，便于之后下载和订单处理。' },
        ],
        eyebrow: '生成',
        id: 'generation',
        text: 'Studio 围绕任务生命周期设计，而不是一次性的输出瞬间。',
        title: '以工作流为先的生成体验。',
      },
      {
        bullets: ['GLB / STL / OBJ 类型交付', '状态、可见性、标签和打印准备度', '可追溯到提示词和任务历史'],
        eyebrow: '资产',
        id: 'assets',
        text: '模型应该像产品资产一样运转，而不是一次性文件。',
        title: '把模型库变成资产中心。',
      },
    ],
  },
  pricing: {
    currentPath: '/pricing',
    heroEyebrow: '价格',
    heroPrimaryCTA: { href: '/generate', label: '打开 Studio' },
    heroSecondaryCTA: { href: '/resources', label: '交付文档' },
    heroText: '把积分、订阅和打印履约组织成一条连贯的商业路径。',
    heroTitle: '让生成成本、数字交付和实体生产更容易理解。',
    sections: [
      {
        cards: [
          { title: '图像转 3D', text: '适合已有参考图、确定性更高的工作。', note: '20 积分 / 次' },
          { title: '文字转 3D', text: '适合概念探索和快速迭代。', note: '15 积分 / 次' },
          { title: '混合输入', text: '适合更强控制和更高输出质量。', note: '25 积分 / 次' },
        ],
        eyebrow: '生成积分',
        id: 'credits',
        text: '积分消耗可以帮助用户选择合适的输入路径。',
        title: '先用积分解释生成。',
      },
      {
        bullets: ['下载可以单独计费', '打印订单可以应用尺寸和材料规则', '核心循环稳定后订阅可以继续扩展'],
        eyebrow: '交付',
        id: 'delivery',
        text: '数字交付和实体履约是不同的产品步骤。',
        title: '明确生成后的价值。',
      },
    ],
  },
  resources: {
    currentPath: '/resources',
    heroEyebrow: '资源',
    heroPrimaryCTA: { href: '/features', label: '探索功能' },
    heroSecondaryCTA: { href: '/generate', label: '前往 Studio' },
    heroText: '把运营知识转化为可复用内容，用于新手引导、交付说明和 SEO。',
    heroTitle: '面向打印指导、交付标准和产品教育的资源中心。',
    sections: [
      {
        bullets: ['何时选择图像、文字或混合生成', '结果页如何进入模型库', '模型库如何连接打印订单'],
        eyebrow: '指南',
        id: 'guides',
        text: '帮助新用户快速理解完整循环。',
        title: '清晰解释工作流。',
      },
      {
        bullets: ['GLB / STL / OBJ 建议', '尺寸和材料指导', '订单、支付和履约状态定义'],
        eyebrow: '交付规格',
        id: 'delivery-spec',
        text: '适合需要交付清晰度的工作室和品牌团队。',
        title: '记录输出边界。',
      },
    ],
  },
  showcase: {
    currentPath: '/showcase',
    heroEyebrow: '作品展示',
    heroPrimaryCTA: { href: '/generate', label: '尝试你的角色' },
    heroSecondaryCTA: { href: '/solutions', label: '查看解决方案' },
    heroText: '这里的示例用于证明完整产品输出，而不只是漂亮截图。',
    heroTitle: '展示平台实际可以生产和交付的内容。',
    sections: [
      {
        cards: [
          { title: '圣骑士指挥官', text: '重甲、旗帜和符文盾，适合作为阵营核心角色。' },
          { title: '地牢 NPC 套组', text: '统一角色阵容，适合批量生成和桌游战役。' },
        ],
        eyebrow: '桌游',
        id: 'tabletop',
        text: '面向 28mm 到 32mm 人物比例和桌游可用角色准备。',
        title: '从概念图到可上桌的微缩模型。',
      },
    ],
  },
  solutions: {
    currentPath: '/solutions',
    heroEyebrow: '解决方案',
    heroPrimaryCTA: { href: '/showcase', label: '探索案例' },
    heroSecondaryCTA: { href: '/resources', label: '浏览资源' },
    heroText: '把同一个产品核心包装成多个面向业务的解决方案故事。',
    heroTitle: '适用于创作者、工作室、品牌团队和交付驱动的工作流。',
    sections: [
      {
        bullets: ['从草图和提示词开始', '把结果归档为可复用资产', '直接继续进入样品生产'],
        eyebrow: '创作者',
        id: 'creator',
        text: '帮助个人创作者摆脱工具分散，从想法走到 3D 输出。',
        title: '面向个人创作者的完整工作流。',
      },
      {
        cards: [
          { title: '统一资产目录', text: '把模型、订单、积分、任务和结果关联在一起。' },
          { title: '运营后台', text: '在一个地方跟踪任务、支付和履约。' },
          { title: '可扩展团队工作流', text: '当前结构后续可扩展成更丰富的角色体系。' },
        ],
        eyebrow: '工作室',
        id: 'studio',
        text: '适合管理大量角色资产和后续交付状态的团队。',
        title: '运营资产，而不仅是输出结果。',
      },
    ],
  },
}
