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
];
