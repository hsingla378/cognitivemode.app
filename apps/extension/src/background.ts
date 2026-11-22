import { SETTINGS_KEY, migrateSettingsOnUpdate } from './content/storage.ts'
import { dueProblems } from './practice/model.ts'
import { PRACTICE_STATE_KEY, updatePracticeState } from './practice/store.ts'

const WELCOME_URL = 'https://cognitivemode.app/welcome'
const LEGACY_ENTRIES_KEY = 'cognitive_entries'
const BADGE_ALARM = 'cm-hourly'
const BADGE_COLOR = '#10b981'

chrome.runtime.setUninstallURL('https://cognitivemode.app/goodbye')

// Runs the stale-attempt rule (persisting only if it changed something) and shows how many
// re-solves are due today. The hourly alarm makes the count roll over after midnight.
async function refreshBadge(): Promise<void> {
  const state = await updatePracticeState((practice) => practice)
  const due = dueProblems(state, Date.now()).length
  await chrome.action.setBadgeText({ text: due ? String(due) : '' })
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR })
}

async function migrateSettings(): Promise<void> {
  const stored = await chrome.storage.local.get([SETTINGS_KEY, LEGACY_ENTRIES_KEY])
  const migrated = migrateSettingsOnUpdate({
    cognitive_settings: stored[SETTINGS_KEY],
    cognitive_entries: stored[LEGACY_ENTRIES_KEY],
  })
  if (migrated) await chrome.storage.local.set({ [SETTINGS_KEY]: migrated })
}

function scheduleBadgeRefresh(): void {
  // Alarms can be cleared on browser restart, so this runs on both install/update and startup.
  void chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 60 })
  void refreshBadge()
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    void chrome.tabs.create({ url: WELCOME_URL })
  }
  if (details.reason === 'update') {
    void migrateSettings()
  }
  scheduleBadgeRefresh()
})

// The migration is idempotent. Running it on every browser start covers updates that Chrome held
// disabled for the new permissions, where onInstalled may not reach us.
function onBrowserStart(): void {
  void migrateSettings()
  scheduleBadgeRefresh()
}

chrome.runtime.onStartup.addListener(onBrowserStart)

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === BADGE_ALARM) void refreshBadge()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[PRACTICE_STATE_KEY]) void refreshBadge()
})
