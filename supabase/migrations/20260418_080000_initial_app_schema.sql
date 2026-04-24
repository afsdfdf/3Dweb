begin;

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'operator', 'customer')),
  account_status text not null default 'active' check (account_status in ('active', 'disabled')),
  phone text,
  stripe_customer_id text,
  shopify_customer_id text,
  credits_balance_cached numeric(18, 2) not null default 0,
  locale text not null default 'en' check (locale in ('en', 'zh')),
  avatar_media_id uuid,
  last_active_at timestamptz,
  disabled_at timestamptz,
  disabled_reason text,
  disabled_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_email_unique_idx on public.profiles (lower(email)) where email is not null;
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_account_status_idx on public.profiles (account_status);
create index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id) where stripe_customer_id is not null;
create index if not exists profiles_shopify_customer_id_idx on public.profiles (shopify_customer_id) where shopify_customer_id is not null;

create table if not exists public.media (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  alt text not null,
  purpose text not null default 'asset' check (purpose in ('input', 'preview', 'model', 'document', 'asset')),
  storage_provider text not null default 's3' check (storage_provider in ('s3', 'supabase-storage', 'external')),
  storage_bucket text,
  storage_path text,
  public_url text,
  thumbnail_url text,
  filename text,
  mime_type text,
  file_size_bytes bigint,
  width integer,
  height integer,
  focal_x numeric(8, 4),
  focal_y numeric(8, 4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists media_owner_id_idx on public.media (owner_id);
create index if not exists media_purpose_idx on public.media (purpose);
create index if not exists media_storage_provider_idx on public.media (storage_provider);

alter table public.profiles
  add constraint profiles_avatar_media_id_fkey
  foreign key (avatar_media_id) references public.media(id) on delete set null;

alter table public.profiles
  add constraint profiles_disabled_by_fkey
  foreign key (disabled_by) references public.profiles(id) on delete set null;

create table if not exists public.credit_accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  account_label text not null default 'Primary Credit Account',
  available_balance numeric(18, 2) not null default 0,
  reserved_balance numeric(18, 2) not null default 0,
  lifetime_purchased numeric(18, 2) not null default 0,
  lifetime_spent numeric(18, 2) not null default 0,
  lifetime_granted numeric(18, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  billing_notes text,
  exception_flag boolean not null default false,
  exception_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists credit_accounts_status_idx on public.credit_accounts (status);
create index if not exists credit_accounts_reviewed_by_idx on public.credit_accounts (reviewed_by);

create table if not exists public.credit_products (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  title text not null,
  product_type text not null default 'credit-topup' check (product_type in ('credit-topup', 'print-package', 'subscription-addon')),
  description text,
  credits numeric(18, 2) not null default 0,
  price numeric(18, 2) not null default 0,
  currency text not null default 'USD',
  stripe_product_id text,
  stripe_price_id text,
  shopify_product_id text,
  shopify_variant_id text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists credit_products_active_idx on public.credit_products (is_active);
create index if not exists credit_products_sort_order_idx on public.credit_products (sort_order);

create table if not exists public.posts (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  category text not null default 'article' check (category in ('article', 'event', 'announcement')),
  cover_media_id uuid references public.media(id) on delete set null,
  video_url text,
  created_by uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  is_pinned boolean not null default false,
  is_visible boolean not null default true,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists posts_publication_status_idx on public.posts (publication_status);
create index if not exists posts_visible_idx on public.posts (is_visible);
create index if not exists posts_published_at_idx on public.posts (published_at desc);

create table if not exists public.post_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  title text not null,
  excerpt text,
  content jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (post_id, locale)
);

create index if not exists post_translations_locale_idx on public.post_translations (locale);

create table if not exists public.announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  publish_at timestamptz,
  is_pinned boolean not null default false,
  is_visible boolean not null default true,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists announcements_publication_status_idx on public.announcements (publication_status);
create index if not exists announcements_visible_idx on public.announcements (is_visible);

create table if not exists public.announcement_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  title text not null,
  summary text,
  content jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (announcement_id, locale)
);

create table if not exists public.ai_tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  task_code text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  input_mode text not null check (input_mode in ('image', 'text', 'hybrid')),
  prompt text,
  source_media_id uuid references public.media(id) on delete set null,
  provider text not null default 'custom' check (provider in ('meshy', 'tripo', 'custom')),
  provider_task_id text,
  status text not null default 'queued' check (status in ('queued', 'processing', 'succeeded', 'failed', 'timeout')),
  progress numeric(5, 2) not null default 0,
  parameter_snapshot jsonb not null default '{}'::jsonb,
  credits_reserved numeric(18, 2) not null default 0,
  credits_spent numeric(18, 2) not null default 0,
  result_model_id uuid,
  print_requested boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  callback_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_tasks_user_id_idx on public.ai_tasks (user_id);
create index if not exists ai_tasks_provider_task_id_idx on public.ai_tasks (provider_task_id);
create index if not exists ai_tasks_status_idx on public.ai_tasks (status);
create index if not exists ai_tasks_created_at_idx on public.ai_tasks (created_at desc);

create table if not exists public.models (
  id uuid primary key default extensions.gen_random_uuid(),
  title text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source_task_id uuid references public.ai_tasks(id) on delete set null,
  status text not null default 'ready' check (status in ('draft', 'ready', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'team', 'public')),
  preview_media_id uuid references public.media(id) on delete set null,
  viewer_url text,
  print_ready boolean not null default false,
  width_mm numeric(18, 2),
  height_mm numeric(18, 2),
  depth_mm numeric(18, 2),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists models_owner_id_idx on public.models (owner_id);
create index if not exists models_visibility_idx on public.models (visibility);
create index if not exists models_status_idx on public.models (status);
create index if not exists models_source_task_id_idx on public.models (source_task_id);

alter table public.ai_tasks
  add constraint ai_tasks_result_model_id_fkey
  foreign key (result_model_id) references public.models(id) on delete set null;

create table if not exists public.model_assets (
  id uuid primary key default extensions.gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  asset_format text not null check (asset_format in ('glb', 'fbx', 'obj', 'stl', 'usdz')),
  media_id uuid references public.media(id) on delete set null,
  download_credits numeric(18, 2) not null default 0,
  file_size_mb numeric(18, 2),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (model_id, asset_format)
);

create table if not exists public.model_tags (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.model_tag_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  tag_id uuid not null references public.model_tags(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tag_id, locale)
);

create table if not exists public.model_tag_assignments (
  model_id uuid not null references public.models(id) on delete cascade,
  tag_id uuid not null references public.model_tags(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (model_id, tag_id)
);

create table if not exists public.model_bundles (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  cover_media_id uuid references public.media(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  publish_at timestamptz,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.model_bundle_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  bundle_id uuid not null references public.model_bundles(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  title text not null,
  summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (bundle_id, locale)
);

create table if not exists public.model_bundle_items (
  bundle_id uuid not null references public.model_bundles(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (bundle_id, model_id)
);

create table if not exists public.model_bundle_tags (
  id uuid primary key default extensions.gen_random_uuid(),
  bundle_id uuid not null references public.model_bundles(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.model_bundle_tag_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  bundle_tag_id uuid not null references public.model_bundle_tags(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (bundle_tag_id, locale)
);

create table if not exists public.homepage_items (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  placement text not null default 'featured' check (placement in ('hero-secondary', 'featured', 'bundles', 'announcements', 'articles')),
  content_type text not null default 'custom' check (content_type in ('custom', 'model', 'post', 'announcement', 'bundle')),
  cover_media_id uuid references public.media(id) on delete set null,
  linked_model_id uuid references public.models(id) on delete set null,
  linked_post_id uuid references public.posts(id) on delete set null,
  linked_announcement_id uuid references public.announcements(id) on delete set null,
  linked_bundle_id uuid references public.model_bundles(id) on delete set null,
  custom_href text,
  created_by uuid references public.profiles(id) on delete set null,
  publish_at timestamptz,
  is_pinned boolean not null default false,
  is_visible boolean not null default true,
  publication_status text not null default 'draft' check (publication_status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_item_translations (
  id uuid primary key default extensions.gen_random_uuid(),
  homepage_item_id uuid not null references public.homepage_items(id) on delete cascade,
  locale text not null check (locale in ('en', 'zh')),
  title text not null,
  summary text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (homepage_item_id, locale)
);

create table if not exists public.addresses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text,
  recipient_name text not null,
  phone text,
  country text not null default 'China',
  province text,
  city text not null,
  district text,
  postal_code text,
  address_line_1 text not null,
  address_line_2 text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists addresses_user_id_idx on public.addresses (user_id);

create table if not exists public.print_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  model_id uuid not null references public.models(id) on delete restrict,
  source_task_id uuid references public.ai_tasks(id) on delete set null,
  status text not null default 'pending-payment' check (status in ('pending-payment', 'paid', 'in-production', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  amount numeric(18, 2) not null default 0,
  currency text not null default 'USD',
  credits_used numeric(18, 2) not null default 0,
  size_option text,
  material_option text,
  shipping_name text,
  shipping_phone text,
  shipping_address text,
  tracking_number text,
  provider_order_id text,
  provider_checkout_url text,
  status_updated_at timestamptz,
  status_updated_by uuid references public.profiles(id) on delete set null,
  internal_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists print_orders_user_id_idx on public.print_orders (user_id);
create index if not exists print_orders_status_idx on public.print_orders (status);
create index if not exists print_orders_payment_status_idx on public.print_orders (payment_status);

create table if not exists public.order_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  checkout_reference text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'shopify', 'manual')),
  payment_type text not null check (payment_type in ('credit-topup', 'print-order', 'subscription')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  provider_order_id text,
  provider_checkout_id text,
  credits_granted numeric(18, 2) not null default 0,
  linked_order_id uuid references public.print_orders(id) on delete set null,
  amount numeric(18, 2) not null default 0,
  currency text not null default 'USD',
  raw_payload jsonb not null default '{}'::jsonb,
  exception_flag boolean not null default false,
  exception_reason text,
  handled_at timestamptz,
  handled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_payments_user_id_idx on public.order_payments (user_id);
create index if not exists order_payments_provider_checkout_id_idx on public.order_payments (provider_checkout_id);
create index if not exists order_payments_status_idx on public.order_payments (status);

create table if not exists public.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe', 'shopify', 'manual')),
  plan_key text not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'incomplete' check (status in ('incomplete', 'active', 'trialing', 'past_due', 'unpaid', 'canceled', 'incomplete_expired')),
  billing_interval text not null default 'month' check (billing_interval in ('day', 'week', 'month', 'year')),
  monthly_credits numeric(18, 2) not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_granted_period_key text,
  last_checkout_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  sync_exception_flag boolean not null default false,
  sync_exception_reason text,
  last_synced_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);

create table if not exists public.ai_task_events (
  id uuid primary key default extensions.gen_random_uuid(),
  task_id uuid not null references public.ai_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('queued', 'submitted', 'polling', 'callback', 'completed', 'failed')),
  provider text,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_task_events_task_id_idx on public.ai_task_events (task_id);
create index if not exists ai_task_events_user_id_idx on public.ai_task_events (user_id);

create table if not exists public.audit_logs (
  id uuid primary key default extensions.gen_random_uuid(),
  event_type text not null,
  status text not null check (status in ('accepted', 'completed', 'failed', 'idempotent', 'ignored', 'rejected')),
  subject_profile_id uuid references public.profiles(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  ai_task_id uuid references public.ai_tasks(id) on delete set null,
  print_order_id uuid references public.print_orders(id) on delete set null,
  order_payment_id uuid references public.order_payments(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  session_id text,
  provider text,
  occurred_at timestamptz not null default timezone('utc', now()),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_occurred_at_idx on public.audit_logs (occurred_at desc);
create index if not exists audit_logs_event_type_idx on public.audit_logs (event_type);

create table if not exists public.site_settings (
  key text primary key default 'default' check (key = 'default'),
  site_name text not null default 'MiniForge AI 3D',
  site_description text,
  support_email text,
  announcement text,
  subscription_provider text not null default 'stripe' check (subscription_provider in ('stripe', 'shopify')),
  order_provider text not null default 'stripe' check (order_provider in ('stripe', 'shopify')),
  provider_notice text,
  generation_pricing_image_credits numeric(18, 2) not null default 20,
  generation_pricing_text_credits numeric(18, 2) not null default 15,
  generation_pricing_hybrid_credits numeric(18, 2) not null default 25,
  generation_pricing_download_credits numeric(18, 2) not null default 5,
  email_sender_from_name text,
  email_sender_from_address text,
  email_sender_reply_to text,
  email_brand_product_name text,
  email_brand_footer_text text,
  effective_mode text not null default 'supabase',
  change_summary text,
  last_modified_by uuid references public.profiles(id) on delete set null,
  last_validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.site_settings (key)
values ('default')
on conflict (key) do nothing;

create table if not exists public.site_navigation_items (
  id uuid primary key default extensions.gen_random_uuid(),
  site_settings_key text not null default 'default' references public.site_settings(key) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  href text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_footer_sections (
  section_key text primary key check (section_key in ('about', 'direction')),
  site_settings_key text not null default 'default' references public.site_settings(key) on delete cascade,
  eyebrow text,
  title text,
  body text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_email_templates (
  template_key text primary key check (template_key in ('welcome', 'verify', 'forgot-password', 'subscription-success', 'order-paid')),
  site_settings_key text not null default 'default' references public.site_settings(key) on delete cascade,
  subject text not null,
  intro text not null,
  cta_label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_plans (
  id uuid primary key default extensions.gen_random_uuid(),
  site_settings_key text not null default 'default' references public.site_settings(key) on delete cascade,
  plan_key text not null unique check (plan_key in ('starter', 'pro', 'studio')),
  name text not null,
  short_label text not null,
  monthly_price numeric(18, 2) not null default 0,
  credits_per_month numeric(18, 2) not null default 0,
  description text,
  lookup_key text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_plan_features (
  id uuid primary key default extensions.gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.credit_packages (
  id uuid primary key default extensions.gen_random_uuid(),
  site_settings_key text not null default 'default' references public.site_settings(key) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  shopify_variant_id text,
  credits numeric(18, 2) not null default 0,
  price numeric(18, 2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_content (
  key text primary key default 'default' check (key = 'default'),
  hero_eyebrow text,
  hero_title text,
  hero_subtitle text,
  hero_primary_cta_label text,
  hero_primary_cta_href text,
  hero_secondary_cta_label text,
  hero_secondary_cta_href text,
  intro_band_eyebrow text,
  intro_band_title text,
  intro_band_text text,
  service_intro_eyebrow text,
  service_intro_title text,
  service_intro_text text,
  process_section_eyebrow text,
  process_section_title text,
  entry_section_eyebrow text,
  entry_section_title text,
  entry_section_text text,
  faq_section_eyebrow text,
  faq_section_title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.homepage_content (key)
values ('default')
on conflict (key) do nothing;

create table if not exists public.homepage_featured_works (
  id uuid primary key default extensions.gen_random_uuid(),
  homepage_content_key text not null default 'default' references public.homepage_content(key) on delete cascade,
  sort_order integer not null default 0,
  category text not null,
  title text not null,
  summary text,
  tone text not null default 'violet' check (tone in ('violet', 'blue', 'pink')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_service_blocks (
  id uuid primary key default extensions.gen_random_uuid(),
  homepage_content_key text not null default 'default' references public.homepage_content(key) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_use_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  homepage_content_key text not null default 'default' references public.homepage_content(key) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_process_steps (
  id uuid primary key default extensions.gen_random_uuid(),
  homepage_content_key text not null default 'default' references public.homepage_content(key) on delete cascade,
  sort_order integer not null default 0,
  step_label text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.homepage_faq_items (
  id uuid primary key default extensions.gen_random_uuid(),
  homepage_content_key text not null default 'default' references public.homepage_content(key) on delete cascade,
  sort_order integer not null default 0,
  question text not null,
  answer text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_provider_settings (
  key text primary key default 'default' check (key = 'default'),
  default_model_provider text not null default 'custom',
  default_image_provider text not null default 'openai',
  default_llm_provider text not null default 'openai',
  mock_mode boolean not null default true,
  credentials_notice text,
  polling_enabled boolean not null default true,
  polling_interval_seconds integer not null default 20,
  polling_timeout_minutes integer not null default 8,
  reserve_credits_on_submit boolean not null default true,
  refund_credits_on_failure boolean not null default true,
  effective_mode text not null default 'supabase',
  change_summary text,
  last_modified_by uuid references public.profiles(id) on delete set null,
  last_validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.ai_provider_settings (key)
values ('default')
on conflict (key) do nothing;

create table if not exists public.ai_provider_integrations (
  id uuid primary key default extensions.gen_random_uuid(),
  settings_key text not null default 'default' references public.ai_provider_settings(key) on delete cascade,
  integration_kind text not null check (integration_kind in ('model3d', 'image', 'llm')),
  provider_key text not null,
  base_url text,
  model text,
  submit_path text,
  status_path text,
  api_key_hint text,
  enabled boolean not null default true,
  credentials_source text,
  last_validated_at timestamptz,
  last_rotated_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (settings_key, integration_kind, provider_key)
);

create table if not exists public.storage_settings (
  key text primary key default 'default' check (key = 'default'),
  provider text not null default 's3' check (provider in ('s3', 'supabase-storage', 'external')),
  enabled boolean not null default false,
  bucket text,
  region text,
  prefix text,
  base_url text,
  signed_downloads boolean not null default true,
  credentials_source text not null default 'environment',
  effective_mode text not null default 'supabase',
  change_summary text,
  last_modified_by uuid references public.profiles(id) on delete set null,
  last_validated_at timestamptz,
  last_rotated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.storage_settings (key)
values ('default')
on conflict (key) do nothing;

create table if not exists public.security_settings (
  key text primary key default 'default' check (key = 'default'),
  effective_mode text not null default 'supabase',
  change_summary text,
  last_modified_by uuid references public.profiles(id) on delete set null,
  last_validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.security_settings (key)
values ('default')
on conflict (key) do nothing;

create table if not exists public.security_allowed_mutation_origins (
  id uuid primary key default extensions.gen_random_uuid(),
  settings_key text not null default 'default' references public.security_settings(key) on delete cascade,
  origin text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.security_allowed_remote_asset_hosts (
  id uuid primary key default extensions.gen_random_uuid(),
  settings_key text not null default 'default' references public.security_settings(key) on delete cascade,
  host text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.runtime_deployment_settings (
  key text primary key default 'default' check (key = 'default'),
  app_url text,
  secret_rotation_note text,
  deployment_notes text,
  effective_mode text not null default 'supabase',
  change_summary text,
  last_modified_by uuid references public.profiles(id) on delete set null,
  last_validated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.runtime_deployment_settings (key)
values ('default')
on conflict (key) do nothing;

create table if not exists public.migration_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  migration_name text not null,
  source_kind text not null check (source_kind in ('sqlite', 'payload-postgres', 'manual', 'supabase')),
  status text not null check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.data_reconciliation_reports (
  id uuid primary key default extensions.gen_random_uuid(),
  report_key text not null unique,
  source_kind text not null check (source_kind in ('sqlite', 'payload-postgres', 'manual', 'supabase')),
  report_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.credit_ledger_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  reference_code text not null unique,
  idempotency_key text unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  credit_account_id uuid not null references public.credit_accounts(id) on delete cascade,
  entry_type text not null check (entry_type in ('purchase', 'task_hold', 'task_spend', 'download_spend', 'refund', 'manual_adjustment', 'subscription_grant')),
  balance_delta numeric(18, 2) not null default 0,
  reserved_delta numeric(18, 2) not null default 0,
  unit text not null default 'credits',
  available_balance_after numeric(18, 2),
  reserved_balance_after numeric(18, 2),
  source_task_id uuid references public.ai_tasks(id) on delete set null,
  source_order_id uuid references public.print_orders(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  exception_flag boolean not null default false,
  exception_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists credit_ledger_entries_user_id_idx on public.credit_ledger_entries (user_id);
create index if not exists credit_ledger_entries_account_id_idx on public.credit_ledger_entries (credit_account_id);
create index if not exists credit_ledger_entries_type_idx on public.credit_ledger_entries (entry_type);
create index if not exists credit_ledger_entries_created_at_idx on public.credit_ledger_entries (created_at desc);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'operator')
      and account_status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and account_status = 'active'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_name text;
  account_id uuid;
begin
  generated_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, new.phone, new.id::text), '@', 1)
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    account_status
  )
  values (
    new.id,
    new.email,
    generated_name,
    'customer',
    'active'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = timezone('utc', now());

  insert into public.credit_accounts (
    user_id,
    account_label
  )
  values (
    new.id,
    'Primary Credit Account'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

create or replace function public.apply_credit_ledger_entry(
  p_user_id uuid,
  p_entry_type text,
  p_balance_delta numeric,
  p_reserved_delta numeric default 0,
  p_unit text default 'credits',
  p_reference_code text default null,
  p_idempotency_key text default null,
  p_source_task_id uuid default null,
  p_source_order_id uuid default null,
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.credit_ledger_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.credit_accounts;
  v_existing public.credit_ledger_entries;
  v_reference text;
  v_available_after numeric(18,2);
  v_reserved_after numeric(18,2);
  v_row public.credit_ledger_entries;
begin
  if p_idempotency_key is not null then
    select *
    into v_existing
    from public.credit_ledger_entries
    where idempotency_key = p_idempotency_key;

    if found then
      return v_existing;
    end if;
  end if;

  select *
  into v_account
  from public.credit_accounts
  where user_id = p_user_id
  for update;

  if not found then
    insert into public.credit_accounts (user_id)
    values (p_user_id)
    returning *
    into v_account;
  end if;

  v_available_after := v_account.available_balance + coalesce(p_balance_delta, 0);
  v_reserved_after := v_account.reserved_balance + coalesce(p_reserved_delta, 0);

  if v_available_after < 0 then
    raise exception 'Insufficient available balance';
  end if;

  if v_reserved_after < 0 then
    raise exception 'Reserved balance cannot be negative';
  end if;

  v_reference := coalesce(
    p_reference_code,
    'LEDGER-' || replace(extensions.gen_random_uuid()::text, '-', '')
  );

  update public.credit_accounts
  set
    available_balance = v_available_after,
    reserved_balance = v_reserved_after,
    lifetime_purchased = lifetime_purchased + case when p_entry_type = 'purchase' then greatest(p_balance_delta, 0) else 0 end,
    lifetime_spent = lifetime_spent + case when p_entry_type in ('task_spend', 'download_spend') then greatest(abs(p_balance_delta), 0) else 0 end,
    lifetime_granted = lifetime_granted + case when p_entry_type in ('manual_adjustment', 'refund', 'subscription_grant') and p_balance_delta > 0 then p_balance_delta else 0 end,
    updated_at = timezone('utc', now())
  where id = v_account.id;

  update public.profiles
  set
    credits_balance_cached = v_available_after,
    updated_at = timezone('utc', now())
  where id = p_user_id;

  insert into public.credit_ledger_entries (
    reference_code,
    idempotency_key,
    user_id,
    credit_account_id,
    entry_type,
    balance_delta,
    reserved_delta,
    unit,
    available_balance_after,
    reserved_balance_after,
    source_task_id,
    source_order_id,
    notes,
    metadata
  )
  values (
    v_reference,
    p_idempotency_key,
    p_user_id,
    v_account.id,
    p_entry_type,
    p_balance_delta,
    p_reserved_delta,
    p_unit,
    v_available_after,
    v_reserved_after,
    p_source_task_id,
    p_source_order_id,
    p_notes,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning *
  into v_row;

  return v_row;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'media',
    'credit_accounts',
    'credit_products',
    'posts',
    'post_translations',
    'announcements',
    'announcement_translations',
    'ai_tasks',
    'models',
    'model_assets',
    'model_tags',
    'model_tag_translations',
    'model_bundle_translations',
    'homepage_items',
    'homepage_item_translations',
    'addresses',
    'print_orders',
    'order_payments',
    'subscriptions',
    'ai_task_events',
    'audit_logs',
    'site_settings',
    'site_navigation_items',
    'site_footer_sections',
    'site_email_templates',
    'subscription_plans',
    'subscription_plan_features',
    'credit_packages',
    'homepage_content',
    'homepage_featured_works',
    'homepage_service_blocks',
    'homepage_use_cases',
    'homepage_process_steps',
    'homepage_faq_items',
    'ai_provider_settings',
    'ai_provider_integrations',
    'storage_settings',
    'security_settings',
    'security_allowed_mutation_origins',
    'security_allowed_remote_asset_hosts',
    'runtime_deployment_settings',
    'migration_runs',
    'data_reconciliation_reports',
    'credit_ledger_entries'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute procedure public.set_current_timestamp_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger_entries enable row level security;
alter table public.ai_tasks enable row level security;
alter table public.ai_task_events enable row level security;
alter table public.models enable row level security;
alter table public.model_assets enable row level security;
alter table public.model_tags enable row level security;
alter table public.model_tag_translations enable row level security;
alter table public.model_tag_assignments enable row level security;
alter table public.credit_products enable row level security;
alter table public.homepage_items enable row level security;
alter table public.homepage_item_translations enable row level security;
alter table public.posts enable row level security;
alter table public.post_translations enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_translations enable row level security;
alter table public.model_bundles enable row level security;
alter table public.model_bundle_translations enable row level security;
alter table public.model_bundle_items enable row level security;
alter table public.model_bundle_tags enable row level security;
alter table public.model_bundle_tag_translations enable row level security;
alter table public.addresses enable row level security;
alter table public.print_orders enable row level security;
alter table public.order_payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_navigation_items enable row level security;
alter table public.site_footer_sections enable row level security;
alter table public.site_email_templates enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscription_plan_features enable row level security;
alter table public.credit_packages enable row level security;
alter table public.homepage_content enable row level security;
alter table public.homepage_featured_works enable row level security;
alter table public.homepage_service_blocks enable row level security;
alter table public.homepage_use_cases enable row level security;
alter table public.homepage_process_steps enable row level security;
alter table public.homepage_faq_items enable row level security;
alter table public.ai_provider_settings enable row level security;
alter table public.ai_provider_integrations enable row level security;
alter table public.storage_settings enable row level security;
alter table public.security_settings enable row level security;
alter table public.security_allowed_mutation_origins enable row level security;
alter table public.security_allowed_remote_asset_hosts enable row level security;
alter table public.runtime_deployment_settings enable row level security;
alter table public.migration_runs enable row level security;
alter table public.data_reconciliation_reports enable row level security;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select using (auth.uid() = id or public.is_staff());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (auth.uid() = id or public.is_staff()) with check (auth.uid() = id or public.is_staff());

drop policy if exists media_owner_select on public.media;
create policy media_owner_select on public.media for select using (owner_id = auth.uid() or public.is_staff());
drop policy if exists media_owner_modify on public.media;
create policy media_owner_modify on public.media for all using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());

drop policy if exists credit_accounts_owner_select on public.credit_accounts;
create policy credit_accounts_owner_select on public.credit_accounts for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists credit_ledger_entries_owner_select on public.credit_ledger_entries;
create policy credit_ledger_entries_owner_select on public.credit_ledger_entries for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists ai_tasks_owner_access on public.ai_tasks;
create policy ai_tasks_owner_access on public.ai_tasks for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists ai_tasks_owner_insert on public.ai_tasks;
create policy ai_tasks_owner_insert on public.ai_tasks for insert with check (user_id = auth.uid() or public.is_staff());
drop policy if exists ai_tasks_owner_update on public.ai_tasks;
create policy ai_tasks_owner_update on public.ai_tasks for update using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists ai_task_events_owner_select on public.ai_task_events;
create policy ai_task_events_owner_select on public.ai_task_events for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists models_owner_or_public_select on public.models;
create policy models_owner_or_public_select on public.models for select using (owner_id = auth.uid() or visibility = 'public' or public.is_staff());
drop policy if exists models_owner_modify on public.models;
create policy models_owner_modify on public.models for all using (owner_id = auth.uid() or public.is_staff()) with check (owner_id = auth.uid() or public.is_staff());

drop policy if exists model_assets_owner_or_public_select on public.model_assets;
create policy model_assets_owner_or_public_select on public.model_assets for select using (
  exists (
    select 1 from public.models m
    where m.id = model_assets.model_id
      and (m.owner_id = auth.uid() or m.visibility = 'public' or public.is_staff())
  )
);

drop policy if exists model_tags_public_select on public.model_tags;
create policy model_tags_public_select on public.model_tags for select using (true);

drop policy if exists model_tag_translations_public_select on public.model_tag_translations;
create policy model_tag_translations_public_select on public.model_tag_translations for select using (true);

drop policy if exists model_tag_assignments_public_select on public.model_tag_assignments;
create policy model_tag_assignments_public_select on public.model_tag_assignments for select using (
  exists (
    select 1 from public.models m
    where m.id = model_tag_assignments.model_id
      and (m.owner_id = auth.uid() or m.visibility = 'public' or public.is_staff())
  )
);

drop policy if exists credit_products_public_select on public.credit_products;
create policy credit_products_public_select on public.credit_products for select using (is_active = true or public.is_staff());

drop policy if exists homepage_items_public_select on public.homepage_items;
create policy homepage_items_public_select on public.homepage_items for select using (
  (is_visible = true and publication_status = 'published') or public.is_staff()
);
drop policy if exists homepage_item_translations_public_select on public.homepage_item_translations;
create policy homepage_item_translations_public_select on public.homepage_item_translations for select using (
  exists (
    select 1 from public.homepage_items i
    where i.id = homepage_item_translations.homepage_item_id
      and ((i.is_visible = true and i.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists posts_public_select on public.posts;
create policy posts_public_select on public.posts for select using ((is_visible = true and publication_status = 'published') or public.is_staff());
drop policy if exists post_translations_public_select on public.post_translations;
create policy post_translations_public_select on public.post_translations for select using (
  exists (
    select 1 from public.posts p
    where p.id = post_translations.post_id
      and ((p.is_visible = true and p.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists announcements_public_select on public.announcements;
create policy announcements_public_select on public.announcements for select using ((is_visible = true and publication_status = 'published') or public.is_staff());
drop policy if exists announcement_translations_public_select on public.announcement_translations;
create policy announcement_translations_public_select on public.announcement_translations for select using (
  exists (
    select 1 from public.announcements a
    where a.id = announcement_translations.announcement_id
      and ((a.is_visible = true and a.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists model_bundles_public_select on public.model_bundles;
create policy model_bundles_public_select on public.model_bundles for select using ((is_visible = true and publication_status = 'published') or public.is_staff());
drop policy if exists model_bundle_translations_public_select on public.model_bundle_translations;
create policy model_bundle_translations_public_select on public.model_bundle_translations for select using (
  exists (
    select 1 from public.model_bundles b
    where b.id = model_bundle_translations.bundle_id
      and ((b.is_visible = true and b.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists model_bundle_items_public_select on public.model_bundle_items;
create policy model_bundle_items_public_select on public.model_bundle_items for select using (
  exists (
    select 1 from public.model_bundles b
    where b.id = model_bundle_items.bundle_id
      and ((b.is_visible = true and b.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists model_bundle_tags_public_select on public.model_bundle_tags;
create policy model_bundle_tags_public_select on public.model_bundle_tags for select using (
  exists (
    select 1 from public.model_bundles b
    where b.id = model_bundle_tags.bundle_id
      and ((b.is_visible = true and b.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists model_bundle_tag_translations_public_select on public.model_bundle_tag_translations;
create policy model_bundle_tag_translations_public_select on public.model_bundle_tag_translations for select using (
  exists (
    select 1
    from public.model_bundle_tags bt
    join public.model_bundles b on b.id = bt.bundle_id
    where bt.id = model_bundle_tag_translations.bundle_tag_id
      and ((b.is_visible = true and b.publication_status = 'published') or public.is_staff())
  )
);

drop policy if exists addresses_owner_access on public.addresses;
create policy addresses_owner_access on public.addresses for all using (user_id = auth.uid() or public.is_staff()) with check (user_id = auth.uid() or public.is_staff());

drop policy if exists print_orders_owner_access on public.print_orders;
create policy print_orders_owner_access on public.print_orders for select using (user_id = auth.uid() or public.is_staff());
drop policy if exists print_orders_owner_insert on public.print_orders;
create policy print_orders_owner_insert on public.print_orders for insert with check (user_id = auth.uid() or public.is_staff());

drop policy if exists order_payments_owner_select on public.order_payments;
create policy order_payments_owner_select on public.order_payments for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists subscriptions_owner_select on public.subscriptions;
create policy subscriptions_owner_select on public.subscriptions for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists audit_logs_staff_only on public.audit_logs;
create policy audit_logs_staff_only on public.audit_logs for select using (public.is_staff());

drop policy if exists site_settings_public_select on public.site_settings;
create policy site_settings_public_select on public.site_settings for select using (true);
drop policy if exists site_navigation_public_select on public.site_navigation_items;
create policy site_navigation_public_select on public.site_navigation_items for select using (true);
drop policy if exists site_footer_public_select on public.site_footer_sections;
create policy site_footer_public_select on public.site_footer_sections for select using (true);
drop policy if exists site_email_templates_staff_select on public.site_email_templates;
create policy site_email_templates_staff_select on public.site_email_templates for select using (public.is_staff());
drop policy if exists subscription_plans_public_select on public.subscription_plans;
create policy subscription_plans_public_select on public.subscription_plans for select using (is_active = true or public.is_staff());
drop policy if exists subscription_plan_features_public_select on public.subscription_plan_features;
create policy subscription_plan_features_public_select on public.subscription_plan_features for select using (true);
drop policy if exists credit_packages_public_select on public.credit_packages;
create policy credit_packages_public_select on public.credit_packages for select using (true);

drop policy if exists homepage_content_public_select on public.homepage_content;
create policy homepage_content_public_select on public.homepage_content for select using (true);
drop policy if exists homepage_featured_works_public_select on public.homepage_featured_works;
create policy homepage_featured_works_public_select on public.homepage_featured_works for select using (true);
drop policy if exists homepage_service_blocks_public_select on public.homepage_service_blocks;
create policy homepage_service_blocks_public_select on public.homepage_service_blocks for select using (true);
drop policy if exists homepage_use_cases_public_select on public.homepage_use_cases;
create policy homepage_use_cases_public_select on public.homepage_use_cases for select using (true);
drop policy if exists homepage_process_steps_public_select on public.homepage_process_steps;
create policy homepage_process_steps_public_select on public.homepage_process_steps for select using (true);
drop policy if exists homepage_faq_items_public_select on public.homepage_faq_items;
create policy homepage_faq_items_public_select on public.homepage_faq_items for select using (true);

drop policy if exists ai_provider_settings_staff_only on public.ai_provider_settings;
create policy ai_provider_settings_staff_only on public.ai_provider_settings for select using (public.is_staff());
drop policy if exists ai_provider_integrations_staff_only on public.ai_provider_integrations;
create policy ai_provider_integrations_staff_only on public.ai_provider_integrations for select using (public.is_staff());
drop policy if exists storage_settings_staff_only on public.storage_settings;
create policy storage_settings_staff_only on public.storage_settings for select using (public.is_staff());
drop policy if exists security_settings_staff_only on public.security_settings;
create policy security_settings_staff_only on public.security_settings for select using (public.is_staff());
drop policy if exists security_allowed_mutation_origins_staff_only on public.security_allowed_mutation_origins;
create policy security_allowed_mutation_origins_staff_only on public.security_allowed_mutation_origins for select using (public.is_staff());
drop policy if exists security_allowed_remote_asset_hosts_staff_only on public.security_allowed_remote_asset_hosts;
create policy security_allowed_remote_asset_hosts_staff_only on public.security_allowed_remote_asset_hosts for select using (public.is_staff());
drop policy if exists runtime_deployment_settings_staff_only on public.runtime_deployment_settings;
create policy runtime_deployment_settings_staff_only on public.runtime_deployment_settings for select using (public.is_staff());
drop policy if exists migration_runs_staff_only on public.migration_runs;
create policy migration_runs_staff_only on public.migration_runs for select using (public.is_staff());
drop policy if exists data_reconciliation_reports_staff_only on public.data_reconciliation_reports;
create policy data_reconciliation_reports_staff_only on public.data_reconciliation_reports for select using (public.is_staff());

revoke all on function public.apply_credit_ledger_entry(uuid, text, numeric, numeric, text, text, text, uuid, uuid, text, jsonb) from public;
revoke all on function public.apply_credit_ledger_entry(uuid, text, numeric, numeric, text, text, text, uuid, uuid, text, jsonb) from anon;
revoke all on function public.apply_credit_ledger_entry(uuid, text, numeric, numeric, text, text, text, uuid, uuid, text, jsonb) from authenticated;
grant execute on function public.apply_credit_ledger_entry(uuid, text, numeric, numeric, text, text, text, uuid, uuid, text, jsonb) to service_role;

commit;
