# Chrome Web Store listing: 0.3.0 (practice mode)

Paste-ready copy for the Chrome Web Store developer dashboard. The listing title and summary come from `apps/extension/manifest.json` (`name`, `description`), so they update with the uploaded zip.

## Title (from manifest `name`, max 75 chars)

Cognitive Mode: AI hints for DSA practice

## Summary (from manifest `description`, max 132 chars)

Practice coding problems with AI hints, not answers. Tracks clean solves and brings problems back for a re-solve.

## Category

Education. Change it from Developer Tools in **Store listing → Category**.

## Description

```
Practice DSA with AI, without cheating yourself.

When you're stuck on a LeetCode, GeeksforGeeks or takeUforward problem, it's easy to paste it into ChatGPT and read the answer. It feels like progress, until an online assessment or interview where AI isn't allowed.

Cognitive Mode turns the AI you already use into a hint ladder:

1. Open a problem on LeetCode, GeeksforGeeks or takeUforward (Striver's A2Z sheet). A small timer starts in the corner.
2. Ask ChatGPT, Claude, Gemini, Perplexity or DeepSeek like you normally do. Cognitive Mode asks how much help you want:
   • Nudge: one guiding question
   • Approach: the key idea, no code
   • Outline: steps, no real code
   • Solution: the full answer, logged as "needed the solution"
   It adds that instruction to your message, so your own AI gives exactly that much help.
3. After you submit, log the result in one tap: solved clean, solved with hints, needed the solution, or didn't solve.
4. Problems you needed help on come back after 3, 7 and 21 days. Solve one clean and it's locked in.

Your popup shows today's re-solves, this week's clean solves, your streak, and how ready you are per topic (arrays, hashing, dynamic programming…).

FREE, NO SETUP
• No API key, no account, no paid tier
• Works with free ChatGPT, Claude, Gemini, Perplexity and DeepSeek accounts
• No timers or forms in practice mode: picking a level is one keypress, and you can always send a message as is

WHAT IT READS AND STORES
• On LeetCode, GeeksforGeeks and takeUforward: the open problem's title, difficulty, topics and a short excerpt, plus your Submit clicks and time spent
• On AI chats: the message you're sending, only to add the hint instruction. Messages are never stored
• Your practice log, hint levels, notes and settings stay in your browser (chrome.storage.local)
• Nothing is sent to Cognitive Mode; there are no servers

Also included: Everyday mode, an optional think-first gate for any AI prompt (off by default).

Privacy policy: https://cognitivemode.app/privacy
```

## Single purpose

Helps people practice coding problems with AI without outsourcing their thinking: it offers graded hint levels when they ask an AI chat for help, tracks practice results so problems that needed help come back for a re-solve, and optionally adds a think-first pause before AI prompts.

## Permission justifications

The dashboard has one field per API permission and a single **Host permission justification** field for every host. Paste this into the host field:

```
Practice sites (leetcode.com, www.geeksforgeeks.org, takeuforward.org): reads the open problem's title, difficulty, topics and a short statement excerpt, shows a practice timer, and notices Submit clicks so the user can log the result.

AI chats (chatgpt.com, claude.ai, gemini.google.com, perplexity.ai, www.perplexity.ai, chat.deepseek.com): when the user sends a message while practicing, shows hint levels and appends the chosen hint instruction to that message.

AI builders (v0.app, v0.dev, bolt.new): optional Everyday mode, a think-first pause before a prompt is sent (off by default).

cognitivemode.app (and localhost, for testing the site): lets the website detect that the extension is installed.

All data stays in chrome.storage.local on the device. The extension makes no network requests of its own and sends nothing to the developer.
```

Per permission, for reference:

