import assert from 'node:assert/strict'
import test from 'node:test'

import { adminLabelsKey, adminTextKey, getAdminLocale, getAdminText } from '../src/lib/adminI18n.ts'

test('admin i18n helpers resolve text for both locales', () => {
  assert.equal(getAdminText('globals.securitySettings.label', 'en'), 'Security Settings')
  assert.equal(getAdminText('globals.securitySettings.label', 'zh'), getAdminText('globals.securitySettings.label', 'zh'))
})

test('adminLabelsKey returns locale keyed labels for Payload config', () => {
  const labels = adminLabelsKey('collections.users')

  assert.equal(labels.plural.en, 'Users')
  assert.equal(labels.plural.zh, getAdminText('collections.users.plural', 'zh'))
  assert.equal(labels.singular.en, 'User')
  assert.equal(labels.singular.zh, getAdminText('collections.users.singular', 'zh'))
})

test('adminTextKey returns locale keyed text for Payload config', () => {
  const label = adminTextKey('globals.runtimeDeployment.label')

  assert.equal(label.en, 'Runtime Deployment')
  assert.equal(label.zh, getAdminText('globals.runtimeDeployment.label', 'zh'))
})

test('getAdminLocale prefers explicit locale and falls back through admin i18n sources', () => {
  assert.equal(getAdminLocale({ locale: 'zh' }), 'zh')
  assert.equal(getAdminLocale({ code: 'zh-CN' }), 'zh')
  assert.equal(getAdminLocale({ i18n: { language: 'zh' } }), 'zh')
  assert.equal(getAdminLocale({ language: 'zh' }), 'zh')
  assert.equal(getAdminLocale({ req: { i18n: { language: 'zh' } } }), 'zh')
  assert.equal(getAdminLocale({ locale: 'fr' }), 'en')
})
