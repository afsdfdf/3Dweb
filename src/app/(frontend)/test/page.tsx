import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AuthFlowCard } from '@/components/auth/AuthFlowCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FixedSliceFrame } from '@/components/ui/fixed-slice-frame'
import { FrameButton } from '@/components/ui/frame-button'
import { Input } from '@/components/ui/input'
import { LineFrame } from '@/components/ui/line-frame'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { defaultGenerationPricing } from '@/lib/taskBilling'

import { GenerateForm } from '../_components/GenerateForm'
import { ModelViewer } from '../_components/ModelViewer'
import { WorkbenchComposer } from '../_components/WorkbenchComposer'
import { ModelThumbnailCard } from '../_components/cards/ModelThumbnailCard'

type EndpointSpec = {
  integration: string
  method: string
  path: string
  purpose: string
}

type ComponentSpec = {
  note: string
  path: string
  preview: 'listed' | 'rendered'
}

type PageSpec = {
  href?: string
  note: string
  path: string
}

type CollectionSpec = {
  access: string
  fields: string[]
  note: string
  slug: string
}

type PageMapSpec = {
  components: string[]
  dataSources: string[]
  endpoints: string[]
  note: string
  path: string
}

const frontendPages: PageSpec[] = [
  { path: '/', href: '/', note: 'Formal homepage' },
  { path: '/about', href: '/about', note: 'About page' },
  { path: '/account', href: '/account', note: 'Formal account page' },
  { path: '/contact', href: '/contact', note: 'Contact page' },
  { path: '/dashboard', note: 'User dashboard overview' },
  { path: '/dashboard/credits', note: 'Credits account' },
  { path: '/dashboard/library', note: 'User model library' },
  { path: '/dashboard/orders', note: 'Order list' },
  { path: '/dashboard/orders/[id]', note: 'Order detail' },
  { path: '/dashboard/settings', note: 'Account settings' },
  { path: '/dashboard/tasks', note: 'Task history' },
  { path: '/developers', note: 'Marketing route' },
  { path: '/features', note: 'Marketing route' },
  { path: '/forgot-password', note: 'Forgot password modal redirect' },
  { path: '/formal-components', href: '/formal-components', note: 'Local-only component registry; blocked in production' },
  { path: '/generate', note: 'Primary generation screen' },
  { path: '/login', href: '/login', note: 'Login modal redirect' },
  { path: '/model-detail', href: '/model-detail?id=74', note: 'Formal model detail page' },
  { path: '/pricing', href: '/pricing', note: 'Pricing page' },
  { path: '/privacy-policy', href: '/privacy-policy', note: 'Privacy policy page' },
  { path: '/refund-policy', href: '/refund-policy', note: 'Refund policy page' },
  { path: '/register', href: '/register', note: 'Register modal redirect' },
  { path: '/reset-password', note: 'Reset password page' },
  { path: '/resources', note: 'Marketing route' },
  { path: '/results/[taskCode]', note: 'AI task result detail' },
  { path: '/shipping-policy', href: '/shipping-policy', note: 'Shipping policy page' },
  { path: '/showcase', note: 'Public showcase list' },
  { path: '/showcase/[id]', note: 'Public showcase detail' },
  { path: '/solutions', note: 'Marketing route' },
  { path: '/test', href: '/test', note: 'Local-only project route and API index; blocked in production' },
  { path: '/verify-email/[token]', note: 'Email verification landing page' },
  { path: '/workbench', href: '/workbench', note: 'Formal workbench page' },
  { path: '/workbench/history', note: 'Workbench history' },
  { path: '/workbench/models/[id]', note: 'Workbench model detail' },
]

const payloadAndAppRoutes: PageSpec[] = [
  { path: '/admin', note: 'Payload admin root' },
  { path: '/admin/[[...segments]]', note: 'Payload admin catch-all view' },
  { path: '/api/access', note: 'Payload access route' },
  { path: '/api/graphql', note: 'Payload GraphQL route' },
  { path: '/api/graphql-playground', note: 'Payload GraphQL playground' },
  { path: '/api/[...slug]', note: 'Payload REST catch-all route' },
  { path: '/api/account/profile-media/upload-url', note: 'Signed profile media upload bootstrap' },
  { path: '/api/locale', note: 'Locale switch helper' },
  { path: '/api/media/upload-url', note: 'Signed upload bootstrap for source images' },
]