| Permission | Justification |
|---|---|
| `storage` | Stores practice sessions, re-solve dates, settings and notes locally on the user's device. |
| `alarms` | Refreshes the toolbar badge (re-solves due today) once an hour so it rolls over at midnight. |
| `https://leetcode.com/*`, `https://www.geeksforgeeks.org/*`, `https://takeuforward.org/*` | Detects which practice problem is open (title, difficulty, topics from the page), shows the practice timer, and notices Submit clicks so the user can log the result. |
| `https://chatgpt.com/*`, `https://claude.ai/*`, `https://gemini.google.com/*`, `https://perplexity.ai/*`, `https://www.perplexity.ai/*`, `https://chat.deepseek.com/*` | When the user sends a message during a practice session, offers hint levels and appends the chosen hint instruction to their message before it is sent. |
| `https://v0.app/*`, `https://v0.dev/*`, `https://bolt.new/*` | Optional Everyday mode: a think-first gate before prompts on these AI builders. |

**Remote code:** "No, I am not using remote code". All code ships in the package.

## Data usage

Google counts data that is only read or stored on the device: "Extensions are required to disclose how they handle user data, even when data is processed or stored locally on a user's device" ([user data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)). Tick:

| Category | Why |
|---|---|
| Personal communications | Reads the message being sent on AI chats to add the hint instruction (never stored). |
| Web history | The practice log: problem pages with titles and the times they were practiced. |
| User activity | Submit clicks and time spent on a problem. |
| Website content | The problem's title, difficulty, topics and a statement excerpt. |

Leave personally identifiable, health, financial, authentication and location information unticked. All three certifications are true: nothing is sold or transferred, nothing is used outside the single purpose, nothing is used for credit decisions.

Privacy policy URL: `https://cognitivemode.app/privacy`. The live page must show the practice-mode policy before the item is submitted for review, so deploy the site first. Google treats a mismatch between this form, the policy and the extension's behavior as a violation.

## Screenshots (1280×800, ready to upload)

Captured from the real build on 2026-11-22, in `docs/store-screenshots/`:

1. `1-hint-ladder.png`: the hint ladder on ChatGPT while practicing LeetCode 3Sum. Caption: "Pick how much help you get."
2. `2-log-result.png`: the practice timer on LeetCode with the log panel open. Caption: "Log the result in one tap."
3. `3-popup.png`: popup with re-solve queue and weekly stats. Caption: "Problems you needed help on come back." (Rendered with sample data via `apps/extension/dev/preview.html`.)
4. `4-dashboard.png`: dashboard practice log. Caption: "Every attempt, clean or not." (Sample data, same preview page.)

Small promo tile (440×280): dark background with "Practice DSA with AI, without cheating yourself." and the four level chips (the same art as `apps/web/app/opengraph-image.tsx`).

## Product Hunt

Live on https://www.producthunt.com/products/cognitive-mode since 2026-11-22 (the June 26 launch, edited):

- Tagline (product and launch): Practice DSA with AI hints, not answers
- Product description: A free Chrome extension for practicing coding problems with AI without outsourcing the thinking. Works on LeetCode, GeeksforGeeks and takeUforward with your own ChatGPT, Claude or Gemini. No account, no API key, and your data stays in your browser.
- Launch description: Stuck on a LeetCode problem? Ask ChatGPT, Claude, Gemini, Perplexity or DeepSeek as usual and pick how much help you get: a nudge, the approach, an outline or the full solution. Cognitive Mode logs clean vs. hinted solves and brings misses back to re-solve.
- Gallery: the four store screenshots, padded to 1270×760.
- Launch tags: Chrome Extensions, Developer Tools, Education. Product category: Online learning.
- Removed gallery images from the friction-gate version: `https://ph-files.imgix.net/87a18ccb-acbc-4f83-8f2d-4e51813b55db.png`, `https://ph-files.imgix.net/163b1779-f8ae-4acb-a42b-02ff59fd863a.png`.

## Release notes (0.3.0)

- New: practice mode for LeetCode, GeeksforGeeks and takeUforward, with a hint ladder in ChatGPT, Claude, Gemini, Perplexity and DeepSeek, outcome logging, re-solve queue, topic readiness and toolbar badge.
- Fixed: Cognitive Mode didn't trigger on ChatGPT's new composer, and Claude's send button skipped the gate.
- The original think-first gate is now "Everyday mode". It stays on for people who already used it and is off for new installs.
- Removed: Cursor and Windsurf (their AI runs in desktop apps, so the extension never worked there).
- Existing users: Chrome asks you to approve access to the new practice sites once after updating.
