# Lingora — Product & Technical Plan

> Working title. Change it in `src/config.ts`.

A language-learning app for **Mandarin Chinese, Japanese, and Brazilian Portuguese**. It combines the habit loops people like (streaks, XP, friends) with study methods backed by research. It doesn't use punitive "hearts".

---

## 1. Learning design

### Standards each course follows
| Language | Standard | Levels | Notes |
|---|---|---|---|
| Chinese (Mandarin, Simplified) | **HSK 3.0** (2021 standard) | Bands 1–9 | Vocab and grammar lists come from the official HSK 3.0 syllabus. |
| Japanese | **JLPT** | N5 → N1 | Kana first, then kanji by JLPT level. |
| Portuguese (Brazil) | **CEFR** | A1 → C2 | Uses Council of Europe can-do descriptors. |

Every unit is tagged with its level and lists **can-do statements** (e.g. "I can introduce myself and say where I'm from"), so learners always know which competency they're building.

### Methods (and where each one lives in the app)
| Method | Implementation |
|---|---|
| **Spaced repetition (FSRS)** | Each word or sentence is a card scheduled by FSRS-4.5, the current state of the art (better than SM-2). Target retention is 90%. → `src/lib/fsrs.ts` |
| **Active recall / retrieval practice** | Exercises move from recognition (multiple choice) to production (typing, building sentences, speaking). |
| **Interleaving** | Review sessions mix items from different lessons and exercise types. |
| **Error-driven re-queuing** | A missed exercise comes back at the end of the same session. In SRS it's rated *Again* and returns within minutes. |
| **Dual coding / multimodal input** | Each item is shown as text, its reading (pinyin/kana), and audio (TTS). |
| **Comprehensible input** | Each unit ends with a graded reader that uses only the unit's vocabulary, plus comprehension questions. |
| **Shadowing** | In speaking practice you hear the model audio, repeat it, and get a score from speech recognition. |
| **Desirable difficulty** | A slow-audio option is available, readings can be toggled off, and leniency for tones and accents is reported as "almost" (rated *Hard*) instead of a silent pass. |
| **No punishment** | No hearts or lives. Mistakes are learning signals, not game-overs. |

### Skills
- **Reading**: character/word recognition, graded readers
- **Listening**: audio multiple choice, dictation
- **Writing/typing**: free typing that accepts characters, pinyin (tones optional), kana, romaji, or Portuguese with accent leniency
- **Speaking**: speech recognition (Web Speech API) with similarity scoring; falls back to self-assessment

## 2. Engagement
- **Streaks**: count any completed session in a day. A **streak freeze** is earned every 7 days (you can hold up to 2) and covers missed days automatically.
- **XP and daily goal**: Casual 10 / Regular 20 / Serious 30 / Intense 50.
- **Friends**: share codes, weekly XP leaderboard. *(Phase 1 is local and simulated; Phase 2 is a real backend.)*
- **Profile**: activity heatmap, words learned, longest streak.

## 3. Architecture

```
src/
  config.ts            app name, constants
  content/             course data (typed) — one file per language
  engine/              exercise generators (lesson / review / practice)
  lib/                 fsrs, answer checking, speech (TTS + STT), dates, rng
  store/               zustand store persisted to localStorage
  social/              friends service (local now, API later)
  components/          UI building blocks + exercise components
  screens/             routed pages
```

- **Stack**: React 18 + TypeScript + Vite, React Router, Zustand (persisted), Vitest.
- **Offline-first**: all progress is in localStorage for now. The store has one write path (`recordSession`), so syncing to a server later only needs one hook.
- **Content as data**: courses are typed objects, and adding a unit means adding data, not code. Long term, content comes from a CMS or JSON pipeline built from the official HSK/JLPT/CEFR lists.

## 4. Roadmap

### Phase 1 — MVP (this build) ✅
- [x] Onboarding (language, daily goal, name)
- [x] Course path with units, lessons, and readers for zh / ja / pt: 5 units, 11 lessons, and ~80 words each (HSK 1, N5, A1). Topics: greetings, numbers & food, family, time & routine, places & shopping
- [x] Grammar notes: 1–3 points per lesson, each with a pattern, explanation and audio examples. They appear as a "Grammar tip" in lessons and in a per-unit Guidebook (can-dos, grammar, key phrases, vocabulary)
- [x] Content integrity tests (unique ids, sentence tiles rebuild the sentence, no duplicate words or meanings, valid quiz answers)
- [x] 7 exercise types: intro, multiple choice (text and audio), matching, typing, dictation, sentence builder, speaking
- [x] FSRS scheduling + Review queue
- [x] Practice hub: shadowing, dictation, weak words, graded readers
- [x] Streaks, freezes, XP, daily goal
- [x] Friends (local and simulated) + weekly leaderboard
- [x] Profile, stats, heatmap, settings

