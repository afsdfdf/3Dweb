import * as migration_20260413_094128_add_stripe_subscriptions from './20260413_094128_add_stripe_subscriptions';

export const migrations = [
  {
    up: migration_20260413_094128_add_stripe_subscriptions.up,
    down: migration_20260413_094128_add_stripe_subscriptions.down,
    name: '20260413_094128_add_stripe_subscriptions'
  },
];
