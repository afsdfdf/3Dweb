export type FormalPageSection = {
  body: string
  items?: {
    body: string
    title: string
  }[]
  title: string
}

export type FormalPageContent = {
  contactCards?: {
    body: string
    href?: string
    label: string
    title: string
  }[]
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
  lastUpdated: string
  sections: FormalPageSection[]
  summaryCards: {
    body: string
    title: string
  }[]
}

export const formalPages = {
  about: {
    contactCards: [
      {
        body: 'Start a new generation task from image, text, or hybrid references.',
        href: '/workbench',
        label: 'Open Workbench',
        title: 'Create with Thorns Tavern',
      },
      {
        body: 'Browse public examples and understand the output direction.',
        href: '/showcase',
        label: 'View showcase',
        title: 'Explore results',
      },
    ],
    currentPath: '/about',
    heroEyebrow: 'About',
    heroPrimaryCTA: {
      href: '/workbench',
      label: 'Open Workbench',
    },
    heroSecondaryCTA: {
      href: '/bundles',
      label: 'View Bundles',
    },
    heroText:
      'Thorns Tavern is an AI 3D product platform for character creation, asset delivery, and print fulfillment. The experience is designed to move from inspiration to generated model, then onward into downloads and physical production.',
    heroTitle: 'A product workflow for AI character models, digital delivery, and print-ready output.',
    lastUpdated: 'April 28, 2026',
    sections: [
      {
        body:
          'The platform brings public discovery, generation tasks, model libraries, credits, orders, and operational admin tools into one product surface. It is built for creators and teams that need a practical path from idea to usable 3D asset.',
        items: [
          {
            body: 'Use references or written direction to begin a generation task, then keep the result attached to the account and model library.',
            title: 'Creation',
          },
          {
            body: 'Generated models can be organized, reviewed, downloaded, and prepared for later print or fulfillment steps.',
            title: 'Delivery',
          },
          {
            body: 'Payload powers the content and operational backend for tasks, media, users, orders, credits, and platform settings.',
            title: 'Operations',
          },
        ],
        title: 'What Thorns Tavern Does',
      },
      {
        body:
          'The current product direction is to keep the public site, Studio workspace, model delivery, and commerce flows coherent rather than treating generation as an isolated demo feature.',
        title: 'Product Direction',
      },
    ],
    summaryCards: [
      { body: 'Image, text, and hybrid generation paths help match the maturity of each character idea.', title: 'Generate' },
      { body: 'Model outputs stay connected to account, task, and delivery context.', title: 'Manage' },
      { body: 'Print orders and fulfillment can continue after the digital result is ready.', title: 'Fulfill' },
    ],
  },
  contact: {
    contactCards: [
      {
        body: 'For product, account, order, or billing questions.',
        href: 'mailto:support@example.com',
        label: 'support@example.com',
        title: 'Support',
      },
      {
        body: 'Use the Studio to create a generation task and review your results.',
        href: '/generate',
        label: 'Open Studio',
        title: 'Studio',
      },
      {
        body: 'Review subscription options, credits, and billing entry points.',
        href: '/pricing',
        label: 'View pricing',
        title: 'Billing',
      },
    ],
    currentPath: '/contact',
    heroEyebrow: 'Contact',
    heroPrimaryCTA: {
      href: 'mailto:support@example.com',
      label: 'Email support',
    },
    heroSecondaryCTA: {
      href: '/workbench',
      label: 'Open Workbench',
    },
    heroText:
      'Use the contact paths below for account help, order questions, billing support, or product inquiries. Include your account email and any relevant task, model, order, or payment identifiers when available.',
    heroTitle: 'Get help with generation, delivery, orders, and account questions.',
    lastUpdated: 'April 28, 2026',
    sections: [
      {
        body:
          'For the fastest support path, include what you were trying to do, the page or workflow involved, the approximate time of the issue, and screenshots or identifiers when possible.',
        items: [
          { body: 'Account email, task code, model ID, order ID, or subscription status can help us locate the right record.', title: 'Useful details' },
          { body: 'Avoid sending passwords, private payment card data, or unrelated sensitive documents.', title: 'Sensitive data' },
        ],
        title: 'How To Contact Support',
      },
      {
        body:
          'Support coverage may vary during beta and launch preparation. Operational, payment, and fulfillment questions are prioritized when they affect active delivery or account access.',
        title: 'Response Expectations',
      },
    ],
    summaryCards: [
      { body: 'Questions about login, account data, credits, or subscriptions.', title: 'Account help' },
      { body: 'Questions about generation tasks, results, model access, or downloads.', title: 'Studio help' },
      { body: 'Questions about print orders, delivery states, and fulfillment updates.', title: 'Order help' },
    ],
  },
  privacyPolicy: {
    currentPath: '/privacy-policy',
    heroEyebrow: 'Privacy Policy',
    heroPrimaryCTA: {
      href: '/contact',
      label: 'Contact support',
    },
    heroSecondaryCTA: {
      href: '/account',
      label: 'Open account',
    },
    heroText:
      'This policy explains the categories of information Thorns Tavern may collect, how that information is used to operate the product, and the choices users have around account and support workflows.',
    heroTitle: 'Privacy practices for accounts, generated assets, orders, and platform operations.',
    lastUpdated: 'April 28, 2026',
    sections: [
      {
        body:
          'Thorns Tavern may process account details, authentication information, generated task metadata, uploaded references, model delivery records, payment or subscription state, order information, and support communications.',
        items: [
          { body: 'Account email, profile details, authentication events, and security-related session information.', title: 'Account data' },
          { body: 'Prompts, uploaded references, task progress, result files, model metadata, and download records.', title: 'Product data' },
          { body: 'Order, subscription, billing status, and fulfillment details needed to provide paid services.', title: 'Commerce data' },
        ],
        title: 'Information We Process',
      },
      {
        body:
          'Information is used to provide the product, maintain accounts, process generation tasks, deliver digital assets, support print fulfillment, manage billing, secure the platform, and respond to support requests.',
        title: 'How We Use Information',
      },
      {
        body:
          'Thorns Tavern may use service providers for hosting, storage, payment processing, email delivery, analytics, and AI generation workflows. These providers are used to operate the product and are not a sale of personal information.',
        title: 'Service Providers',
      },
      {
        body:
          'Users can contact support for account, access, correction, deletion, or privacy questions. Some records may be retained when required for security, fraud prevention, legal compliance, billing, or order fulfillment.',
        title: 'User Choices',
      },
    ],
    summaryCards: [
      { body: 'We process information needed to run accounts, generation, delivery, and commerce flows.', title: 'Purpose-limited' },
      { body: 'Private generation assets are treated as account or operational data unless explicitly made public.', title: 'Asset-aware' },
      { body: 'Support can help with access, correction, deletion, and privacy questions.', title: 'User control' },
    ],
  },
  refundPolicy: {
    currentPath: '/refund-policy',
    heroEyebrow: 'Refund Policy',
    heroPrimaryCTA: {
      href: '/contact',
      label: 'Request review',
    },
    heroSecondaryCTA: {
      href: '/pricing',
      label: 'View pricing',
    },
    heroText:
      'This policy describes how refund requests are reviewed for credits, subscriptions, digital deliveries, and print-related orders. Eligibility depends on product state, usage, and fulfillment progress.',
    heroTitle: 'Refund review for generation credits, subscriptions, downloads, and print orders.',
    lastUpdated: 'April 28, 2026',
    sections: [
      {
        body:
          'Refunds are reviewed case by case. We consider whether credits were consumed, whether a digital asset was delivered or downloaded, whether a subscription period has started, and whether a print order has entered production.',
        items: [
          {
            body: 'Unused prepaid credits may be eligible for review when they were purchased recently and have not been applied to generation, downloads, or related services.',
            title: 'Credits',
          },
          {
            body: 'Subscription refunds depend on billing status, usage in the billing period, and whether monthly credits or benefits have already been granted or consumed.',
            title: 'Subscriptions',
          },
          {
            body: 'Digital model deliveries and downloads are generally harder to reverse once files or access have been provided.',
            title: 'Digital delivery',
          },
        ],
        title: 'Eligibility Review',
      },
      {
        body:
          'Print orders may become non-refundable once production, material preparation, manufacturing, or fulfillment work has started. If a print order is still pending review, contact support quickly with the order ID.',
        title: 'Print Orders',
      },
      {
        body:
          'To request a refund review, contact support with the account email, payment reference, order ID, subscription plan, task code, and a short description of the issue.',
        title: 'How To Request A Review',
      },
    ],
    summaryCards: [
      { body: 'Unused credits are the clearest candidate for review.', title: 'Unused value' },
      { body: 'Delivered files, consumed credits, and active production may limit eligibility.', title: 'Delivery matters' },
      { body: 'Order IDs and payment references speed up review.', title: 'Bring details' },
    ],
  },
  shippingPolicy: {
    currentPath: '/shipping-policy',
    heroEyebrow: 'Shipping Policy',
    heroPrimaryCTA: {
      href: '/contact',
      label: 'Contact support',
    },
    heroSecondaryCTA: {
      href: '/account?section=orders',
      label: 'View orders',
    },
    heroText:
      'This policy covers physical fulfillment for print orders and related shipped items. Digital model downloads are delivered through the platform and are not shipped physically.',
    heroTitle: 'Shipping expectations for physical print fulfillment and order delivery.',
    lastUpdated: 'April 28, 2026',
    sections: [
      {
        body:
          'Shipping applies when an order includes physical production or fulfillment. Digital-only downloads, model files, previews, and account access are delivered electronically through the product.',
        items: [
          { body: 'Order review confirms model readiness, selected options, production requirements, and shipping details.', title: 'Review' },
          { body: 'Production timing depends on model complexity, material availability, queue state, and quality checks.', title: 'Production' },
          { body: 'Tracking details are provided when the fulfillment provider makes them available.', title: 'Tracking' },
        ],
        title: 'Order Flow',
      },
      {
        body:
          'Estimated timelines are not guaranteed during beta or launch preparation. Delays can occur because of production queues, address issues, carrier events, customs, weather, or payment review.',
        title: 'Timing And Delays',
      },
      {
        body:
          'Customers are responsible for accurate shipping details. If an address needs correction, contact support as soon as possible before the order enters production or dispatch.',
        title: 'Address Accuracy',
      },
      {
        body:
          'Damage, missing items, or delivery issues should be reported promptly with the order ID, tracking details, photos when relevant, and a description of the issue.',
        title: 'Delivery Issues',
      },
    ],
    summaryCards: [
      { body: 'Digital files are delivered online, while print orders use physical fulfillment.', title: 'Digital versus physical' },
      { body: 'Production state affects timing, cancellation options, and delivery updates.', title: 'Production-aware' },
      { body: 'Tracking appears when the fulfillment provider makes it available.', title: 'Tracking-based' },
    ],
  },
} satisfies Record<string, FormalPageContent>
