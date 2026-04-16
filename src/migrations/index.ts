import * as migration_20260413_094128_add_stripe_subscriptions from './20260413_094128_add_stripe_subscriptions';
import * as migration_20260417_023000_database_baseline_reconciliation from './20260417_023000_database_baseline_reconciliation';
import * as migration_20260417_030000_database_performance_indexes from './20260417_030000_database_performance_indexes';
import * as migration_20260417_031000_generation_tasks_active_index from './20260417_031000_generation_tasks_active_index';

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
];
