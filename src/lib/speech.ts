/** Thin wrappers over the Web Speech API (TTS + speech recognition). */

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const lower = lang.toLowerCase()
  const prefix = lower.split('-')[0]
  return (
    voices.find((v) => v.lang.toLowerCase().replace('_', '-') === lower) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  )
}

export function hasVoiceFor(lang: string): boolean {
  return ttsSupported() && !!pickVoice(lang)
}

/** Calls back whenever the installed voice list changes (it loads async). */
export function onVoicesChanged(cb: () => void): () => void {
  if (!ttsSupported()) return () => {}
  window.speechSynthesis.addEventListener?.('voiceschanged', cb)
  return () => window.speechSynthesis.removeEventListener?.('voiceschanged', cb)
}

export function speak(text: string, lang: string, rate = 0.9): void {
  if (!ttsSupported()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = rate
  const voice = pickVoice(lang)
  if (voice) u.voice = voice
  synth.speak(u)
}

// Voices load asynchronously in Chromium; touch the list early.
if (ttsSupported()) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices())
}

/* ---------- Speech recognition ---------- */

interface RecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function recognitionSupported(): boolean {
  return !!recognitionCtor()
}

export interface Listening {
  result: Promise<string[]>
  stop(): void
}

/** Starts listening once; resolves with alternative transcripts (best first). */
export function listen(lang: string): Listening {
  const Ctor = recognitionCtor()
  if (!Ctor) return { result: Promise.reject(new Error('unsupported')), stop() {} }
  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 5
  rec.continuous = false
  const result = new Promise<string[]>((resolve, reject) => {
    let done = false
    rec.onresult = (e) => {
      done = true
      const alts: string[] = []
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        for (let j = 0; j < r.length; j++) alts.push(r[j].transcript)
      }
      resolve(alts)
    }
    rec.onerror = (e) => {
      done = true
      reject(new Error(e.error))
    }
    rec.onend = () => {
      if (!done) resolve([])
    }
  })
  rec.start()
  return { result, stop: () => rec.stop() }
}
