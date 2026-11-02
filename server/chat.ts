import Anthropic from '@anthropic-ai/sdk'
import type { LangCode } from '../src/content/types'
import type { ChatReply, ChatRequest } from '../src/chat/types'
import { ANTHROPIC_API_KEY, CHAT_MODEL } from './env'

export const chatEnabled = !!ANTHROPIC_API_KEY
const client = chatEnabled ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null

const LANG_NAME: Record<LangCode, string> = { zh: 'Mandarin Chinese (Simplified)', ja: 'Japanese', pt: 'Brazilian Portuguese' }
const READING: Record<LangCode, string> = {
  zh: 'the full sentence in pinyin with tone marks',
  ja: 'the full sentence in hiragana/katakana (no kanji)',
  pt: 'an empty string',
}

const LINE = {
  type: 'object',
  additionalProperties: false,
  required: ['target', 'reading', 'translation'],
  properties: { target: { type: 'string' }, reading: { type: 'string' }, translation: { type: 'string' } },
} as const

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['feedback', 'reply', 'suggestions', 'goalMet'],
  properties: {
    feedback: {
      type: 'object',
      additionalProperties: false,
      required: ['verdict', 'corrected', 'note'],
      properties: {
        verdict: { type: 'string', enum: ['none', 'great', 'ok', 'fix'] },
        corrected: { type: 'string' },
        note: { type: 'string' },
      },
    },
    reply: LINE,
    suggestions: { type: 'array', items: LINE },
    goalMet: { type: 'boolean' },
  },
} as const

function systemPrompt(r: ChatRequest): string {
  const words = r.words.map((w) => `${w.target}${w.reading ? ` (${w.reading})` : ''} = ${w.meaning}`).join('\n')
  return `You are a friendly conversation partner inside Lingora, a language-learning app. The learner is practising ${LANG_NAME[r.lang]} at ${r.level} level (${r.unit}).

Role-play scenario: ${r.scenario.title}
Learner's goal: ${r.scenario.goal}
Stay in character for the scenario and keep the conversation moving toward the goal. Ask one simple question at a time.

Keep every line you write within the learner's level:
- Use mainly the words they know (listed below) and very common basics. If you need a new word, use at most one per message, and keep sentences short (one or two clauses).
- Grammar they have studied: ${r.grammar.length ? r.grammar.join('; ') : 'only the most basic patterns'}.
- Write naturally, as a patient native speaker would to a beginner. ${r.lang === 'pt' ? 'Use Brazilian spelling and você.' : r.lang === 'ja' ? 'Use polite です/ます forms.' : 'Use simplified characters.'}

For each response, fill the fields like this:
- feedback: about the learner's most recent message. verdict "none" only when there is no learner message yet; "great" if it is natural and correct; "ok" if understandable with a small slip; "fix" if it has a real error or is mostly in English. "corrected" is the natural ${LANG_NAME[r.lang]} version of what they meant (empty if verdict is "great" or "none"). "note" is one short, encouraging English sentence explaining the main fix (empty if nothing to say). Accept romanization, missing tone marks and missing accents without penalty. If they write in English, gently show how to say it.
- reply: your next line in the conversation. "target" in ${LANG_NAME[r.lang]} script, "reading" is ${READING[r.lang]}, "translation" in English.
- suggestions: 2 or 3 short, different things the learner could say next, written at their level, with reading and translation.
- goalMet: true once the learner has achieved the goal in the conversation.

Words the learner knows:
${words || '(only a few basics so far)'}`
}

const LIMITS = { messages: 40, text: 400, words: 250, grammar: 40 }

/** Throws a user-facing message if the request is malformed. */
export function validateChat(raw: unknown): ChatRequest {
  const b = (raw ?? {}) as Partial<ChatRequest>
  const s = (v: unknown, max: number) => typeof v === 'string' && v.length <= max
  const ok =
    (b.lang === 'zh' || b.lang === 'ja' || b.lang === 'pt') &&
    s(b.level, 40) &&
    s(b.unit, 120) &&
    !!b.scenario && s(b.scenario.title, 120) && s(b.scenario.goal, 300) &&
    Array.isArray(b.words) && b.words.length <= LIMITS.words &&
    b.words.every((w) => w && s(w.target, 80) && s(w.reading ?? '', 120) && s(w.meaning, 120)) &&
    Array.isArray(b.grammar) && b.grammar.length <= LIMITS.grammar && b.grammar.every((g) => s(g, 160)) &&
    Array.isArray(b.messages) && b.messages.length <= LIMITS.messages &&
    b.messages.every((m) => m && (m.role === 'user' || m.role === 'assistant') && s(m.text, LIMITS.text) && m.text.trim().length > 0)
  if (!ok) throw new Error('invalid')
  return b as ChatRequest
}

export async function chatTurn(r: ChatRequest): Promise<ChatReply> {
  if (!client) throw new Error('disabled')
  // The partner speaks first, so the API's first message (which must be the user's) is a cue.
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: 'user', content: '(The learner has opened the chat. Start the role-play with your first line.)' },
    ...r.messages.map((m) => ({ role: m.role, content: m.text })),
  ]
  const res = await client.beta.messages.create({
    model: CHAT_MODEL,
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system: systemPrompt(r),
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA as unknown as Record<string, unknown> } },
    messages,
  })
  if (res.stop_reason === 'refusal') throw new Error('refusal')
  const text = res.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text
  if (!text || res.stop_reason === 'max_tokens') throw new Error('empty')
  const out = JSON.parse(text) as ChatReply
  out.suggestions = out.suggestions.slice(0, 3)
  return out
}