const customEndpoints: EndpointSpec[] = [
  { method: 'POST', path: '/api/account/auth/register', purpose: 'Register account', integration: "fetch('/api/account/auth/register', { method: 'POST', body: JSON.stringify({ email, fullName, password, phone }) })" },
  { method: 'POST', path: '/api/account/auth/login', purpose: 'Login account', integration: "fetch('/api/account/auth/login', { method: 'POST', credentials: 'include', body: JSON.stringify({ email, password }) })" },
  { method: 'POST', path: '/api/account/auth/logout', purpose: 'Logout current session', integration: "fetch('/api/account/auth/logout', { method: 'POST', credentials: 'include' })" },
  { method: 'GET', path: '/api/account/auth/me', purpose: 'Current auth session', integration: "fetch('/api/account/auth/me', { method: 'GET', credentials: 'include' })" },
  { method: 'POST', path: '/api/account/auth/forgot-password', purpose: 'Send reset email', integration: "fetch('/api/account/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })" },
  { method: 'POST', path: '/api/account/auth/reset-password', purpose: 'Reset password with token', integration: "fetch('/api/account/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })" },
  { method: 'POST', path: '/api/account/auth/verify-email', purpose: 'Verify email token', integration: "fetch('/api/account/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })" },
  { method: 'POST', path: '/api/account/auth/resend-verification', purpose: 'Resend verify email', integration: "fetch('/api/account/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) })" },
  { method: 'GET', path: '/api/account/profile', purpose: 'Current account profile', integration: "fetch('/api/account/profile', { method: 'GET', credentials: 'include' })" },
  { method: 'PATCH', path: '/api/account/profile', purpose: 'Update current profile', integration: "fetch('/api/account/profile', { method: 'PATCH', credentials: 'include', body: JSON.stringify({ displayName, avatar, bio, profileVisibility }) })" },
  { method: 'GET', path: '/api/account/dashboard', purpose: 'Current account dashboard aggregate', integration: "fetch('/api/account/dashboard', { method: 'GET', credentials: 'include' })" },
  { method: 'POST', path: '/api/account/password', purpose: 'Change current password', integration: "fetch('/api/account/password', { method: 'POST', credentials: 'include', body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }) })" },
  { method: 'GET', path: '/api/account/follows', purpose: 'Current user follows', integration: "fetch('/api/account/follows', { method: 'GET', credentials: 'include' })" },
  { method: 'GET', path: '/api/account/favorites', purpose: 'Current user favorite models', integration: "fetch('/api/account/favorites', { method: 'GET', credentials: 'include' })" },
  { method: 'GET', path: '/api/creators/:userId', purpose: 'Public creator profile', integration: "fetch(`/api/creators/${userId}`)" },
  { method: 'POST', path: '/api/creators/:userId/follow', purpose: 'Follow creator', integration: "fetch(`/api/creators/${userId}/follow`, { method: 'POST', credentials: 'include' })" },
  { method: 'DELETE', path: '/api/creators/:userId/follow', purpose: 'Unfollow creator', integration: "fetch(`/api/creators/${userId}/follow`, { method: 'DELETE', credentials: 'include' })" },
  { method: 'GET', path: '/api/social/models/:modelId/detail', purpose: 'Model detail aggregate', integration: "fetch(`/api/social/models/${modelId}/detail`, { method: 'GET', credentials: 'include' })" },
  { method: 'GET', path: '/api/social/models/:modelId/reactions', purpose: 'Like/favorite state', integration: "fetch(`/api/social/models/${modelId}/reactions`, { method: 'GET', credentials: 'include' })" },
  { method: 'POST', path: '/api/social/models/:modelId/like', purpose: 'Like model', integration: "fetch(`/api/social/models/${modelId}/like`, { method: 'POST', credentials: 'include' })" },
  { method: 'DELETE', path: '/api/social/models/:modelId/like', purpose: 'Unlike model', integration: "fetch(`/api/social/models/${modelId}/like`, { method: 'DELETE', credentials: 'include' })" },
  { method: 'POST', path: '/api/social/models/:modelId/favorite', purpose: 'Favorite model', integration: "fetch(`/api/social/models/${modelId}/favorite`, { method: 'POST', credentials: 'include' })" },
  { method: 'DELETE', path: '/api/social/models/:modelId/favorite', purpose: 'Unfavorite model', integration: "fetch(`/api/social/models/${modelId}/favorite`, { method: 'DELETE', credentials: 'include' })" },
  { method: 'GET', path: '/api/social/models/:modelId/comments', purpose: 'Comment list', integration: "fetch(`/api/social/models/${modelId}/comments?page=1&limit=20`, { method: 'GET', credentials: 'include' })" },
  { method: 'POST', path: '/api/social/models/:modelId/comments', purpose: 'Create comment', integration: "fetch(`/api/social/models/${modelId}/comments`, { method: 'POST', credentials: 'include', body: JSON.stringify({ content }) })" },
  { method: 'DELETE', path: '/api/social/models/:modelId/comments/:commentId', purpose: 'Delete own comment', integration: "fetch(`/api/social/models/${modelId}/comments/${commentId}`, { method: 'DELETE', credentials: 'include' })" },
  { method: 'PATCH', path: '/api/social/models/:modelId/comments/:commentId/moderation', purpose: 'Moderate comment', integration: "fetch(`/api/social/models/${modelId}/comments/${commentId}/moderation`, { method: 'PATCH', credentials: 'include', body: JSON.stringify({ status: 'hidden' }) })" },
  { method: 'POST', path: '/api/engagement/view', purpose: 'Record creator/model view', integration: "fetch('/api/engagement/view', { method: 'POST', credentials: 'include', body: JSON.stringify({ targetType: 'model', targetId }) })" },
  { method: 'POST', path: '/api/studio/ai/tasks', purpose: 'Submit AI task', integration: "fetch('/api/studio/ai/tasks', { method: 'POST', credentials: 'include', body: JSON.stringify({ inputMode, prompt, sourceImageAsset, parameterSnapshot }) })" },
  { method: 'POST', path: '/api/studio/ai/tasks/:taskId/sync', purpose: 'Sync AI task', integration: "fetch(`/api/studio/ai/tasks/${taskId}/sync`, { method: 'POST', credentials: 'include' })" },
  { method: 'POST', path: '/api/studio/ai/images', purpose: 'Generate image', integration: "fetch('/api/studio/ai/images', { method: 'POST', credentials: 'include', body: JSON.stringify({ prompt, mode }) })" },
  { method: 'GET', path: '/api/studio/ai/images', purpose: 'List current user generated image assets', integration: "fetch('/api/studio/ai/images', { method: 'GET', credentials: 'include' })" },
  { method: 'POST', path: '/api/platform/ai/webhooks/meshy', purpose: 'Meshy webhook', integration: 'Provider callback only' },
  { method: 'POST', path: '/api/platform/ai/webhooks/provider', purpose: 'Generic provider webhook', integration: 'Provider callback only' },
  { method: 'GET', path: '/api/platform/models/:modelId/viewer', purpose: 'Signed/controlled model viewer stream', integration: "const url = `/api/platform/models/${modelId}/viewer`" },
  { method: 'GET', path: '/api/platform/models/:modelId/download', purpose: 'Model download flow', integration: "window.location.href = `/api/platform/models/${modelId}/download?format=glb`" },
  { method: 'GET', path: '/api/platform/ops/dashboard', purpose: 'Ops dashboard data', integration: "fetch('/api/platform/ops/dashboard', { method: 'GET', credentials: 'include' })" },
  { method: 'POST', path: '/api/platform/session/logout', purpose: 'Session logout helper', integration: "fetch('/api/platform/session/logout', { method: 'POST', credentials: 'include' })" },
  { method: 'POST', path: '/api/platform/admin/orders/:orderId/status', purpose: 'Admin update order status', integration: "fetch(`/api/platform/admin/orders/${orderId}/status`, { method: 'POST', credentials: 'include', body: JSON.stringify({ status }) })" },
  { method: 'POST', path: '/api/platform/admin/credits/:userId/adjust', purpose: 'Admin adjust credits', integration: "fetch(`/api/platform/admin/credits/${userId}/adjust`, { method: 'POST', credentials: 'include', body: JSON.stringify({ amountDelta, notes }) })" },
  { method: 'POST', path: '/api/platform/admin/tasks/:taskId/repair', purpose: 'Admin task repair', integration: "fetch(`/api/platform/admin/tasks/${taskId}/repair`, { method: 'POST', credentials: 'include' })" },
  { method: 'POST', path: '/api/commerce/print-orders', purpose: 'Create print order', integration: "fetch('/api/commerce/print-orders', { method: 'POST', credentials: 'include', body: JSON.stringify({ modelId }) })" },
  { method: 'POST', path: '/api/commerce/print-orders/:orderId/sync', purpose: 'Sync print order', integration: "fetch(`/api/commerce/print-orders/${orderId}/sync`, { method: 'POST', credentials: 'include' })" },
  { method: 'POST', path: '/api/billing/subscriptions/checkout', purpose: 'Subscription checkout', integration: "fetch('/api/billing/subscriptions/checkout', { method: 'POST', credentials: 'include', body: JSON.stringify({ planKey }) })" },
  { method: 'POST', path: '/api/billing/subscriptions/sync', purpose: 'Subscription sync', integration: "fetch('/api/billing/subscriptions/sync', { method: 'POST', credentials: 'include' })" },
  { method: 'POST', path: '/api/billing/subscriptions/portal', purpose: 'Subscription billing portal', integration: "fetch('/api/billing/subscriptions/portal', { method: 'POST', credentials: 'include' })" },
  { method: 'POST', path: '/api/platform/billing/webhooks/stripe', purpose: 'Stripe webhook', integration: 'Stripe callback only' },
  { method: 'POST', path: '/api/account/profile-media/upload-url', purpose: 'Signed profile avatar/banner upload bootstrap', integration: "fetch('/api/account/profile-media/upload-url', { method: 'POST', credentials: 'include', body: JSON.stringify({ filename, contentType, kind }) })" },
  { method: 'POST', path: '/api/media/upload-url', purpose: 'Signed source image upload bootstrap', integration: "fetch('/api/media/upload-url', { method: 'POST', credentials: 'include', body: JSON.stringify({ filename, contentType, purpose: 'input', size }) })" },
  { method: 'GET', path: '/api/locale', purpose: 'Locale helper route', integration: "fetch('/api/locale', { method: 'GET' })" },
]