### Phase 2 — Accounts & real social (in progress)
- [x] Backend: Hono API (`server/`) on Neon Postgres. Email + password auth (scrypt, httpOnly session cookie, rate-limited)
- [x] Event-log sync: reviews, XP and completions are append-only events, and every device replays them through FSRS (`src/sync/derive.ts`), so sync never overwrites newer work. On first sign-in, progress made offline is merged in
- [x] Real friends: mutual add by code, weekly leaderboard with server-computed streaks
- [x] Connected to the shared Neon database (with Wordle Unlimited). The end-to-end test passed: sign-up/login, sync, idempotency, purchase/claim validation, saved themes, friends, sessions
- [x] Server refuses purchases the wallet can't cover (checked in time order at sync)
- [ ] Password reset email, account deletion, deploy target (Vercel / Fly / Render)
- [ ] Push/email streak reminders, friend nudges

### Phase 3 — Content scale-up
- [x] Three tiers per course: HSK 1–3, JLPT N5–N3, CEFR A1–B1. 9 units and 27 lessons per course (3 per unit), about 200 words each, and a grammar note for every lesson. Extra lessons live in `*-more.ts` and are merged in with `addLessons`
- [ ] Fill each tier to its full official word list (HSK 3.0 band 1–3 ≈ 2,200 words; N5–N3 ≈ 3,700; A1–B1 ≈ 2,500). This needs a content pipeline from the official lists plus native-speaker review, not hand-authoring
- Kana trainer and stroke-order writing (handwriting input for hanzi and kanji)
- Pre-recorded native audio to replace TTS for core content
- Tone-pair drills for Mandarin; grammar-focused exercises (fill-in-the-particle, conjugation drills)

### Phase 4 — Advanced practice
- Pronunciation scoring per phoneme and tone (server-side model)
- AI conversation partner (role-play scenarios graded to level)
- Placement test, FSRS parameter optimization per user
- Mobile apps (React Native / Capacitor wrapper of this codebase)

## 5. Running

```bash
npm install
npm run dev      # http://localhost:5173 (the API is served at /api by the same dev server)
npm test         # unit tests (FSRS, answer checking, streaks, content, sync)
npm run build
npm start        # production: one Node process serves dist/ and /api
```

### Shared database with Wordle Unlimited
- Lingora uses Wordle Unlimited's `users` table and its password format, so **one username and password works in both apps**. Signing up in Lingora creates a normal Wordle account (with a PIN, like theirs).
- Lingora's own tables are all prefixed `lingora_`. The migration never alters Wordle tables: it creates `users` / `saved_themes` only if they're missing.
- Wordle's `drizzle.config.ts` has `tablesFilter: ["!lingora_*"]`, so its `db:push` won't try to drop Lingora's tables.
- Shared on purpose: saved theme slots (`saved_themes`; same theme format and `wt…` share codes), and accepted Wordle friends, which show on Lingora's leaderboard (read-only).
- Kept separate on purpose: coins and items. Lingora has its own wallet, so lesson XP can't inflate Wordle's economy.

### Shop & themes (ported from Wordle Unlimited)
- `src/shop/catalog.ts`: level curve, daily reward ladder, 30%-off daily deals, rarities. Items are themes, titles, name colours, celebrations and Streak Freezes.
- Coins are **derived**, never stored: XP + level-up bonuses + daily rewards − purchases (`src/shop/wallet.ts`). Purchases and claims are events, so they work offline and sync.
- `src/theme/themes.ts`: Wordle's custom theme engine (solid or gradient paints, contrast warnings, share codes) mapped onto Lingora's design tokens. Theme Studio is at `/themes`.

### Database setup (Neon)
1. Set `DATABASE_URL` in `.env.local` or `.env`. A copy of Wordle Unlimited's `.env` works as-is; only `DATABASE_URL` is read. Both files are git-ignored and never sent to the browser.
2. Run `npm run db:migrate` to create the tables. It's safe to re-run.
3. Restart `npm run dev`. Profile → "Account & sync" now offers sign-up.

Speech recognition works best in Chrome or Edge. Text-to-speech needs an OS voice installed for each language (on Windows: Settings → Time & language → Speech → add voices).
