import * as migration_20260413_094128_add_stripe_subscriptions from './20260413_094128_add_stripe_subscriptions';
import * as migration_20260417_023000_database_baseline_reconciliation from './20260417_023000_database_baseline_reconciliation';
import * as migration_20260417_030000_database_performance_indexes from './20260417_030000_database_performance_indexes';
import * as migration_20260417_031000_generation_tasks_active_index from './20260417_031000_generation_tasks_active_index';
import * as migration_20260420_160000_homepage_rails_and_public_preview from './20260420_160000_homepage_rails_and_public_preview';
import * as migration_20260420_194500_gemini_image_generation_and_media_public_access from './20260420_194500_gemini_image_generation_and_media_public_access';
import * as migration_20260420_201800_account_profiles_milestone_a from './20260420_201800_account_profiles_milestone_a';
import * as migration_20260423_150000_social_constraints_and_indexes from './20260423_150000_social_constraints_and_indexes';
import * as migration_20260429_090000_social_collections_baseline from './20260429_090000_social_collections_baseline';
import * as migration_20260501_010000_backend_ui_profile_banner from './20260501_010000_backend_ui_profile_banner';
import * as migration_20260501_053500_meshy_unified_flow_settings from './20260501_053500_meshy_unified_flow_settings';
import * as migration_20260501_055200_meshy_3d_pricing from './20260501_055200_meshy_3d_pricing';
import * as migration_20260501_114300_runtime_env_guidance_defaults from './20260501_114300_runtime_env_guidance_defaults';
import * as migration_20260503_124500_registration_email_codes from './20260503_124500_registration_email_codes';
import * as migration_20260505_133000_openai_compatible_image_provider from './20260505_133000_openai_compatible_image_provider';
import * as migration_20260505_160000_image_generation_async_and_task_type from './20260505_160000_image_generation_async_and_task_type';
import * as migration_20260506_151500_model_bundle_public_fields from './20260506_151500_model_bundle_public_fields';
import * as migration_20260507_093000_model_bundle_hero_image from './20260507_093000_model_bundle_hero_image';
import * as migration_20260509_042000_site_settings_footer_link_groups from './20260509_042000_site_settings_footer_link_groups';
import * as migration_20260509_051000_formal_pages_content from './20260509_051000_formal_pages_content';
import * as migration_20260509_074100_formal_pages_blog_header from './20260509_074100_formal_pages_blog_header';
import * as migration_20260509_090000_user_notifications from './20260509_090000_user_notifications';
import * as migration_20260509_133000_ai_provider_concurrency_settings from './20260509_133000_ai_provider_concurrency_settings';
import * as migration_20260527_120000_model_preview_optimization from './20260527_120000_model_preview_optimization';
import * as migration_20260528_160500_formal_pages_blog_auxiliary_content from './20260528_160500_formal_pages_blog_auxiliary_content';
import * as migration_20260529_020000_posts_default_content_locale from './20260529_020000_posts_default_content_locale';
import * as migration_20260529_030000_site_footer_brand_fields from './20260529_030000_site_footer_brand_fields';
import * as migration_20260529_031000_site_footer_brand_logo_index_name from './20260529_031000_site_footer_brand_logo_index_name';
import * as migration_20260606_063000_site_footer_social_links from './20260606_063000_site_footer_social_links';
import * as migration_20260612_070000_site_navigation_promotion from './20260612_070000_site_navigation_promotion';