const payloadCollectionRoutes: PageSpec[] = [
  { path: '/api/users', note: 'Payload REST collection: users' },
  { path: '/api/user-follows', note: 'Payload REST collection: user-follows' },
  { path: '/api/avatar-frame-styles', note: 'Payload REST collection: avatar-frame-styles' },
  { path: '/api/media', note: 'Payload REST collection: media' },
  { path: '/api/generation-tasks', note: 'Payload REST collection: generation-tasks' },
  { path: '/api/task-events', note: 'Payload REST collection: task-events' },
  { path: '/api/models', note: 'Payload REST collection: models' },
  { path: '/api/model-comments', note: 'Payload REST collection: model-comments' },
  { path: '/api/model-likes', note: 'Payload REST collection: model-likes' },
  { path: '/api/model-favorites', note: 'Payload REST collection: model-favorites' },
  { path: '/api/homepage-items', note: 'Payload REST collection: homepage-items' },
  { path: '/api/posts', note: 'Payload REST collection: posts' },
  { path: '/api/announcements', note: 'Payload REST collection: announcements' },
  { path: '/api/model-bundles', note: 'Payload REST collection: model-bundles' },
  { path: '/api/credits', note: 'Payload REST collection: credits' },
  { path: '/api/credit-transactions', note: 'Payload REST collection: credit-transactions' },
  { path: '/api/credit-products', note: 'Payload REST collection: credit-products' },
  { path: '/api/engagement-views', note: 'Payload REST collection: engagement-views' },
  { path: '/api/billing-subscriptions', note: 'Payload REST collection: billing-subscriptions' },
  { path: '/api/addresses', note: 'Payload REST collection: addresses' },
  { path: '/api/print-orders', note: 'Payload REST collection: print-orders' },
  { path: '/api/shopify-payments', note: 'Payload REST collection: shopify-payments' },
  { path: '/api/globals/site-settings', note: 'Payload global: site-settings' },
  { path: '/api/globals/homepage-content', note: 'Payload global: homepage-content' },
  { path: '/api/globals/ai-provider-settings', note: 'Payload global: ai-provider-settings' },
  { path: '/api/globals/storage-settings', note: 'Payload global: storage-settings' },
  { path: '/api/globals/security-settings', note: 'Payload global: security-settings' },
  { path: '/api/globals/runtime-deployment-settings', note: 'Payload global: runtime-deployment-settings' },
]

