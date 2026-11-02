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
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
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

/** Friendly messages for the recognition error codes browsers report. */
export function recognitionErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it in your browser’s site settings, then try again.'
    case 'audio-capture':
      return 'No microphone was found. Plug one in or check your sound settings.'
    case 'no-speech':
      return 'I didn’t hear anything — tap the mic and speak a little louder.'
    case 'network':
      return 'Speech recognition needs an internet connection. Check your connection and try again.'
    case 'language-not-supported':
      return 'Your browser can’t recognise this language. Try Chrome or Edge.'
    default:
      return 'Something went wrong with the microphone — try again.'
  }
}

const MAX_LISTEN_MS = 10_000

/**
 * Listens for one phrase. Partial words are reported live through `onInterim`;
 * the promise resolves with alternative final transcripts (best first).
 */
export function listen(lang: string, onInterim?: (text: string) => void): Listening {
  const Ctor = recognitionCtor()
  if (!Ctor) return { result: Promise.reject(new Error('unsupported')), stop() {} }
  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = true
  rec.maxAlternatives = 5
  rec.continuous = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const result = new Promise<string[]>((resolve, reject) => {
    let finals: string[] = []
    let interim = ''
    rec.onresult = (e) => {
      const live: string[] = []
      const alts: string[] = []
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        live.push(r[0].transcript)
        if (r.isFinal) for (let j = 0; j < r.length; j++) alts.push(r[j].transcript)
      }
      interim = live.join('')
      if (alts.length) finals = alts
      onInterim?.(interim)
    }
    rec.onerror = (e) => {
      clearTimeout(timer)
      // Stopping by hand reports "aborted"; treat it like a normal end.
      if (e.error === 'aborted') resolve(finals.length ? finals : interim ? [interim] : [])
      else reject(new Error(e.error))
    }
    rec.onend = () => {
      clearTimeout(timer)
      resolve(finals.length ? finals : interim ? [interim] : [])
    }
  })
  rec.start()
  // Some browsers never end on their own if there's background noise.
  timer = setTimeout(() => rec.stop(), MAX_LISTEN_MS)
  return { result, stop: () => rec.stop() }
}
