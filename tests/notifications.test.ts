import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import { UserNotifications } from '../src/collections/UserNotifications.ts'

const rootDir = process.cwd()
const topNavigationPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.tsx')
const topNavigationCssPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'top-navigation', 'top-navigation.module.css')
const payloadConfigPath = path.join(rootDir, 'src', 'payload.config.ts')
const servicePath = path.join(rootDir, 'src', 'lib', 'notificationService.ts')
const endpointsPath = path.join(rootDir, 'src', 'endpoints', 'notifications.ts')

const accessArgs = (role?: 'admin' | 'customer' | 'operator', id: number | string = 1) =>
  ({
    req: {
      user: role ? { id, role } : null,
    },
  }) as never

test('user notifications are private user-owned records with staff-only writes', () => {
  assert.equal(UserNotifications.slug, 'user-notifications')
  assert.equal(UserNotifications.access?.read?.(accessArgs()), false)

  const ownRead = UserNotifications.access?.read?.(accessArgs('customer', 42))
  assert.deepEqual(ownRead, {
    user: {
      equals: 42,
    },
  })

  assert.equal(UserNotifications.access?.create?.(accessArgs('customer')), false)
  assert.equal(UserNotifications.access?.update?.(accessArgs('customer')), false)
  assert.equal(UserNotifications.access?.delete?.(accessArgs('customer')), false)
  assert.equal(UserNotifications.access?.create?.(accessArgs('operator')), true)
  assert.equal(UserNotifications.access?.update?.(accessArgs('admin')), true)
})

test('payload registers notification collection and account endpoints', () => {
  const payloadConfigSource = readFileSync(payloadConfigPath, 'utf8')
  const endpointSource = readFileSync(endpointsPath, 'utf8')
  const serviceSource = readFileSync(servicePath, 'utf8')

  assert.match(payloadConfigSource, /UserNotifications/)
  assert.match(payloadConfigSource, /listAccountNotificationsEndpoint/)
  assert.match(payloadConfigSource, /getUnreadNotificationCountEndpoint/)
  assert.match(payloadConfigSource, /markNotificationReadEndpoint/)
  assert.match(payloadConfigSource, /markAllNotificationsReadEndpoint/)
  assert.match(endpointSource, /path:\s*['"]\/account\/notifications['"]/)
  assert.match(endpointSource, /path:\s*['"]\/account\/notifications\/unread-count['"]/)
  assert.match(serviceSource, /overrideAccess:\s*false/)
  assert.match(serviceSource, /sourceKey/)
  assert.match(serviceSource, /createGenerationTaskNotification/)
  assert.match(serviceSource, /while \(true\)/)
  assert.match(serviceSource, /updated \+= unread\.docs\.length/)
})

test('top navigation bell uses real notification APIs instead of static badge data', () => {
  const source = readFileSync(topNavigationPath, 'utf8')
  const cssSource = readFileSync(topNavigationCssPath, 'utf8')

  assert.doesNotMatch(source, /count=\{2\}/)
  assert.match(source, /\/api\/account\/notifications\/unread-count/)
  assert.match(source, /\/api\/account\/notifications\?limit=5/)
  assert.match(source, /ButtonBoxFrame/)
  assert.match(source, /notificationTabs/)
  assert.match(source, /Message/)
  assert.match(source, /Notification/)
  assert.match(source, /style=\{\{\s*height:\s*676,\s*width:\s*320\s*\}\}/)
  assert.match(source, /NotificationBellButton authenticated/)
  assert.match(source, /aria-label="Shopping cart"/)
  assert.match(source, /href="\/cart"/)
  assert.doesNotMatch(source, /aria-label="Cart"/)
  assert.match(cssSource, /\.notificationPopover/)
  assert.match(cssSource, /\.notificationPopoverContent\s*\{[\s\S]*padding:\s*13px\s+9px\s+5px\s*!important/)
  assert.match(cssSource, /\.notificationPanel\s*\{[\s\S]*height:\s*658px[\s\S]*width:\s*302px/)
  assert.match(cssSource, /\.notificationTabBar\s*\{[\s\S]*height:\s*54px[\s\S]*left:\s*13px[\s\S]*top:\s*13px[\s\S]*width:\s*276px/)
  assert.match(cssSource, /button-purple-small-pushed\.png/)
  assert.match(cssSource, /button-dark-small-normal\.png/)
  assert.match(cssSource, /\.notificationItemUnread/)
  assert.match(cssSource, /\.notificationGoButton/)
  assert.doesNotMatch(cssSource, /linear-gradient\(180deg, rgba\(31, 25, 19/)
})