const collectionSummaries: CollectionSpec[] = [
  {
    slug: 'users',
    note: 'Auth users, profile, counters, role',
    access: 'self-or-staff read/update; admin delete; auth enabled',
    fields: ['email', 'fullName', 'displayName', 'avatar', 'profileBackground', 'profileVisibility', 'followersCount', 'followingCount', 'creditsBalance'],
  },
  {
    slug: 'media',
    note: 'Uploads for input, preview, model, document, asset',
    access: 'owner/staff write; guest read only for preview/publicAccess',
    fields: ['alt', 'owner', 'purpose', 'publicAccess', 'filename', 'mimeType', 'url', 'thumbnailURL'],
  },
  {
    slug: 'generation-tasks',
    note: 'AI generation queue and lifecycle',
    access: 'owner/staff only',
    fields: ['taskCode', 'user', 'inputMode', 'prompt', 'provider', 'providerTaskId', 'status', 'progress', 'resultModel', 'callbackPayload'],
  },
  {
    slug: 'models',
    note: '3D model assets and public/private visibility',
    access: 'public or owner/staff read; owner/staff write',
    fields: ['title', 'owner', 'sourceTask', 'status', 'visibility', 'previewImage', 'formats', 'viewerUrl', 'viewCount', 'likesCount', 'favoritesCount', 'commentsCount'],
  },
  {
    slug: 'model-comments',
    note: 'Public comments for public models',
    access: 'signed-in create; author/staff delete; moderation via service endpoint',
    fields: ['model', 'author', 'status', 'content', 'createdAt'],
  },
  {
    slug: 'model-likes',
    note: 'Per-user likes for public models',
    access: 'signed-in create; user/staff delete',
    fields: ['user', 'model', 'createdAt'],
  },
  {
    slug: 'model-favorites',
    note: 'Per-user saved models',
    access: 'signed-in create; user/staff delete',
    fields: ['user', 'model', 'createdAt'],
  },
  {
    slug: 'user-follows',
    note: 'Creator follow relationships',
    access: 'signed-in create; follower/staff delete',
    fields: ['follower', 'followee', 'createdAt'],
  },
  {
    slug: 'engagement-views',
    note: 'Deduplicated public creator/model page views',
    access: 'service/admin use',
    fields: ['targetType', 'targetUser', 'targetModel', 'viewer', 'viewerKeyHash', 'lastViewedAt'],
  },
  {
    slug: 'homepage-items',
    note: 'Curated repeatable homepage content',
    access: 'staff write; public visible read',
    fields: ['title', 'slug', 'placement', 'contentType', 'summary', 'coverImage', 'linkedModel', 'linkedPost', 'linkedAnnouncement', 'linkedBundle', 'isVisible'],
  },
  {
    slug: 'posts',
    note: 'Articles and event-like content',
    access: 'content collection',
    fields: ['title', 'slug', 'summary', 'content', 'status'],
  },
  {
    slug: 'announcements',
    note: 'Short form platform announcements',
    access: 'content collection',
    fields: ['title', 'slug', 'summary', 'status'],
  },
  {
    slug: 'model-bundles',
    note: 'Grouped public content / collection surfaces',
    access: 'content collection',
    fields: ['title', 'slug', 'summary', 'coverImage', 'models'],
  },
  {
    slug: 'credits',
    note: 'Per-user credit account',
    access: 'owner read; admin write',
    fields: ['accountLabel', 'user', 'balance', 'reservedBalance', 'lifetimePurchased', 'lifetimeSpent', 'status'],
  },
  {
    slug: 'credit-transactions',
    note: 'Credits ledger',
    access: 'owner read; admin write',
    fields: ['referenceCode', 'idempotencyKey', 'user', 'creditAccount', 'type', 'amount', 'balanceAfter', 'sourceTask', 'sourceOrder'],
  },
  {
    slug: 'credit-products',
    note: 'Credit top-up products',
    access: 'commerce catalog',
    fields: ['title', 'slug', 'credits', 'price', 'currency', 'isActive'],
  },
  {
    slug: 'billing-subscriptions',
    note: 'Subscription state synced from Stripe',
    access: 'owner read; admin write',
    fields: ['user', 'planKey', 'stripeCustomerId', 'stripeSubscriptionId', 'status', 'interval', 'monthlyCredits', 'currentPeriodStart', 'currentPeriodEnd'],
  },
  {
    slug: 'addresses',
    note: 'Shipping addresses',
    access: 'owner/staff scoped',
    fields: ['user', 'label', 'recipientName', 'phone', 'country', 'state', 'city', 'postalCode'],
  },
  {
    slug: 'print-orders',
    note: 'Physical print order records',
    access: 'owner read; staff update',
    fields: ['orderNumber', 'user', 'model', 'sourceTask', 'status', 'paymentStatus', 'amount', 'currency', 'shippingAddress', 'trackingNumber'],
  },
  {
    slug: 'shopify-payments',
    note: 'Payment records with legacy naming kept for compatibility',
    access: 'commerce/payment record',
    fields: ['checkoutReference', 'user', 'order', 'provider', 'status', 'amount', 'currency'],
  },
  {
    slug: 'task-events',
    note: 'Task event timeline',
    access: 'task event log',
    fields: ['task', 'eventType', 'message', 'metadata', 'createdAt'],
  },
]

