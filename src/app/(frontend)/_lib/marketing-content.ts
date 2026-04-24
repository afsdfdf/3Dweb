import type { Locale } from './locale'

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
  collectionShelf: {
    allLabel: string
    hotLabel: string
    moreLabel: string
    newLabel: string
    title: string
  }
  entrySection: {
    eyebrow: string
    text: string
    title: string
  }
  featuredRail: {
    eyebrow: string
    moreLabel: string
    searchLabel: string
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

type LocalizedValue<T> = Record<Locale, T>

const localized = <T,>(en: T, zh: T): LocalizedValue<T> => ({ en, zh })

const footerContent = localized<FooterContent>(
  {
    aboutEyebrow: 'About the product',
    aboutText:
      'MiniForge connects character generation, model management, digital delivery, and print orders into one product workflow so teams can operate 3D assets like a real business.',
    aboutTitle: 'A unified platform for character creation, asset delivery, and print fulfillment',
    directionEyebrow: 'Product direction',
    directionText:
      'The current release already includes accounts, tasks, models, orders, credits, and an admin structure. The next step is to keep polishing the public site, Studio, and platform APIs.',
    directionTitle: 'Evolving from an AI generation tool into an operable product website',
  },
  {
    aboutEyebrow: '关于产品',
    aboutText:
      'MiniForge 把角色生成、模型管理、下载交付与打印订单串成一条完整链路，让团队可以像运营正式产品一样运营 3D 资产。',
    aboutTitle: '面向角色创作、模型交付与打印履约的一体化平台',
    directionEyebrow: '产品方向',
    directionText:
      '当前版本已经具备账号、任务、模型、订单、积分与后台运营结构，下一步将继续补齐正式营销站、Studio 和平台 API。',
    directionTitle: '从 AI 生成工具升级为可运营的产品网站',
  },
)

const siteSettings = localized<MarketingSiteSettings>(
  {
    announcement: 'The beta now supports the marketing site, generation workspace, order flow, and credits. Public launch polish is in progress.',
    creditPackages: [
      { credits: 120, currency: 'USD', price: 12, title: 'Starter pack' },
      { credits: 380, currency: 'USD', price: 36, title: 'Growth pack' },
      { credits: 980, currency: 'USD', price: 88, title: 'Studio pack' },
    ],
    footer: footerContent.en,
    generationPricing: {
      downloadCredits: 5,
      hybridCredits: 25,
      imageCredits: 20,
      textCredits: 15,
    },
    headerNav: [
      { href: '/features', label: 'Features' },
      { href: '/solutions', label: 'Solutions' },
      { href: '/showcase', label: 'Showcase' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/resources', label: 'Resources' },
      { href: '/developers', label: 'Developers' },
      { href: '/generate', label: 'Open Studio' },
    ],
    siteDescription: 'An AI 3D product platform for character creation, asset management, and print fulfillment.',
    siteName: 'MiniForge AI 3D',
    supportEmail: 'support@example.com',
  },
  {
    announcement: '内测版已支持营销站、生成工作台、订单与积分链路，欢迎继续补齐正式产品能力。',
    creditPackages: [
      { credits: 120, currency: 'USD', price: 12, title: '入门包' },
      { credits: 380, currency: 'USD', price: 36, title: '进阶包' },
      { credits: 980, currency: 'USD', price: 88, title: '工作室包' },
    ],
    footer: footerContent.zh,
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
    ],
    siteDescription: '面向角色创作、模型资产管理和打印履约的一体化 AI 3D 产品平台。',
    siteName: 'MiniForge AI 3D',
    supportEmail: 'support@example.com',
  },
)

const homepageContent = localized<MarketingHomepageContent>(
  {
    collectionShelf: {
      allLabel: 'All Followed',
      hotLabel: 'Hot',
      moreLabel: 'More',
      newLabel: 'New',
      title: 'Followed',
    },
    entrySection: {
      eyebrow: 'Entry points',
      text:
        'Once visitors understand the product value, they should move naturally into generation, downloads, and print workflows without first decoding internal admin language.',
      title: 'Build trust first, then guide users into the workflow.',
    },
    featuredRail: {
      eyebrow: 'Featured images',
      moreLabel: 'More',
      searchLabel: 'Search',
      title: 'New Product',
    },
    faq: [
      {
        answer: 'It fits tabletop characters, collectible models, IP merchandise, concept validation, and projects that need to continue into printing or delivery.',
        question: 'What kind of projects is it good for?',
      },
      {
        answer: 'No. MiniForge is designed to continue from generation into downloads, print orders, and fulfillment instead of stopping at a one-off result.',
        question: 'Is this just another generation tool?',
      },
      {
        answer: 'Solo creators can use it directly, and studios or brand teams can build broader operating workflows on top of it.',
        question: 'Is it better for individuals or teams?',
      },
    ],
    faqSection: {
      eyebrow: 'FAQ',
      title: 'Clarify the product boundary, delivery model, and use cases.',
    },
    featuredWorks: [
      { category: 'Tabletop hero', summary: 'Realistic proportions prepared for 32mm prints and tactical boards.', title: 'Paladin commander', tone: 'violet' },
      { category: 'Collectible', summary: 'Stronger volume and layering for painting, display, and sample runs.', title: 'Dwarven heavy warrior', tone: 'blue' },
      { category: 'Stylized character', summary: 'Well suited for evolving a single concept into a broader cast.', title: 'Shadow ranger', tone: 'pink' },
    ],
    hero: {
      eyebrow: 'MiniForge Studio',
      primaryCTA: { href: '/generate', label: 'Open Studio' },
      secondaryCTA: { href: '/showcase', label: 'View showcase' },
      subtitle:
        'This is not a lonely feature entry. It is a complete product experience that moves naturally from discovery to generation, downloads, print orders, and delivery.',
      title: 'An AI 3D product site built for character creation, delivery, and print fulfillment.',
    },
    introBand: {
      eyebrow: 'Site positioning',
      text: 'The homepage should sell the work, services, and use cases first, then support action. It should not feel like an instruction sheet.',
      title: 'A real product website should explain value before it explains operations.',
    },
    processSection: {
      eyebrow: 'Workflow',
      title: 'From creative input to delivery, and then to physical production.',
    },
    processSteps: [
      { step: '01', text: 'Upload references or describe the character silhouette, gear, material cues, and style direction.', title: 'Define the character' },
      { step: '02', text: 'Track generation progress, review the result, and keep the asset ready for later delivery.', title: 'Generate and review' },
      { step: '03', text: 'Download the files or continue directly into print orders and fulfillment.', title: 'Deliver and fulfill' },
    ],
    serviceBlocks: [
      { text: 'Turn illustrations, sketches, or written descriptions into production-ready 3D foundations for tabletop, collectibles, and concept validation.', title: 'Character concept to 3D' },
      { text: 'Prepare model formats and dimensions that are easier to move into sample making and physical output.', title: 'Print delivery readiness' },
      { text: 'Give small teams one place to manage assets, display links, sample output, and downstream order handling.', title: 'Studio operations support' },
    ],
    serviceIntro: {
      eyebrow: 'What we do',
      text: 'Externally, this should feel like a digital product brand website. Internally, the job is to help visitors understand what they can complete here.',
      title: 'Bring character creation, 3D outputs, and print delivery into one product surface.',
    },
    useCases: [
      { label: 'Tabletop characters and NPCs' },
      { label: 'Collectible statues and limited models' },
      { label: 'Brand IP merchandise' },
      { label: 'Event display samples' },
      { label: 'Studio proposals and prototyping' },
      { label: 'Personal creation and self-service printing' },
    ],
  },
  {
    collectionShelf: {
      allLabel: 'All Followed',
      hotLabel: 'Hot',
      moreLabel: 'More',
      newLabel: 'New',
      title: 'Followed',
    },
    entrySection: {
      eyebrow: '进入方式',
      text:
        '如果访客已经理解产品价值，就应该能自然地进入生成、下载与打印流程，而不是一上来就被迫理解后台术语。',
      title: '先建立信任与认知，再引导用户进入操作流。',
    },
    featuredRail: {
      eyebrow: 'Featured images',
      moreLabel: 'More',
      searchLabel: 'Search',
      title: 'New Product',
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
  },
)

const marketingPagesByLocale = localized<Record<string, MarketingPageContent>>(
  {
    features: {
      currentPath: '/features',
      heroEyebrow: 'Features',
      heroPrimaryCTA: { href: '/generate', label: 'Open Studio' },
      heroSecondaryCTA: { href: '/pricing', label: 'View pricing' },
      heroText: 'Connect generation, asset storage, delivery, print orders, and operations inside one product surface.',
      heroTitle: 'Generate 3D, then keep it manageable, deliverable, and fulfillable.',
      sections: [
        {
          cards: [
            { title: 'Multi-input generation', text: 'Use image, text, or hybrid requests depending on how mature the character idea already is.' },
            { title: 'Progress tracking', text: 'See queue, processing, and completion states while keeping downstream delivery visible.' },
            { title: 'Asset capture', text: 'Successful outputs fall into the model library automatically for later download and order handling.' },
          ],
          eyebrow: 'Generation',
          id: 'generation',
          text: 'Studio is designed around the task lifecycle instead of a one-off output moment.',
          title: 'A workflow-first generation experience.',
        },
        {
          bullets: ['GLB / STL / OBJ style delivery', 'Status, visibility, tags, and print readiness', 'Traceability back to prompts and task history'],
          eyebrow: 'Assets',
          id: 'assets',
          text: 'Models should behave like product assets instead of disposable files.',
          title: 'Turn the library into an asset center.',
        },
        {
          cards: [
            { title: 'Content operations', text: 'Homepage and future content surfaces can be managed in Payload.' },
            { title: 'Business operations', text: 'Tasks, orders, payments, credits, and users stay visible from one backend.' },
            { title: 'Config operations', text: 'Providers, polling rules, and pricing settings have a central home.' },
          ],
          eyebrow: 'Operations',
          id: 'operations',
          text: 'Use one operational backend for content, business flows, and platform settings.',
          title: 'One admin layer, multiple business surfaces.',
        },
      ],
    },
    pricing: {
      currentPath: '/pricing',
      heroEyebrow: 'Pricing',
      heroPrimaryCTA: { href: '/generate', label: 'Open Studio' },
      heroSecondaryCTA: { href: '/resources', label: 'Delivery docs' },
      heroText: 'Use credits, subscriptions, and print fulfillment as one coherent business path.',
      heroTitle: 'Make generation cost, delivery, and physical production easy to understand.',
      sections: [
        {
          cards: [
            { title: 'Image to 3D', text: 'Best for higher-confidence work with reference art.', note: '20 credits / run' },
            { title: 'Text to 3D', text: 'Best for concept exploration and quick iteration.', note: '15 credits / run' },
            { title: 'Hybrid', text: 'Best for stronger control with higher output quality.', note: '25 credits / run' },
          ],
          eyebrow: 'Generation credits',
          id: 'credits',
          text: 'Credit consumption can guide users toward the right input path.',
          title: 'Explain generation with credits first.',
        },
        {
          bullets: ['Downloads can be charged separately', 'Print orders can apply size and material rules', 'Subscriptions can grow after the core loop is stable'],
          eyebrow: 'Delivery',
          id: 'delivery',
          text: 'Digital delivery and physical fulfillment are distinct product steps.',
          title: 'Make post-generation value explicit.',
        },
        {
          bullets: ['Ship the core loop first', 'Harden checkout and webhooks next', 'Expand into team plans later'],
          eyebrow: 'Commercial rollout',
          id: 'growth',
          text: 'Keep the first business model legible and operable.',
          title: 'Stability before pricing complexity.',
        },
      ],
    },
    developers: {
      currentPath: '/developers',
      heroEyebrow: 'Developers',
      heroPrimaryCTA: { href: '/generate', label: 'Open Studio' },
      heroSecondaryCTA: { href: '/features', label: 'View features' },
      heroText: 'A product-shaped integration surface organized around Studio, assets, commerce, and operations.',
      heroTitle: 'Clear API boundaries for a real product, not a loose demo.',
      sections: [
        {
          cards: [
            { title: 'Studio API', text: 'Handles generation submission, polling, and result retrieval.' },
            { title: 'Commerce API', text: 'Owns print orders, payment progression, and fulfillment updates.' },
            { title: 'Platform API', text: 'Covers downloads, dashboards, and future platform capabilities.' },
          ],
          eyebrow: 'API domains',
          id: 'api-domains',
          text: 'Interfaces are split by business responsibility, not by convenience.',
          title: 'Visible domain boundaries.',
        },
        {
          bullets: ['Marketing site for conversion', 'Studio for creation and results', 'Admin for operations', 'API for stable integration'],
          eyebrow: 'Architecture',
          id: 'system-structure',
          text: 'The public site, workspace, admin, and APIs each have a separate job.',
          title: 'A website that behaves like a product shell.',
        },
        {
          cards: [
            { title: 'Payload access control', text: 'User-aware Local API calls explicitly use overrideAccess: false.' },
            { title: 'Transaction safety', text: 'Nested writes keep req attached to stay atomic.' },
            { title: 'Admin boundaries', text: 'Operational views stay limited to privileged roles.' },
          ],
          eyebrow: 'Security',
          id: 'security',
          text: 'Security rules are built into the architecture, not added later.',
          title: 'Security by structure.',
        },
      ],
    },
    resources: {
      currentPath: '/resources',
      heroEyebrow: 'Resources',
      heroPrimaryCTA: { href: '/features', label: 'Explore features' },
      heroSecondaryCTA: { href: '/generate', label: 'Go to Studio' },
      heroText: 'Turn operating knowledge into reusable content for onboarding, delivery, and SEO.',
      heroTitle: 'A resource center for print guidance, delivery standards, and product education.',
      sections: [
        {
          bullets: ['When to choose image, text, or hybrid generation', 'How result pages lead into the library', 'How the library connects to print orders'],
          eyebrow: 'Guides',
          id: 'guides',
          text: 'Help new users understand the full loop quickly.',
          title: 'Explain the workflow clearly.',
        },
        {
          bullets: ['GLB / STL / OBJ recommendations', 'Sizing and materials guidance', 'Order, payment, and fulfillment state definitions'],
          eyebrow: 'Delivery specs',
          id: 'delivery-spec',
          text: 'Useful for studios and brand teams that need delivery clarity.',
          title: 'Document the output boundary.',
        },
        {
          cards: [
            { title: 'Case templates', text: 'Standardize how showcase stories scale.' },
            { title: 'Modular FAQ', text: 'Split recurring questions into reusable content.' },
            { title: 'SEO resource surface', text: 'Let the resource center become a discovery channel.' },
          ],
          eyebrow: 'Content ops',
          id: 'content-ops',
          text: 'Content should compound into an operating advantage.',
          title: 'Treat content like product infrastructure.',
        },
      ],
    },
    showcase: {
      currentPath: '/showcase',
      heroEyebrow: 'Showcase',
      heroPrimaryCTA: { href: '/generate', label: 'Try your own character' },
      heroSecondaryCTA: { href: '/solutions', label: 'View solutions' },
      heroText: 'Examples here are meant to prove the full product output, not just a pretty screenshot.',
      heroTitle: 'Show what the platform can actually produce and deliver.',
      sections: [
        {
          cards: [
            { title: 'Paladin commander', text: 'Heavy armor, banner, and rune shield prepared for a faction centerpiece.' },
            { title: 'Dungeon NPC set', text: 'A unified cast suitable for batch generation and tabletop campaigns.' },
          ],
          eyebrow: 'Tabletop',
          id: 'tabletop',
          text: 'Prepared for 28mm to 32mm figures and tabletop-ready characters.',
          title: 'From concept art to playable miniatures.',
        },
        {
          cards: [
            { title: 'Dwarven heavy warrior', text: 'Stronger layering suited to resin printing and finishing.' },
            { title: 'Scout mech', text: 'Useful for concept validation and line extension.' },
          ],
          eyebrow: 'Collectibles',
          id: 'collectible',
          text: 'Focuses on display presence, painting quality, and sculptural value.',
          title: 'Assets prepared for display and finishing.',
        },
        {
          bullets: ['Good for event samples and display pieces', 'Can grow from one mascot into a broader cast', 'Can continue into orders and print fulfillment'],
          eyebrow: 'Brand IP',
          id: 'brand-ip',
          text: 'Useful when digital characters need to become physical artifacts.',
          title: 'Take brand characters into production-ready samples.',
        },
      ],
    },
    solutions: {
      currentPath: '/solutions',
      heroEyebrow: 'Solutions',
      heroPrimaryCTA: { href: '/showcase', label: 'Explore examples' },
      heroSecondaryCTA: { href: '/resources', label: 'Browse resources' },
      heroText: 'Package one product core into multiple business-friendly solution stories.',
      heroTitle: 'Useful for creators, studios, brand teams, and delivery-driven workflows.',
      sections: [
        {
          bullets: ['Start from sketches and prompts', 'Archive results as reusable assets', 'Continue directly into sample production'],
          eyebrow: 'Creators',
          id: 'creator',
          text: 'Help solo creators move from idea to 3D output without tool sprawl.',
          title: 'A full workflow for individual creators.',
        },
        {
          cards: [
            { title: 'Unified asset directory', text: 'Keep models, orders, credits, tasks, and results tied together.' },
            { title: 'Operations backend', text: 'Track tasks, payments, and fulfillment in one place.' },
            { title: 'Expandable team workflows', text: 'The structure can grow into richer roles later.' },
          ],
          eyebrow: 'Studios',
          id: 'studio',
          text: 'Useful for teams managing many character assets and downstream delivery states.',
          title: 'Operate assets, not just outputs.',
        },
        {
          bullets: ['Useful for promotional samples', 'Can continue into payments and orders', 'Supports public showcase and content flows'],
          eyebrow: 'Brands',
          id: 'brand',
          text: 'A good fit for IP merchandise, displays, and campaign-driven prototypes.',
          title: 'Extend storytelling into physical samples.',
        },
      ],
    },
  },
  {
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
          bullets: ['支持 GLB / STL / OBJ 等交付格式', '支持模型状态、标签、可见性和打印就绪状态', '可从来源任务回溯到提示词、输入模式和处理进度'],
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
  },
)

export function getDefaultFooter(locale: Locale): FooterContent {
  return footerContent[locale]
}

export function getDefaultSiteSettings(locale: Locale): MarketingSiteSettings {
  return siteSettings[locale]
}

export function getDefaultHomepageContent(locale: Locale): MarketingHomepageContent {
  return homepageContent[locale]
}

export function getMarketingPages(locale: Locale): Record<string, MarketingPageContent> {
  return {
    ...marketingPagesByLocale.en,
    ...marketingPagesByLocale[locale],
  }
}

export const defaultFooter = getDefaultFooter('en')
export const defaultSiteSettings = getDefaultSiteSettings('en')
export const defaultHomepageContent = getDefaultHomepageContent('en')
export const marketingPages = getMarketingPages('en')
