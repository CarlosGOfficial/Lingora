/*
 * Japanese verb and adjective forms. Verbs carry a class tag (godan / ichidan / the
 * irregulars する and 来る), and the forms come from rules on the last kana, applied to
 * the written word and its reading together.
 */

export type JaClass = 'godan' | 'ichidan' | 'suru' | 'kuru'
export type JaVerbForm = 'masu' | 'nai' | 'ta' | 'te' | 'pot' | 'vol'
export type JaAdjForm = 'neg' | 'past' | 'pastneg' | 'te'
export type JaVerb = { dict: string; reading: string; cls: JaClass; gloss: string }
export type JaAdj = { word: string; reading: string; kind: 'i' | 'na'; gloss: string }

export const JA_VERB_FORMS: { id: JaVerbForm; label: string; hint: string }[] = [
  { id: 'masu', label: 'Polite (ます)', hint: 'I eat (polite)' },
  { id: 'nai', label: 'Negative (ない)', hint: "I don't eat" },
  { id: 'ta', label: 'Past (た)', hint: 'I ate' },
  { id: 'te', label: 'Te-form (て)', hint: 'eat and…, please eat' },
  { id: 'pot', label: 'Potential', hint: 'I can eat' },
  { id: 'vol', label: 'Volitional', hint: "let's eat" },
]
export const JA_ADJ_FORMS: { id: JaAdjForm; label: string; hint: string }[] = [
  { id: 'neg', label: 'Negative', hint: "isn't big" },
  { id: 'past', label: 'Past', hint: 'was big' },
  { id: 'pastneg', label: 'Past negative', hint: "wasn't big" },
  { id: 'te', label: 'Te-form', hint: 'big and…' },
]

const v = (dict: string, reading: string, cls: JaClass, gloss: string): JaVerb => ({ dict, reading, cls, gloss })
/** The course's verbs (taught in the ます form) in dictionary form, with their class. */
export const JA_VERBS: JaVerb[] = [
  v('食べる', 'たべる', 'ichidan', 'to eat'), v('飲む', 'のむ', 'godan', 'to drink'), v('行く', 'いく', 'godan', 'to go'),
  v('来る', 'くる', 'kuru', 'to come'), v('帰る', 'かえる', 'godan', 'to go home'), v('起きる', 'おきる', 'ichidan', 'to get up'),
  v('寝る', 'ねる', 'ichidan', 'to sleep'), v('買う', 'かう', 'godan', 'to buy'), v('見る', 'みる', 'ichidan', 'to see'),
  v('聞く', 'きく', 'godan', 'to listen'), v('読む', 'よむ', 'godan', 'to read'), v('書く', 'かく', 'godan', 'to write'),
  v('話す', 'はなす', 'godan', 'to speak'), v('会う', 'あう', 'godan', 'to meet'), v('待つ', 'まつ', 'godan', 'to wait'),
  v('分かる', 'わかる', 'godan', 'to understand'), v('泳ぐ', 'およぐ', 'godan', 'to swim'), v('乗る', 'のる', 'godan', 'to ride'),
  v('降りる', 'おりる', 'ichidan', 'to get off'), v('渡る', 'わたる', 'godan', 'to cross'), v('泊まる', 'とまる', 'godan', 'to stay (overnight)'),
  v('あげる', 'あげる', 'ichidan', 'to give (to others)'), v('もらう', 'もらう', 'godan', 'to receive'), v('くれる', 'くれる', 'ichidan', 'to give (to me)'),
  v('登る', 'のぼる', 'godan', 'to climb'), v('遅れる', 'おくれる', 'ichidan', 'to be late'), v('思う', 'おもう', 'godan', 'to think'),
  v('送る', 'おくる', 'godan', 'to send'), v('届く', 'とどく', 'godan', 'to arrive (deliveries)'), v('決める', 'きめる', 'ichidan', 'to decide'),
  v('驚く', 'おどろく', 'godan', 'to be surprised'), v('怒る', 'おこる', 'godan', 'to get angry'), v('頑張る', 'がんばる', 'godan', "to do one's best"),
  v('続ける', 'つづける', 'ichidan', 'to continue'), v('諦める', 'あきらめる', 'ichidan', 'to give up'), v('減る', 'へる', 'godan', 'to decrease'),
  v('増える', 'ふえる', 'ichidan', 'to increase'), v('守る', 'まもる', 'godan', 'to protect'), v('捨てる', 'すてる', 'ichidan', 'to throw away'),
  v('調べる', 'しらべる', 'ichidan', 'to look up'), v('伝える', 'つたえる', 'ichidan', 'to convey'), v('騒ぐ', 'さわぐ', 'godan', 'to make noise'),
  v('並ぶ', 'ならぶ', 'godan', 'to line up'), v('壊れる', 'こわれる', 'ichidan', 'to break'), v('直す', 'なおす', 'godan', 'to fix'),
  v('ある', 'ある', 'godan', 'to be, to exist (things)'), v('いる', 'いる', 'ichidan', 'to be, to exist (people)'),
  v('する', 'する', 'suru', 'to do'), v('勉強する', 'べんきょうする', 'suru', 'to study'),
]