const pageMappings: PageMapSpec[] = [
  {
    path: '/',
    note: 'Homepage assembled from marketing data and curated/public content',
    components: ['SiteShell', 'HomeHeroWorkbench', 'HomeFeaturedRail', 'HomeCollectionShelf', 'HomeInspirationSection'],
    dataSources: ['getMarketingSiteData()', 'payload.find(homepage-items)', 'payload.find(models public)', 'getCurrentUser()'],
    endpoints: ['Payload REST /api/homepage-items', 'Payload REST /api/models', 'internal getMarketingSiteData'],
  },
  {
    path: '/generate',
    note: 'Redirect page into workbench mode',
    components: ['redirect only'],
    dataSources: ['searchParams.mode'],
    endpoints: ['none'],
  },
  {
    path: '/workbench',
    note: 'Main workbench shell',
    components: ['WorkbenchClient', 'WorkbenchLeftGenerationPanel', 'ModelViewer', 'ModelLibraryPanel'],
    dataSources: ['getCurrentUser()', 'getCurrentNavUser()', 'getWorkbenchModels()', 'getWorkbenchImageAssets()'],
    endpoints: ['/api/media/upload-url', '/api/studio/ai/tasks', '/api/studio/ai/images', '/api/platform/models/:modelId/viewer'],
  },
  {
    path: '/results/[taskCode]',
    note: 'Task result detail page',
    components: ['SiteShell', 'ResultStatus', 'ModelViewer', 'CreatePrintOrderButton'],
    dataSources: ['getTaskByCode()', 'getCurrentUser()'],
    endpoints: ['/api/studio/ai/tasks/:taskId/sync', '/api/platform/models/:modelId/download', '/api/commerce/print-orders'],
  },
  {
    path: '/dashboard',
    note: 'User dashboard overview',
    components: ['DashboardShell'],
    dataSources: ['requireUser()', 'getCurrentUserTasks()', 'getCurrentUserModels()', 'getCurrentUserOrders()', 'getCurrentUserCreditAccount()'],
    endpoints: ['Payload Local API through session helpers'],
  },
  {
    path: '/dashboard/library',
    note: 'User model library',
    components: ['DashboardShell', 'CreatePrintOrderButton'],
    dataSources: ['requireUser()', 'getCurrentUserModels()'],
    endpoints: ['/api/platform/models/:modelId/download', '/api/commerce/print-orders'],
  },
  {
    path: '/dashboard/orders',
    note: 'Order center',
    components: ['DashboardShell', 'OrderActionButton', 'OrderPaymentStatusSync'],
    dataSources: ['requireUser()', 'getCurrentUserOrders()'],
    endpoints: ['/api/commerce/print-orders/:orderId/sync'],
  },
  {
    path: '/dashboard/settings',
    note: 'Current account profile summary page',
    components: ['DashboardShell'],
    dataSources: ['requireUser()'],
    endpoints: ['future profile editing should use /api/account/profile'],
  },
  {
    path: '/showcase',
    note: 'Public showcase list',
    components: ['SiteShell'],
    dataSources: ['getMarketingSiteData()', 'payload.find(models public)', 'getCurrentUser()'],
    endpoints: ['Payload REST /api/models or service-owned public model readers'],
  },
  {
    path: '/showcase/[id]',
    note: 'Public showcase detail',
    components: ['SiteShell', 'ModelViewer'],
    dataSources: ['payload.find(models public by id)', 'getMarketingSiteData()', 'getCurrentUser()'],
    endpoints: ['/api/platform/models/:modelId/viewer'],
  },
  {
    path: '/login',
    note: 'Compatibility route that opens the global auth modal from the homepage',
    components: ['AuthModalProvider', 'AuthModalStage', 'AuthFlowCard'],
    dataSources: ['auth query params'],
    endpoints: ['/api/account/auth/login', '/api/account/auth/me'],
  },
  {
    path: '/register',
    note: 'Compatibility route that opens the global register modal from the homepage',
    components: ['AuthModalProvider', 'AuthModalStage', 'AuthFlowCard'],
    dataSources: ['auth query params'],
    endpoints: ['/api/account/auth/register'],
  },
  {
    path: '/forgot-password',
    note: 'Compatibility route that opens the global forgot-password modal from the homepage',
    components: ['AuthModalProvider', 'AuthModalStage', 'AuthFlowCard'],
    dataSources: ['client auth form state'],
    endpoints: ['/api/account/auth/forgot-password'],
  },
  {
    path: '/reset-password',
    note: 'Reset password page',
    components: ['ResetPasswordForm'],
    dataSources: ['token from query or route'],
    endpoints: ['/api/account/auth/reset-password'],
  },
  {
    path: '/verify-email/[token]',
    note: 'Verify email page',
    components: ['VerifyEmailClient'],
    dataSources: ['route token'],
    endpoints: ['/api/account/auth/verify-email'],
  },
]

