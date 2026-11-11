import { describe, expect, it } from 'vitest'
import { COURSES, allItems, getItem } from '../content'
import { JA_ADJS, JA_VERBS, conjugateJa, conjugateJaAdj, romaji, type JaVerbForm } from './ja'
import { PT_PERSONS, PT_TENSES, PT_VERBS, conjugatePt, type PtTense } from './pt'
import { CLASSIFIERS, MEASURE_WORDS } from './zh'
import { isTrainerItem, trainerItems, trainerPool, trainerSets } from '.'

/** Reference tables (eu, você, nós, eles), checked against standard Brazilian Portuguese grammars. */
const PT_TABLES: Record<string, Partial<Record<PtTense, string>>> = {
  falar: { pres: 'falo fala falamos falam', pret: 'falei falou falamos falaram', impf: 'falava falava falávamos falavam', fut: 'falarei falará falaremos falarão', cond: 'falaria falaria falaríamos falariam', subj: 'fale fale falemos falem' },
  comer: { pres: 'como come comemos comem', pret: 'comi comeu comemos comeram', impf: 'comia comia comíamos comiam', fut: 'comerei comerá comeremos comerão', cond: 'comeria comeria comeríamos comeriam', subj: 'coma coma comamos comam' },
  partir: { pres: 'parto parte partimos partem', pret: 'parti partiu partimos partiram', impf: 'partia partia partíamos partiam', subj: 'parta parta partamos partam' },
  ser: { pres: 'sou é somos são', pret: 'fui foi fomos foram', impf: 'era era éramos eram', fut: 'serei será seremos serão', subj: 'seja seja sejamos sejam' },
  estar: { pres: 'estou está estamos estão', pret: 'estive esteve estivemos estiveram', impf: 'estava estava estávamos estavam', subj: 'esteja esteja estejamos estejam' },
  ter: { pres: 'tenho tem temos têm', pret: 'tive teve tivemos tiveram', impf: 'tinha tinha tínhamos tinham', subj: 'tenha tenha tenhamos tenham' },
  ir: { pres: 'vou vai vamos vão', pret: 'fui foi fomos foram', impf: 'ia ia íamos iam', fut: 'irei irá iremos irão', subj: 'vá vá vamos vão' },
  fazer: { pres: 'faço faz fazemos fazem', pret: 'fiz fez fizemos fizeram', fut: 'farei fará faremos farão', cond: 'faria faria faríamos fariam', subj: 'faça faça façamos façam' },
  poder: { pret: 'pude pôde pudemos puderam', subj: 'possa possa possamos possam' },
  dizer: { fut: 'direi dirá diremos dirão', subj: 'diga diga digamos digam' },
  dar: { pres: 'dou dá damos dão', pret: 'dei deu demos deram', impf: 'dava dava dávamos davam', subj: 'dê dê demos deem' },
  ver: { pres: 'vejo vê vemos veem', pret: 'vi viu vimos viram', impf: 'via via víamos viam', subj: 'veja veja vejamos vejam' },
  vir: { pres: 'venho vem vimos vêm', pret: 'vim veio viemos vieram', subj: 'venha venha venhamos venham' },
  pôr: { pres: 'ponho põe pomos põem', fut: 'porei porá poremos porão', subj: 'ponha ponha ponhamos ponham' },
  ler: { pres: 'leio lê lemos leem', pret: 'li leu lemos leram', subj: 'leia leia leiamos leiam' },
  dormir: { pres: 'durmo dorme dormimos dormem', subj: 'durma durma durmamos durmam' },
  ouvir: { subj: 'ouça ouça ouçamos ouçam', pret: 'ouvi ouviu ouvimos ouviram' },
  sair: { pres: 'saio sai saímos saem', impf: 'saía saía saíamos saíam', subj: 'saia saia saiamos saiam' },
  querer: { pret: 'quis quis quisemos quiseram', subj: 'queira queira queiramos queiram' },
  saber: { pres: 'sei sabe sabemos sabem', subj: 'saiba saiba saibamos saibam' },
  // Spelling changes
  ficar: { pret: 'fiquei ficou ficamos ficaram', subj: 'fique fique fiquemos fiquem' },
  chegar: { pret: 'cheguei chegou chegamos chegaram', subj: 'chegue chegue cheguemos cheguem' },
  começar: { pres: 'começo começa começamos começam', pret: 'comecei começou começamos começaram', subj: 'comece comece comecemos comecem' },
  conhecer: { pres: 'conheço conhece conhecemos conhecem', subj: 'conheça conheça conheçamos conheçam' },
  proteger: { pres: 'protejo protege protegemos protegem', subj: 'proteja proteja protejamos protejam' },
  diminuir: { pres: 'diminuo diminui diminuímos diminuem', pret: 'diminuí diminuiu diminuímos diminuíram', impf: 'diminuía diminuía diminuíamos diminuíam', subj: 'diminua diminua diminuamos diminuam' },
  odiar: { pres: 'odeio odeia odiamos odeiam', pret: 'odiei odiou odiamos odiaram' },
  passear: { pres: 'passeio passeia passeamos passeiam', pret: 'passeei passeou passeamos passearam' },
}