const a = (word: string, reading: string, kind: 'i' | 'na', gloss: string): JaAdj => ({ word, reading, kind, gloss })
export const JA_ADJS: JaAdj[] = [
  a('おいしい', 'おいしい', 'i', 'delicious'), a('大きい', 'おおきい', 'i', 'big'), a('小さい', 'ちいさい', 'i', 'small'), a('新しい', 'あたらしい', 'i', 'new'),
  a('古い', 'ふるい', 'i', 'old (things)'), a('いい', 'いい', 'i', 'good'), a('高い', 'たかい', 'i', 'expensive, tall'), a('安い', 'やすい', 'i', 'cheap'),
  a('優しい', 'やさしい', 'i', 'kind'), a('面白い', 'おもしろい', 'i', 'interesting'), a('若い', 'わかい', 'i', 'young'), a('近い', 'ちかい', 'i', 'near'),
  a('遠い', 'とおい', 'i', 'far'), a('赤い', 'あかい', 'i', 'red'), a('暑い', 'あつい', 'i', 'hot (weather)'), a('寒い', 'さむい', 'i', 'cold (weather)'),
  a('重い', 'おもい', 'i', 'heavy'), a('軽い', 'かるい', 'i', 'light'), a('長い', 'ながい', 'i', 'long'), a('嬉しい', 'うれしい', 'i', 'happy'),
  a('悲しい', 'かなしい', 'i', 'sad'), a('楽しい', 'たのしい', 'i', 'fun'), a('つまらない', 'つまらない', 'i', 'boring'), a('すごい', 'すごい', 'i', 'amazing'),
  a('きれい', 'きれい', 'na', 'pretty, clean'), a('好き', 'すき', 'na', 'liked'), a('静か', 'しずか', 'na', 'quiet'), a('元気', 'げんき', 'na', 'well, lively'),
  a('便利', 'べんり', 'na', 'convenient'), a('上手', 'じょうず', 'na', 'good at'), a('下手', 'へた', 'na', 'bad at'),
]

/* Godan rows: the last kana → its い / あ / え / お row kana, and the て / た ending. */
const GODAN: Record<string, { i: string; a: string; e: string; o: string; te: string; ta: string }> = {
  う: { i: 'い', a: 'わ', e: 'え', o: 'お', te: 'って', ta: 'った' },
  く: { i: 'き', a: 'か', e: 'け', o: 'こ', te: 'いて', ta: 'いた' },
  ぐ: { i: 'ぎ', a: 'が', e: 'げ', o: 'ご', te: 'いで', ta: 'いだ' },
  す: { i: 'し', a: 'さ', e: 'せ', o: 'そ', te: 'して', ta: 'した' },
  つ: { i: 'ち', a: 'た', e: 'て', o: 'と', te: 'って', ta: 'った' },
  ぬ: { i: 'に', a: 'な', e: 'ね', o: 'の', te: 'んで', ta: 'んだ' },
  ぶ: { i: 'び', a: 'ば', e: 'べ', o: 'ぼ', te: 'んで', ta: 'んだ' },
  む: { i: 'み', a: 'ま', e: 'め', o: 'も', te: 'んで', ta: 'んだ' },
  る: { i: 'り', a: 'ら', e: 'れ', o: 'ろ', te: 'って', ta: 'った' },
}

export type JaForm = { target: string; reading: string; alt?: string[] }

/** Swap the ending of the word and its reading together. */
const swap = (word: string, reading: string, cut: number, add: string): JaForm => ({ target: word.slice(0, word.length - cut) + add, reading: reading.slice(0, reading.length - cut) + add })

/** Which forms a verb has in the trainer (ある has no potential or volitional in everyday use). */
export const jaVerbForms = (verb: JaVerb): JaVerbForm[] => (verb.dict === 'ある' ? ['masu', 'nai', 'ta', 'te'] : JA_VERB_FORMS.map((f) => f.id))