const renderedComponents: ComponentSpec[] = [
  { path: 'src/components/ui/button.tsx', preview: 'rendered', note: 'Base button variants' },
  { path: 'src/components/ui/badge.tsx', preview: 'rendered', note: 'Status badge variants' },
  { path: 'src/components/ui/card.tsx', preview: 'rendered', note: 'Card primitives' },
  { path: 'src/components/ui/input.tsx', preview: 'rendered', note: 'Text input primitive' },
  { path: 'src/components/ui/select.tsx', preview: 'rendered', note: 'Select primitive' },
  { path: 'src/components/ui/textarea.tsx', preview: 'rendered', note: 'Textarea primitive' },
  { path: 'src/components/ui/toggle-group.tsx', preview: 'rendered', note: 'Toggle group primitive' },
  { path: 'src/components/ui/frame-button.tsx', preview: 'rendered', note: 'Framed action button' },
  { path: 'src/components/ui/fixed-slice-frame.tsx', preview: 'rendered', note: 'Reusable 9-slice frame' },
  { path: 'src/components/ui/line-frame.tsx', preview: 'rendered', note: 'Preset line frame wrapper' },
  { path: 'src/app/(frontend)/_components/cards/ModelThumbnailCard.tsx', preview: 'rendered', note: 'Public model card' },
  { path: 'src/components/auth/AuthFlowCard.tsx', preview: 'rendered', note: 'Auth card runtime flow' },
  { path: 'src/app/(frontend)/_components/ModelViewer.tsx', preview: 'rendered', note: '3D preview canvas' },
  { path: 'src/app/(frontend)/_components/GenerateForm.tsx', preview: 'rendered', note: 'Main generate form' },
  { path: 'src/app/(frontend)/_components/WorkbenchComposer.tsx', preview: 'rendered', note: 'Workbench-side create panel' },
]

const listedComponents: ComponentSpec[] = [
  { path: 'src/components/admin/AdminNavQuickLinks.tsx', preview: 'listed', note: 'Payload admin quick links' },
  { path: 'src/components/admin/EmailSettingsNotice.tsx', preview: 'listed', note: 'Admin notice block' },
  { path: 'src/components/admin/OpsDashboard.tsx', preview: 'listed', note: 'Admin dashboard root' },
  { path: 'src/components/admin/RuntimeConfigNotice.tsx', preview: 'listed', note: 'Runtime config notice' },
  { path: 'src/components/admin/RuntimeEnvPreview.tsx', preview: 'listed', note: 'Deployment env preview' },
  { path: 'src/components/admin/ThornsTavernBrand.tsx', preview: 'listed', note: 'Admin brand assets' },
  { path: 'src/components/auth/AuthCardShell.tsx', preview: 'listed', note: 'Auth shell wrapper' },
  { path: 'src/components/auth/AuthFrame.tsx', preview: 'listed', note: 'Auth frame layout' },
  { path: 'src/components/auth/AuthPageLayout.tsx', preview: 'listed', note: 'Auth page layout' },
  { path: 'src/components/ui/field.tsx', preview: 'listed', note: 'Field helpers used in forms' },
  { path: 'src/components/ui/label.tsx', preview: 'listed', note: 'Label primitive' },
  { path: 'src/components/ui/nine-slice-frame.tsx', preview: 'listed', note: 'Alias wrapper for line frame' },
  { path: 'src/components/ui/separator.tsx', preview: 'listed', note: 'Separator primitive' },
  { path: 'src/components/ui/toggle.tsx', preview: 'listed', note: 'Single toggle primitive' },
  { path: 'src/app/(frontend)/_components/CreatePrintOrderButton.tsx', preview: 'listed', note: 'Print order action button' },
  { path: 'src/app/(frontend)/_components/DashboardShell.tsx', preview: 'listed', note: 'Dashboard page shell' },
  { path: 'src/app/(frontend)/_components/HomeHeroWorkbench.tsx', preview: 'listed', note: 'Homepage hero workbench block' },
  { path: 'src/app/(frontend)/_components/LocaleProvider.tsx', preview: 'listed', note: 'Locale provider wrapper' },
  { path: 'src/app/(frontend)/_components/LocaleSwitcher.tsx', preview: 'listed', note: 'Locale switch UI' },
  { path: 'src/app/(frontend)/_components/LogoutButton.tsx', preview: 'listed', note: 'Session logout button' },
  { path: 'src/app/(frontend)/_components/ManageSubscriptionButton.tsx', preview: 'listed', note: 'Open billing portal' },
  { path: 'src/app/(frontend)/_components/MarketingPage.tsx', preview: 'listed', note: 'Marketing page shell' },
  { path: 'src/app/(frontend)/_components/OrderActionButton.tsx', preview: 'listed', note: 'Order sync action' },
  { path: 'src/app/(frontend)/_components/OrderPaymentStatusSync.tsx', preview: 'listed', note: 'Order payment sync helper' },
  { path: 'src/app/(frontend)/_components/ResetPasswordForm.tsx', preview: 'listed', note: 'Reset password form' },
  { path: 'src/app/(frontend)/_components/ResultStatus.tsx', preview: 'listed', note: 'Result page status block' },
  { path: 'src/app/(frontend)/_components/SiteShell.tsx', preview: 'listed', note: 'Frontend shell with nav/footer' },
  { path: 'src/app/(frontend)/_components/SubscribePlanButton.tsx', preview: 'listed', note: 'Subscription CTA' },
  { path: 'src/app/(frontend)/_components/SubscriptionStatusSync.tsx', preview: 'listed', note: 'Subscription sync helper' },
  { path: 'src/app/(frontend)/_components/VerifyEmailClient.tsx', preview: 'listed', note: 'Verify email client flow' },
  { path: 'src/app/(frontend)/_components/home/HomeCollectionShelf.tsx', preview: 'listed', note: 'Homepage collection shelf' },
  { path: 'src/app/(frontend)/_components/home/HomeFeaturedRail.tsx', preview: 'listed', note: 'Homepage featured rail' },
  { path: 'src/app/(frontend)/_components/home/HomeInspirationSection.tsx', preview: 'listed', note: 'Homepage inspiration section' },
  { path: 'src/app/(frontend)/_components/shell/FooterBar.tsx', preview: 'listed', note: 'Footer shell' },
  { path: 'src/app/(frontend)/_components/shell/SectionFrame.tsx', preview: 'listed', note: 'Section frame shell' },
  { path: 'src/app/(frontend)/_components/shell/TopNavBar.tsx', preview: 'listed', note: 'Top navigation bar' },
]