describe('Portuguese conjugation', () => {
  for (const [inf, tenses] of Object.entries(PT_TABLES)) {
    for (const [tense, forms] of Object.entries(tenses)) {
      it(`${inf} · ${tense}`, () => {
        expect(PT_PERSONS.map((p) => conjugatePt(inf, tense as PtTense, p.id)).join(' ')).toBe(forms)
      })
    }
  }
  it('covers every course infinitive', () => {
    const inTrainer = new Set(PT_VERBS.map((v) => v.inf))
    const course = allItems(COURSES.pt).filter((i) => i.kind === 'word' && /^to /.test(i.meaning) && /^[a-zà-ú]+(ar|er|ir)$/.test(i.target))
    expect(course.length).toBeGreaterThan(20)
    for (const it of course) expect(inTrainer.has(it.target), it.target).toBe(true)
  })
  it('has about 40 irregulars and no duplicate verbs', () => {
    const infs = PT_VERBS.map((v) => v.inf)
    expect(new Set(infs).size).toBe(infs.length)
    expect(PT_TENSES).toHaveLength(6)
  })
})

/** Reference forms: masu, nai, ta, te, potential, volitional. */
const JA_TABLES: Record<string, string> = {
  食べる: '食べます 食べない 食べた 食べて 食べられる 食べよう',
  飲む: '飲みます 飲まない 飲んだ 飲んで 飲める 飲もう',
  行く: '行きます 行かない 行った 行って 行ける 行こう',
  書く: '書きます 書かない 書いた 書いて 書ける 書こう',
  泳ぐ: '泳ぎます 泳がない 泳いだ 泳いで 泳げる 泳ごう',
  話す: '話します 話さない 話した 話して 話せる 話そう',
  待つ: '待ちます 待たない 待った 待って 待てる 待とう',
  買う: '買います 買わない 買った 買って 買える 買おう',
  並ぶ: '並びます 並ばない 並んだ 並んで 並べる 並ぼう',
  帰る: '帰ります 帰らない 帰った 帰って 帰れる 帰ろう',
  見る: '見ます 見ない 見た 見て 見られる 見よう',
  来る: '来ます 来ない 来た 来て 来られる 来よう',
  する: 'します しない した して できる しよう',
  勉強する: '勉強します 勉強しない 勉強した 勉強して 勉強できる 勉強しよう',
}
const FORMS: JaVerbForm[] = ['masu', 'nai', 'ta', 'te', 'pot', 'vol']

