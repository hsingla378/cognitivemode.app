import assert from 'node:assert/strict'
import { test } from 'node:test'
import { migrateSettingsOnUpdate, normalizeSettings } from '../src/content/storage.ts'

test('normalizeSettings applies practice defaults', () => {
  assert.deepEqual(normalizeSettings(undefined), {
    countdownDuration: 15,
    enabled: true,
    practiceMode: true,
    everydayMode: false,
  })
  assert.deepEqual(normalizeSettings({ countdownDuration: 99, enabled: false, everydayMode: true }), {
    countdownDuration: 60,
    enabled: false,
    practiceMode: true,
    everydayMode: true,
  })
})

test('migration keeps Everyday mode for existing users', () => {
  assert.deepEqual(migrateSettingsOnUpdate({ cognitive_settings: { enabled: true, countdownDuration: 20 } }), {
    countdownDuration: 20,
    enabled: true,
    practiceMode: true,
    everydayMode: true,
  })
  assert.equal(migrateSettingsOnUpdate({ cognitive_entries: [{}] }).everydayMode, true)
  assert.equal(migrateSettingsOnUpdate({ cognitive_settings: { enabled: false } }).everydayMode, false)
})

test('migration is a no-op for fresh profiles and already-migrated settings', () => {
  assert.equal(migrateSettingsOnUpdate({}), null)
  assert.equal(migrateSettingsOnUpdate({ cognitive_entries: [] }), null)
  assert.equal(migrateSettingsOnUpdate({ cognitive_settings: { everydayMode: false } }), null)
})