export function conjugateJa(verb: JaVerb, form: JaVerbForm): JaForm {
  const { dict, reading, cls } = verb
  if (cls === 'suru') {
    const add = { masu: 'します', nai: 'しない', ta: 'した', te: 'して', pot: 'できる', vol: 'しよう' }[form]
    return swap(dict, reading, 2, add)
  }
  if (cls === 'kuru') {
    // 来る: the kanji stays, its reading changes (き / こ).
    const r = { masu: 'きます', nai: 'こない', ta: 'きた', te: 'きて', pot: 'こられる', vol: 'こよう' }[form]
    const t = { masu: '来ます', nai: '来ない', ta: '来た', te: '来て', pot: '来られる', vol: '来よう' }[form]
    return { target: t, reading: r }
  }
  if (cls === 'ichidan') {
    const add = { masu: 'ます', nai: 'ない', ta: 'た', te: 'て', pot: 'られる', vol: 'よう' }[form]
    const out = swap(dict, reading, 1, add)
    // The shortened potential (食べれる) is common in speech: accepted, not taught.
    if (form === 'pot') out.alt = [swap(dict, reading, 1, 'れる').target, swap(dict, reading, 1, 'れる').reading]
    return out
  }
  const row = GODAN[dict.slice(-1)]
  if (!row) throw new Error(`Not a godan ending: ${dict}`)
  if (dict === 'ある' && form === 'nai') return { target: 'ない', reading: 'ない' }
  // 行く is the one godan verb with an irregular て / た: 行って, 行った.
  const iku = dict.endsWith('行く') || reading === 'いく'
  const add = {
    masu: row.i + 'ます', nai: row.a + 'ない', ta: iku ? 'った' : row.ta, te: iku ? 'って' : row.te, pot: row.e + 'る', vol: row.o + 'う',
  }[form]
  return swap(dict, reading, 1, add)
}

export function conjugateJaAdj(adj: JaAdj, form: JaAdjForm): JaForm {
  const { word, reading, kind } = adj
  if (kind === 'na') {
    const add = { neg: 'じゃない', past: 'だった', pastneg: 'じゃなかった', te: 'で' }[form]
    const alt = { neg: 'ではない', past: '', pastneg: 'ではなかった', te: '' }[form]
    const out: JaForm = { target: word + add, reading: reading + add }
    if (alt) out.alt = [word + alt, reading + alt]
    return out
  }
  const add = { neg: 'くない', past: 'かった', pastneg: 'くなかった', te: 'くて' }[form]
  // いい borrows its forms from よい: よくない, よかった.
  if (word === 'いい') return { target: 'よ' + add, reading: 'よ' + add }
  return swap(word, reading, 1, add)
}

/* ---------- Kana → romaji (Hepburn), so forms can be typed on a Latin keyboard ---------- */

const KANA: Record<string, string> = {
  あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o', か: 'ka', き: 'ki', く: 'ku', け: 'ke', こ: 'ko', が: 'ga', ぎ: 'gi', ぐ: 'gu', げ: 'ge', ご: 'go',
  さ: 'sa', し: 'shi', す: 'su', せ: 'se', そ: 'so', ざ: 'za', じ: 'ji', ず: 'zu', ぜ: 'ze', ぞ: 'zo', た: 'ta', ち: 'chi', つ: 'tsu', て: 'te', と: 'to',
  だ: 'da', ぢ: 'ji', づ: 'zu', で: 'de', ど: 'do', な: 'na', に: 'ni', ぬ: 'nu', ね: 'ne', の: 'no', は: 'ha', ひ: 'hi', ふ: 'fu', へ: 'he', ほ: 'ho',
  ば: 'ba', び: 'bi', ぶ: 'bu', べ: 'be', ぼ: 'bo', ぱ: 'pa', ぴ: 'pi', ぷ: 'pu', ぺ: 'pe', ぽ: 'po', ま: 'ma', み: 'mi', む: 'mu', め: 'me', も: 'mo',
  や: 'ya', ゆ: 'yu', よ: 'yo', ら: 'ra', り: 'ri', る: 'ru', れ: 're', ろ: 'ro', わ: 'wa', を: 'o', ん: 'n',
}
const SMALL: Record<string, string> = { ゃ: 'a', ゅ: 'u', ょ: 'o' }

export function romaji(kana: string): string {
  let out = ''
  const chars = [...kana]
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i], next = chars[i + 1]
    if (c === 'っ') {
      const r = next ? KANA[next] ?? '' : ''
      out += r.startsWith('ch') ? 't' : r[0] ?? ''
      continue
    }
    if (c === 'ー') { out += out.slice(-1); continue }
    let r = KANA[c]
    if (r === undefined) { out += c; continue }
    if (next && SMALL[next]) {
      // きゃ → kya, しゃ → sha, ちゃ → cha, じゃ → ja
      r = /^(shi|chi|ji)$/.test(r) ? r.slice(0, -1) + SMALL[next] : r.slice(0, -1) + 'y' + SMALL[next]
      i++
    }
    if (c === 'ん' && next && /^[aiueoy]/.test(KANA[next] ?? '')) r = "n'"
    out += r
  }
  return out
}
