import type { Locale } from './locale'
import {
  zhFooterContent,
  zhHomepageContent,
  zhMarketingPages,
  zhSiteSettings,
} from '@/i18n/marketing'

export type NavigationItem = {
  href: string
  label: string
}

export type NavigationPromotionContent = {
  buttonAriaLabel: string
  buttonLabel: string
  enabled: boolean
  eyebrow: string
  offerText: string
}

export type MarketingMediaAsset = {
  alt?: null | string
  filename?: null | string
  publicAccess?: boolean | null
  purpose?: null | string
  thumbnailURL?: null | string
  url?: null | string
}

export type FooterContent = {
  aboutEyebrow: string
  aboutText: string
  aboutTitle: string
  brandLogo?: null | number | MarketingMediaAsset
  brandLogoAlt?: null | string
  brandSummary?: null | string
  directionEyebrow: string
  directionText: string
  directionTitle: string
  linkGroups?: FooterLinkGroup[] | null
  socialLinks?: FooterSocialLink[] | null
}

export type FooterLink = {
  href: string
  label: string
}

export type FooterSocialLink = {
  enabled?: boolean | null
  href: string
  label: string
  platform?: null | string
}

export type FooterLinkGroup = {
  ariaLabel?: null | string
  helperText?: null | string
  links?: FooterLink[] | null
  title: string
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
  navigationPromotion?: NavigationPromotionContent
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
    headerBackground?: null | number | MarketingMediaAsset
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

const footerAboutText =
  'Thorns Tavern connects character generation, model management, digital delivery, and print orders into one product workflow so teams can operate 3D assets like a real business.'
const footerDirectionTitle = 'Evolving from an AI generation tool into an operable product website'

const footerContent: FooterContent = {
  aboutEyebrow: 'About the product',
  aboutText: footerAboutText,
  aboutTitle: 'A unified platform for character creation, asset delivery, and print fulfillment',
  brandLogo: null,
  brandLogoAlt: 'Thorns Tavern',
  brandSummary: 'An AI 3D product platform for character creation, asset management, and print fulfillment.',
  directionEyebrow: 'Product direction',
  directionText:
    'The current release already includes accounts, tasks, models, orders, credits, and an admin structure. The next step is to keep polishing the public site, Studio, and platform APIs.',
  directionTitle: footerDirectionTitle,
  linkGroups: getDefaultFooterLinkGroups('support@example.com'),
  socialLinks: getDefaultFooterSocialLinks(),
}

export function getFooterInformationLinks(): FooterLink[] {
  return [
    { href: '/refund-policy', label: 'Refund Policy' },
    { href: '/shipping-policy', label: 'Shipping Policy' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/contact', label: 'Contact Us' },
  ]
}

export function getFooterCustomerLinks(supportEmail: string): FooterLink[] {
  return [
    { href: `mailto:${supportEmail}`, label: supportEmail },
  ]
}

export function getDefaultFooterSocialLinks(): FooterSocialLink[] {
  return [
    { enabled: true, href: 'https://x.com/', label: 'X', platform: 'x' },
    { enabled: true, href: 'https://www.facebook.com/', label: 'Facebook', platform: 'facebook' },
    { enabled: true, href: 'https://www.instagram.com/', label: 'Instagram', platform: 'instagram' },
    { enabled: true, href: 'https://www.youtube.com/', label: 'YouTube', platform: 'youtube' },
  ]
}

export function getDefaultFooterLinkGroups(supportEmail: string): FooterLinkGroup[] {
  return [
    {
      ariaLabel: 'Footer information',
      helperText: footerDirectionTitle,
      links: getFooterInformationLinks(),
      title: 'INFORMATION',
    },
    {
      ariaLabel: 'Footer customer help',
      helperText: footerAboutText,
      links: getFooterCustomerLinks(supportEmail),
      title: 'Help Customers',
    },
  ]
}

const siteSettings: MarketingSiteSettings = {
  announcement: 'The beta now supports the marketing site, generation workspace, order flow, and credits. Public launch polish is in progress.',
  creditPackages: [
    { credits: 120, currency: 'USD', price: 12, title: 'Starter pack' },
    { credits: 380, currency: 'USD', price: 36, title: 'Growth pack' },
    { credits: 980, currency: 'USD', price: 88, title: 'Studio pack' },
  ],
  footer: footerContent,
  generationPricing: {
    downloadCredits: 5,
    hybridCredits: 20,
    imageCredits: 20,
    textCredits: 20,
  },
  headerNav: [
    { href: '/', label: 'HOME' },
    { href: '/workbench', label: 'WORKBENCH' },
    { href: '/showcase', label: 'SHOWCASE' },
    { href: '/assets', label: 'ASSETS' },
    { href: '/blog', label: 'BLOG' },
    { href: '/about', label: 'ABOUT' },
  ],
  navigationPromotion: {
    buttonAriaLabel: 'Open subscription offers',
    buttonLabel: 'SUB',
    enabled: true,
    eyebrow: 'NEW USER',
    offerText: '30% OFF',
  },
  siteDescription: 'An AI 3D product platform for character creation, asset management, and print fulfillment.',
  siteName: 'Thorns Tavern',
  supportEmail: 'support@example.com',
}

const homepageContent: MarketingHomepageContent = {
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
      answer: 'No. Thorns Tavern is designed to continue from generation into downloads, print orders, and fulfillment instead of stopping at a one-off result.',
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
    eyebrow: 'Thorns Tavern Studio',
    primaryCTA: { href: '/generate', label: 'Open Studio' },
    secondaryCTA: { href: '/showcase', label: 'View showcase' },
    subtitle:
      'This is a complete product experience that moves naturally from discovery to generation, downloads, print orders, and delivery.',
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
}

const marketingPages: Record<string, MarketingPageContent> = {
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
    ],
  },
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
    ],
  },
}

export function getDefaultFooter(locale: Locale): FooterContent {
  return locale === 'zh' ? zhFooterContent : footerContent
}

export function getDefaultSiteSettings(locale: Locale): MarketingSiteSettings {
  return locale === 'zh' ? zhSiteSettings : siteSettings
}

export function getDefaultHomepageContent(locale: Locale): MarketingHomepageContent {
  return locale === 'zh' ? zhHomepageContent : homepageContent
}

export function getMarketingPages(locale: Locale): Record<string, MarketingPageContent> {
  return locale === 'zh' ? zhMarketingPages : marketingPages
}

export const defaultFooter = footerContent
export const defaultSiteSettings = siteSettings
export const defaultHomepageContent = homepageContent
export { marketingPages }