export const migrations = [
  {
    up: migration_20260413_094128_add_stripe_subscriptions.up,
    down: migration_20260413_094128_add_stripe_subscriptions.down,
    name: '20260413_094128_add_stripe_subscriptions'
  },
  {
    up: migration_20260417_023000_database_baseline_reconciliation.up,
    down: migration_20260417_023000_database_baseline_reconciliation.down,
    name: '20260417_023000_database_baseline_reconciliation'
  },
  {
    up: migration_20260417_030000_database_performance_indexes.up,
    down: migration_20260417_030000_database_performance_indexes.down,
    name: '20260417_030000_database_performance_indexes'
  },
  {
    up: migration_20260417_031000_generation_tasks_active_index.up,
    down: migration_20260417_031000_generation_tasks_active_index.down,
    name: '20260417_031000_generation_tasks_active_index'
  },
  {
    up: migration_20260420_160000_homepage_rails_and_public_preview.up,
    down: migration_20260420_160000_homepage_rails_and_public_preview.down,
    name: '20260420_160000_homepage_rails_and_public_preview'
  },
  {
    up: migration_20260420_194500_gemini_image_generation_and_media_public_access.up,
    down: migration_20260420_194500_gemini_image_generation_and_media_public_access.down,
    name: '20260420_194500_gemini_image_generation_and_media_public_access'
  },
  {
    up: migration_20260420_201800_account_profiles_milestone_a.up,
    down: migration_20260420_201800_account_profiles_milestone_a.down,
    name: '20260420_201800_account_profiles_milestone_a'
  },
  {
    up: migration_20260423_150000_social_constraints_and_indexes.up,
    down: migration_20260423_150000_social_constraints_and_indexes.down,
    name: '20260423_150000_social_constraints_and_indexes'
  },
  {
    up: migration_20260429_090000_social_collections_baseline.up,
    down: migration_20260429_090000_social_collections_baseline.down,
    name: '20260429_090000_social_collections_baseline'
  },
  {
    up: migration_20260501_010000_backend_ui_profile_banner.up,
    down: migration_20260501_010000_backend_ui_profile_banner.down,
    name: '20260501_010000_backend_ui_profile_banner'
  },
  {
    up: migration_20260501_053500_meshy_unified_flow_settings.up,
    down: migration_20260501_053500_meshy_unified_flow_settings.down,
    name: '20260501_053500_meshy_unified_flow_settings'
  },
  {
    up: migration_20260501_055200_meshy_3d_pricing.up,
    down: migration_20260501_055200_meshy_3d_pricing.down,
    name: '20260501_055200_meshy_3d_pricing'
  },
  {
    up: migration_20260501_114300_runtime_env_guidance_defaults.up,
    down: migration_20260501_114300_runtime_env_guidance_defaults.down,
    name: '20260501_114300_runtime_env_guidance_defaults'
  },
  {
    up: migration_20260503_124500_registration_email_codes.up,
    down: migration_20260503_124500_registration_email_codes.down,
    name: '20260503_124500_registration_email_codes'
  },
  {
    up: migration_20260505_133000_openai_compatible_image_provider.up,
    down: migration_20260505_133000_openai_compatible_image_provider.down,
    name: '20260505_133000_openai_compatible_image_provider'
  },
  {
    up: migration_20260505_160000_image_generation_async_and_task_type.up,
    down: migration_20260505_160000_image_generation_async_and_task_type.down,
    name: '20260505_160000_image_generation_async_and_task_type'
  },
  {
    up: migration_20260506_151500_model_bundle_public_fields.up,
    down: migration_20260506_151500_model_bundle_public_fields.down,
    name: '20260506_151500_model_bundle_public_fields'
  },
  {
    up: migration_20260507_093000_model_bundle_hero_image.up,
    down: migration_20260507_093000_model_bundle_hero_image.down,
    name: '20260507_093000_model_bundle_hero_image'
  },
  {
    up: migration_20260509_042000_site_settings_footer_link_groups.up,
    down: migration_20260509_042000_site_settings_footer_link_groups.down,
    name: '20260509_042000_site_settings_footer_link_groups'
  },
  {
    up: migration_20260509_051000_formal_pages_content.up,
    down: migration_20260509_051000_formal_pages_content.down,
    name: '20260509_051000_formal_pages_content'
  },
  {
    up: migration_20260509_074100_formal_pages_blog_header.up,
    down: migration_20260509_074100_formal_pages_blog_header.down,
    name: '20260509_074100_formal_pages_blog_header'
  },
  {
    up: migration_20260509_090000_user_notifications.up,
    down: migration_20260509_090000_user_notifications.down,
    name: '20260509_090000_user_notifications'
  },
  {
    up: migration_20260509_133000_ai_provider_concurrency_settings.up,
    down: migration_20260509_133000_ai_provider_concurrency_settings.down,
    name: '20260509_133000_ai_provider_concurrency_settings'
  },
  {
    up: migration_20260527_120000_model_preview_optimization.up,
    down: migration_20260527_120000_model_preview_optimization.down,
    name: '20260527_120000_model_preview_optimization'
  },
  {
    up: migration_20260528_160500_formal_pages_blog_auxiliary_content.up,
    down: migration_20260528_160500_formal_pages_blog_auxiliary_content.down,
    name: '20260528_160500_formal_pages_blog_auxiliary_content'
  },
  {
    up: migration_20260529_020000_posts_default_content_locale.up,
    down: migration_20260529_020000_posts_default_content_locale.down,
    name: '20260529_020000_posts_default_content_locale'
  },
  {
    up: migration_20260529_030000_site_footer_brand_fields.up,
    down: migration_20260529_030000_site_footer_brand_fields.down,
    name: '20260529_030000_site_footer_brand_fields'
  },
  {
    up: migration_20260529_031000_site_footer_brand_logo_index_name.up,
    down: migration_20260529_031000_site_footer_brand_logo_index_name.down,
    name: '20260529_031000_site_footer_brand_logo_index_name'
  },
  {
    up: migration_20260606_063000_site_footer_social_links.up,
    down: migration_20260606_063000_site_footer_social_links.down,
    name: '20260606_063000_site_footer_social_links'
  },
  {
    up: migration_20260612_070000_site_navigation_promotion.up,
    down: migration_20260612_070000_site_navigation_promotion.down,
    name: '20260612_070000_site_navigation_promotion'
  },
];