function PreviewBlock({
  children,
  code,
  title,
}: {
  children: React.ReactNode
  code: string
  title: string
}) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Preview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">{children}</div>
        <pre className="overflow-x-auto rounded-lg border border-border/60 bg-black/90 p-3 text-xs text-neutral-200">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  )
}

function SimpleTable({
  rows,
}: {
  rows: Array<{ href?: string; note: string; path: string }>
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Path</th>
            <th className="px-3 py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-border/60 align-top" key={row.path}>
              <td className="px-3 py-2 font-mono text-xs text-primary">
                {row.href ? (
                  <Link className="underline-offset-4 hover:underline" href={row.href}>
                    {row.path}
                  </Link>
                ) : (
                  row.path
                )}
              </td>
              <td className="px-3 py-2 text-muted-foreground">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EndpointTable({ rows }: { rows: EndpointSpec[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Method</th>
            <th className="px-3 py-2 font-medium">Path</th>
            <th className="px-3 py-2 font-medium">Purpose</th>
            <th className="px-3 py-2 font-medium">Integration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-border/60 align-top" key={`${row.method}:${row.path}`}>
              <td className="px-3 py-2 font-mono text-xs">{row.method}</td>
              <td className="px-3 py-2 font-mono text-xs text-primary">{row.path}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.purpose}</td>
              <td className="px-3 py-2">
                <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-border/60 bg-muted/30 p-2 text-[11px]">
                  <code>{row.integration}</code>
                </pre>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ComponentTable({ rows }: { rows: ComponentSpec[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Component File</th>
            <th className="px-3 py-2 font-medium">Mode</th>
            <th className="px-3 py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-border/60 align-top" key={row.path}>
              <td className="px-3 py-2 font-mono text-xs text-primary">{row.path}</td>
              <td className="px-3 py-2">{row.preview}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CollectionTable({ rows }: { rows: CollectionSpec[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Collection</th>
            <th className="px-3 py-2 font-medium">Purpose</th>
            <th className="px-3 py-2 font-medium">Access</th>
            <th className="px-3 py-2 font-medium">Key Fields</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-border/60 align-top" key={row.slug}>
              <td className="px-3 py-2 font-mono text-xs text-primary">{row.slug}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.note}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.access}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {row.fields.map((field) => (
                    <Badge key={`${row.slug}-${field}`} variant="outline">
                      {field}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PageMapTable({ rows }: { rows: PageMapSpec[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Page</th>
            <th className="px-3 py-2 font-medium">Purpose</th>
            <th className="px-3 py-2 font-medium">Components</th>
            <th className="px-3 py-2 font-medium">Data Sources</th>
            <th className="px-3 py-2 font-medium">Endpoints</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-border/60 align-top" key={row.path}>
              <td className="px-3 py-2 font-mono text-xs text-primary">{row.path}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.note}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {row.components.map((item) => (
                    <Badge key={`${row.path}-component-${item}`} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {row.dataSources.map((item) => (
                    <Badge key={`${row.path}-data-${item}`} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  {row.endpoints.map((item) => (
                    <Badge key={`${row.path}-endpoint-${item}`} variant="ghost">
                      {item}
                    </Badge>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ProjectTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="space-y-3">
          <Badge variant="secondary">Project Test Page</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Project Map, Component Preview, Routes, and API Index</h1>
          <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
            This page does not use the normal site navigation. It is a direct internal reference page for component preview,
            page path lookup, and API integration examples.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/">Back To Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/generate">Open Generate</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workbench">Open Workbench</Link>
            </Button>
            <Button asChild>
              <Link href="#custom-api-endpoints">Open API Index</Link>
            </Button>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick Component Preview</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <PreviewBlock
              code={`<Button>Primary</Button>\n<Button variant="outline">Outline</Button>\n<Badge variant="secondary">Status</Badge>`}
              title="Button + Badge"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </PreviewBlock>

            <PreviewBlock
              code={`<Card>\n  <CardHeader />\n  <CardContent />\n</Card>`}
              title="Card"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Sample Card</CardTitle>
                  <CardDescription>Use this for grouped content blocks.</CardDescription>
                </CardHeader>
                <CardContent>Card body content.</CardContent>
              </Card>
            </PreviewBlock>

            <PreviewBlock
              code={`<Input />\n<Select />\n<Textarea />\n<ToggleGroup />`}
              title="Form Primitives"
            >
              <div className="space-y-3">
                <Input placeholder="Input preview" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preview" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one">One</SelectItem>
                    <SelectItem value="two">Two</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Textarea preview" rows={4} />
                <ToggleGroup type="single" variant="outline">
                  <ToggleGroupItem value="image">Image</ToggleGroupItem>
                  <ToggleGroupItem value="text">Text</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </PreviewBlock>

            <PreviewBlock
              code={`<FrameButton variant="gold">Generate</FrameButton>\n<FrameButton variant="slate">Cancel</FrameButton>`}
              title="Frame Button"
            >
              <div className="flex flex-wrap items-center gap-3">
                <FrameButton variant="gold">Generate</FrameButton>
                <FrameButton variant="slate">Cancel</FrameButton>
                <FrameButton height={42} variant="gold" width={180}>
                  Wide Action
                </FrameButton>
              </div>
            </PreviewBlock>

            <PreviewBlock
              code={`<FixedSliceFrame frameSize={72} />\n<LineFrame frameSize={84} />`}
              title="Frame Containers"
            >
              <div className="grid gap-4">
                <FixedSliceFrame
                  className="bg-[#111115]"
                  contentPadding={16}
                  fill="#111115"
                  frameSize={72}
                  slices={{
                    bottom: '/ui/frames/workbench-panel-9slice/images/model-card-frame_08.png',
                    bottomLeft: '/ui/frames/workbench-panel-9slice/images/model-card-frame_07.png',
                    bottomRight: '/ui/frames/workbench-panel-9slice/images/model-card-frame_09.png',
                    left: '/ui/frames/workbench-panel-9slice/images/model-card-frame_04.png',
                    right: '/ui/frames/workbench-panel-9slice/images/model-card-frame_06.png',
                    top: '/ui/frames/workbench-panel-9slice/images/model-card-frame_02.png',
                    topLeft: '/ui/frames/workbench-panel-9slice/images/model-card-frame_01.png',
                    topRight: '/ui/frames/workbench-panel-9slice/images/model-card-frame_03.png',
                  }}
                >
                  <div className="text-sm text-neutral-200">FixedSliceFrame content</div>
                </FixedSliceFrame>

                <LineFrame className="bg-[#0d0d10]" contentPadding={16} frameSize={84}>
                  <div className="text-sm text-neutral-200">LineFrame content</div>
                </LineFrame>
              </div>
            </PreviewBlock>

            <PreviewBlock
              code={`<ModelViewer label="Preview" />`}
              title="Model Viewer"
            >
              <div className="relative h-[320px] overflow-hidden rounded-lg border border-border/60">
                <ModelViewer className="h-full w-full" displayBase="workbench" label="Preview Viewer" />
              </div>
            </PreviewBlock>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Business Component Preview</h2>
          <div className="grid gap-6">
            <PreviewBlock
              code={`<ModelThumbnailCard variant="homepage" />\n<ModelThumbnailCard variant="showcase" />`}
              title="Model Thumbnail Card"
            >
              <div className="flex flex-wrap gap-6">
                <ModelThumbnailCard
                  authorName="Moonforge"
                  commentsCount={88}
                  createdLabel="1 Week ago"
                  href="/showcase/1"
                  likesCount={120}
                  thumbnailUrl="/ui/frames/products3.png"
                  title="Fox Sorcerer"
                  variant="homepage"
                  viewsCount="980"
                />
                <ModelThumbnailCard
                  authorName="Xing Mu"
                  commentsCount={267}
                  createdLabel="6 Days ago"
                  href="/showcase/2"
                  likesCount={1500}
                  thumbnailUrl="/ui/frames/products2.png"
                  title="Tavern Bard"
                  variant="showcase"
                  viewsCount="2.3k"
                />
              </div>
            </PreviewBlock>

            <PreviewBlock
              code={`<AuthFlowCard initialMode="login" />\n<AuthFlowCard initialMode="register" />`}
              title="Auth Flow Card"
            >
              <div className="flex flex-wrap gap-6">
                <div className="max-w-[380px]">
                  <AuthFlowCard initialMode="login" redirectTo="/generate" />
                </div>
                <div className="max-w-[380px]">
                  <AuthFlowCard initialMode="register" redirectTo="/generate" />
                </div>
              </div>
            </PreviewBlock>

            <PreviewBlock
              code={`<GenerateForm generationPricing={defaultGenerationPricing} />`}
              title="Generate Form"
            >
              <GenerateForm generationPricing={defaultGenerationPricing} />
            </PreviewBlock>

            <PreviewBlock
              code={`<WorkbenchComposer generationPricing={defaultGenerationPricing} isAuthenticated={false} />`}
              title="Workbench Composer"
            >
              <div className="max-w-[640px]">
                <WorkbenchComposer generationPricing={defaultGenerationPricing} isAuthenticated={false} />
              </div>
            </PreviewBlock>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Rendered Component Files</h2>
          <ComponentTable rows={renderedComponents} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Listed Component Files</h2>
          <ComponentTable rows={listedComponents} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Payload Collection Field Summary</h2>
          <CollectionTable rows={collectionSummaries} />
        </section>

        <section className="space-y-4" id="frontend-pages">
          <h2 className="text-2xl font-semibold">Frontend Page Paths</h2>
          <SimpleTable rows={frontendPages} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Page To Component / Data / Endpoint Map</h2>
          <PageMapTable rows={pageMappings} />
        </section>

        <section className="space-y-4" id="payload-and-app-routes">
          <h2 className="text-2xl font-semibold">Payload And App Routes</h2>
          <SimpleTable rows={payloadAndAppRoutes} />
        </section>

        <section className="space-y-4" id="custom-api-endpoints">
          <h2 className="text-2xl font-semibold">Custom API Endpoints</h2>
          <EndpointTable rows={customEndpoints} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Payload Default REST And Global Routes</h2>
          <SimpleTable rows={payloadCollectionRoutes} />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Fast Notes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auth And Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Project-owned auth entry is under <code>/api/account/auth/*</code>.</p>
                <p>Client-side authenticated calls should normally use <code>credentials: &apos;include&apos;</code>.</p>
                <p>Profile, favorites, follows, dashboard, comments write, and reactions write all require a signed-in user.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payload Data Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Default REST collections live under <code>/api/&lt;collection-slug&gt;</code>.</p>
                <p>Sanitized product APIs live under explicit routes such as <code>/api/social/models/:id/detail</code>.</p>
                <p>Use explicit service-owned routes for creator profile, social state, and dashboard aggregates instead of opening general collection reads.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  )
}