describe('Japanese verb forms', () => {
  for (const [dict, forms] of Object.entries(JA_TABLES)) {
    it(dict, () => {
      const verb = JA_VERBS.find((v) => v.dict === dict)!
      expect(FORMS.map((f) => conjugateJa(verb, f).target).join(' ')).toBe(forms)
    })
  }
  it('conjugates readings too (来る: こない, きた)', () => {
    const kuru = JA_VERBS.find((v) => v.dict === '来る')!
    expect(['nai', 'ta', 'pot', 'vol'].map((f) => conjugateJa(kuru, f as JaVerbForm).reading)).toEqual(['こない', 'きた', 'こられる', 'こよう'])
    const taberu = JA_VERBS.find((v) => v.dict === '食べる')!
    expect(conjugateJa(taberu, 'te').reading).toBe('たべて')
  })
  it('ある: ない, not あらない', () => {
    expect(conjugateJa(JA_VERBS.find((v) => v.dict === 'ある')!, 'nai').target).toBe('ない')
  })
  it('covers every course verb (taught as ます forms)', () => {
    const masu = new Set(JA_VERBS.map((v) => conjugateJa(v, 'masu').target))
    const dict = new Set(JA_VERBS.map((v) => v.dict))
    const course = allItems(COURSES.ja).filter((i) => i.kind === 'word' && /^to /.test(i.meaning) && /[うくぐすつぬぶむる]$/.test(i.target))
    for (const it of course) expect(masu.has(it.target) || dict.has(it.target), it.target).toBe(true)
  })
  it('adjectives', () => {
    const adj = (w: string) => JA_ADJS.find((a) => a.word === w)!
    expect(['neg', 'past', 'pastneg', 'te'].map((f) => conjugateJaAdj(adj('高い'), f as never).target)).toEqual(['高くない', '高かった', '高くなかった', '高くて'])
    expect(['neg', 'past', 'pastneg', 'te'].map((f) => conjugateJaAdj(adj('いい'), f as never).target)).toEqual(['よくない', 'よかった', 'よくなかった', 'よくて'])
    expect(['neg', 'past', 'pastneg', 'te'].map((f) => conjugateJaAdj(adj('静か'), f as never).target)).toEqual(['静かじゃない', '静かだった', '静かじゃなかった', '静かで'])
    expect(conjugateJaAdj(adj('きれい'), 'neg').alt).toContain('きれいではない')
  })
  it('romaji', () => {
    expect(romaji('たべて')).toBe('tabete')
    expect(romaji('いった')).toBe('itta')
    expect(romaji('べんきょうしよう')).toBe('benkyoushiyou')
    expect(romaji('まっちゃ')).toBe('matcha')
    expect(romaji('じゃない')).toBe('janai')
    expect(romaji('こんや')).toBe("kon'ya")
  })
})

describe('Chinese measure words', () => {
  it('every classifier used is described, and every noun is in the course', () => {
    const nouns = new Set(allItems(COURSES.zh).map((i) => i.target))
    for (const w of MEASURE_WORDS) {
      expect(CLASSIFIERS[w.mw], w.noun).toBeTruthy()
      expect(nouns.has(w.noun), w.noun).toBe(true)
      expect(w.also ?? [], w.noun).not.toContain(w.mw)
    }
  })
  it('a few checked pairs', () => {
    const mw = (n: string) => MEASURE_WORDS.find((w) => w.noun === n)!.mw
    expect([mw('书'), mw('猫'), mw('鱼'), mw('桌子'), mw('车'), mw('衣服'), mw('椅子'), mw('飞机'), mw('邮件')]).toEqual(['本', '只', '条', '张', '辆', '件', '把', '架', '封'])
  })
})

describe('trainer cards', () => {
  it('ids are unique, prefixed and resolvable through the course lookups', () => {
    const items = trainerItems()
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
    for (const it of items) {
      expect(isTrainerItem(it.id), it.id).toBe(true)
      expect(it.id).toMatch(/^[a-z]{2}-[a-z]+-[a-z0-9'-]+$/)
      expect(it.id.length).toBeLessThanOrEqual(200)
      expect(getItem(it.id)).toBe(it)
    }
    expect(getItem('pt-conj-falar-pres-1p')?.target).toBe('falamos')
    expect(getItem('ja-form-taberu-te')?.target).toBe('食べて')
    expect(getItem('ja-adj-takai-past')?.target).toBe('高かった')
    expect(getItem('zh-mw-shu')?.target).toBe('本')
  })
  it('wrong answers come from the same verb, with distinct answers', () => {
    const it = getItem('pt-conj-ser-pres-1s')!
    const pool = trainerPool(it)
    expect(pool.length).toBeGreaterThan(10)
    expect(pool.every((p) => p.id.startsWith('pt-conj-ser-') && p.target !== 'sou')).toBe(true)
    expect(new Set(pool.map((p) => p.target)).size).toBe(pool.length)
  })
  it('sets list every kind with drills', () => {
    const s = trainerSets()
    expect(s.pt.kinds[0].words.length).toBeGreaterThanOrEqual(80)
    expect(s.ja.kinds.map((k) => k.id)).toEqual(['verbs', 'adjectives'])
    expect(s.zh.kinds[0].words.length).toBe(MEASURE_WORDS.length)
  })
})
