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

FREE, PRIVATE, NO SETUP
• No API key, no account, no paid tier
• Works with free ChatGPT, Claude, Gemini, Perplexity and DeepSeek accounts
• Practice history is stored only in your browser (chrome.storage.local)
• Nothing is sent to Cognitive Mode servers; there are none
• No timers or forms in practice mode: picking a level is one keypress, and you can always send a message as is

Also included: Everyday mode, an optional think-first gate for any AI prompt (off by default).

Privacy policy: https://cognitivemode.app/privacy
```

## Single purpose

Help people practice coding problems with AI without outsourcing their thinking: it offers graded hint levels when they ask an AI for help, and tracks practice results so problems that needed help come back for a re-solve.

## Permission justifications

| Permission | Justification |
|---|---|
| `storage` | Stores practice sessions, re-solve dates, settings and notes locally on the user's device. |
| `alarms` | Refreshes the toolbar badge (re-solves due today) once an hour so it rolls over at midnight. |
| `https://leetcode.com/*`, `https://www.geeksforgeeks.org/*`, `https://takeuforward.org/*` | Detects which practice problem is open (title, difficulty, topics from the page), shows the practice timer, and notices Submit clicks so the user can log the result. |
| `https://chatgpt.com/*`, `https://claude.ai/*`, `https://gemini.google.com/*`, `https://perplexity.ai/*`, `https://www.perplexity.ai/*`, `https://chat.deepseek.com/*` | When the user sends a message during a practice session, offers hint levels and appends the chosen hint instruction to their message before it is sent. |
| `https://v0.app/*`, `https://v0.dev/*`, `https://bolt.new/*` | Optional Everyday mode: a think-first gate before prompts on these AI builders. |

**Remote code:** none. All code ships in the package.

**Data usage:** keep "does not collect or use user data". Nothing is transmitted to the developer. The only network traffic is the user's own message to the AI service they chose, sent by the user.

## Screenshots (1280×800, capture from the real build)

1. **Hint ladder on ChatGPT** while a LeetCode problem is active: the four levels plus the approach note. Caption: "Pick how much help you get."
2. **Practice timer on LeetCode** with the log panel open after Submit. Caption: "Log the result in one tap."
3. **Popup** with re-solve queue, weekly stats and topic bars. Caption: "Problems you needed help on come back."
4. **Dashboard practice log.** Caption: "Every attempt, clean or not."
5. **GeeksforGeeks or takeUforward problem** with the timer. Caption: "Works on GFG and Striver's A2Z sheet too."

Small promo tile (440×280): dark background with "Practice DSA with AI, without cheating yourself." and the four level chips (the same art as `apps/web/app/opengraph-image.tsx`).

## Release notes (0.3.0)

- New: practice mode for LeetCode, GeeksforGeeks and takeUforward, with a hint ladder in ChatGPT, Claude, Gemini, Perplexity and DeepSeek, outcome logging, re-solve queue, topic readiness and toolbar badge.
- Fixed: Cognitive Mode didn't trigger on ChatGPT's new composer, and Claude's send button skipped the gate.
- The original think-first gate is now "Everyday mode". It stays on for people who already used it and is off for new installs.
- Removed: Cursor and Windsurf (their AI runs in desktop apps, so the extension never worked there).
- Existing users: Chrome asks you to approve access to the new practice sites once after updating.
