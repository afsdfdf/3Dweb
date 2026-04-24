import assert from 'node:assert/strict'
import test from 'node:test'

import { adminLabelsKey, adminTextKey, getAdminLocale, getAdminText } from '../src/lib/adminI18n.ts'

test('admin i18n helpers resolve text for both locales', () => {
  assert.equal(getAdminText('globals.securitySettings.label', 'en'), 'Security Settings')
  assert.equal(getAdminText('globals.securitySettings.label', 'zh'), '安全设置')
})

test('adminLabelsKey returns locale keyed labels for Payload config', () => {
  const labels = adminLabelsKey({
    plural: 'collections.users.plural',
    singular: 'collections.users.singular',
  })

  assert.deepEqual(labels, {
    plural: {
      en: 'Users',
      zh: '用户',
    },
    singular: {
      en: 'User',
      zh: '用户',
    },
  })
})

test('adminTextKey returns locale keyed text for Payload config', () => {
  const label = adminTextKey('globals.runtimeDeployment.label')

  assert.deepEqual(label, {
    en: 'Runtime Deployment',
    zh: '运行时部署',
  })
})

test('getAdminLocale prefers explicit locale and falls back through admin i18n sources', () => {
  assert.equal(getAdminLocale({ locale: 'zh' }), 'zh')
  assert.equal(getAdminLocale({ code: 'zh-CN' }), 'zh')
  assert.equal(getAdminLocale({ i18n: { language: 'zh' } }), 'zh')
  assert.equal(getAdminLocale({ language: 'zh' }), 'zh')
  assert.equal(getAdminLocale({ req: { i18n: { language: 'zh' } } }), 'zh')
  assert.equal(getAdminLocale({ locale: 'fr' }), 'en')
})
