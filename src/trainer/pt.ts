/*
 * Portuguese (Brazilian) conjugation: a rule engine for regular -ar / -er / -ir verbs,
 * spelling changes (ficar → fiquei, conhecer → conheço, proteger → protejo …), and a
 * hand-written table for the common irregulars. Four persons, as Brazilian Portuguese
 * uses them: eu, você/ele/ela, nós, vocês/eles/elas.
 */

export type PtTense = 'pres' | 'pret' | 'impf' | 'fut' | 'cond' | 'subj'
export type PtPerson = '1s' | '3s' | '1p' | '3p'
export const PT_TENSES: { id: PtTense; label: string; hint: string }[] = [
  { id: 'pres', label: 'Present', hint: 'I speak, I am speaking' },
  { id: 'pret', label: 'Preterite', hint: 'I spoke (finished)' },
  { id: 'impf', label: 'Imperfect', hint: 'I used to speak, I was speaking' },
  { id: 'fut', label: 'Future', hint: 'I will speak' },
  { id: 'cond', label: 'Conditional', hint: 'I would speak' },
  { id: 'subj', label: 'Present subjunctive', hint: '(que) I speak — wishes, doubts' },
]
export const PT_PERSONS: { id: PtPerson; label: string; en: string }[] = [
  { id: '1s', label: 'eu', en: 'I' },
  { id: '3s', label: 'você / ele / ela', en: 'you / he / she' },
  { id: '1p', label: 'nós', en: 'we' },
  { id: '3p', label: 'vocês / eles / elas', en: 'you all / they' },
]
const IDX: Record<PtPerson, number> = { '1s': 0, '3s': 1, '1p': 2, '3p': 3 }
type Four = [string, string, string, string]

const ENDINGS: Record<'ar' | 'er' | 'ir', Record<'pres' | 'pret' | 'impf' | 'subj', Four>> = {
  ar: { pres: ['o', 'a', 'amos', 'am'], pret: ['ei', 'ou', 'amos', 'aram'], impf: ['ava', 'ava', 'ávamos', 'avam'], subj: ['e', 'e', 'emos', 'em'] },
  er: { pres: ['o', 'e', 'emos', 'em'], pret: ['i', 'eu', 'emos', 'eram'], impf: ['ia', 'ia', 'íamos', 'iam'], subj: ['a', 'a', 'amos', 'am'] },
  ir: { pres: ['o', 'e', 'imos', 'em'], pret: ['i', 'iu', 'imos', 'iram'], impf: ['ia', 'ia', 'íamos', 'iam'], subj: ['a', 'a', 'amos', 'am'] },
}
/** -uir verbs (diminuir, incluir, construir's regular cousins): the i is kept and accented. */
const UIR: Record<'pres' | 'pret' | 'impf' | 'subj', Four> = {
  pres: ['o', 'i', 'ímos', 'em'], pret: ['í', 'iu', 'ímos', 'íram'], impf: ['ía', 'ía', 'íamos', 'íam'], subj: ['a', 'a', 'amos', 'am'],
}
const FUT: Four = ['ei', 'á', 'emos', 'ão']
const COND: Four = ['ia', 'ia', 'íamos', 'iam']

type Irregular = Partial<Record<'pres' | 'pret' | 'impf' | 'subj', Four>> & { futStem?: string }
const w = (s: string) => s.split(' ') as Four

/** The irregulars (only what differs from the rules). The subjunctive comes from "eu" in the present unless given. */
export const PT_IRREGULAR: Record<string, Irregular> = {
  ser: { pres: w('sou é somos são'), pret: w('fui foi fomos foram'), impf: w('era era éramos eram'), subj: w('seja seja sejamos sejam') },
  estar: { pres: w('estou está estamos estão'), pret: w('estive esteve estivemos estiveram'), subj: w('esteja esteja estejamos estejam') },
  ter: { pres: w('tenho tem temos têm'), pret: w('tive teve tivemos tiveram'), impf: w('tinha tinha tínhamos tinham') },
  ir: { pres: w('vou vai vamos vão'), pret: w('fui foi fomos foram'), impf: w('ia ia íamos iam'), subj: w('vá vá vamos vão') },
  fazer: { pres: w('faço faz fazemos fazem'), pret: w('fiz fez fizemos fizeram'), futStem: 'far' },
  poder: { pres: w('posso pode podemos podem'), pret: w('pude pôde pudemos puderam') },
  dizer: { pres: w('digo diz dizemos dizem'), pret: w('disse disse dissemos disseram'), futStem: 'dir' },
  dar: { pres: w('dou dá damos dão'), pret: w('dei deu demos deram'), subj: w('dê dê demos deem') },
  ver: { pres: w('vejo vê vemos veem'), pret: w('vi viu vimos viram') },
  vir: { pres: w('venho vem vimos vêm'), pret: w('vim veio viemos vieram'), impf: w('vinha vinha vínhamos vinham') },
  querer: { pres: w('quero quer queremos querem'), pret: w('quis quis quisemos quiseram'), subj: w('queira queira queiramos queiram') },
  saber: { pres: w('sei sabe sabemos sabem'), pret: w('soube soube soubemos souberam'), subj: w('saiba saiba saibamos saibam') },
  pôr: { pres: w('ponho põe pomos põem'), pret: w('pus pôs pusemos puseram'), impf: w('punha punha púnhamos punham'), futStem: 'por' },
  trazer: { pres: w('trago traz trazemos trazem'), pret: w('trouxe trouxe trouxemos trouxeram'), futStem: 'trar' },
  ler: { pres: w('leio lê lemos leem') },
  crer: { pres: w('creio crê cremos creem') },
  ouvir: { pres: w('ouço ouve ouvimos ouvem') },
  pedir: { pres: w('peço pede pedimos pedem') },
  medir: { pres: w('meço mede medimos medem') },
  dormir: { pres: w('durmo dorme dormimos dormem') },
  sair: { pres: w('saio sai saímos saem'), pret: w('saí saiu saímos saíram'), impf: w('saía saía saíamos saíam') },
  cair: { pres: w('caio cai caímos caem'), pret: w('caí caiu caímos caíram'), impf: w('caía caía caíamos caíam') },
  perder: { pres: w('perco perde perdemos perdem') },
  haver: { pres: w('hei há havemos hão'), pret: w('houve houve houvemos houveram'), subj: w('haja haja hajamos hajam') },
  preferir: { pres: w('prefiro prefere preferimos preferem') },
  sentir: { pres: w('sinto sente sentimos sentem') },
  servir: { pres: w('sirvo serve servimos servem') },
  seguir: { pres: w('sigo segue seguimos seguem') },
  conseguir: { pres: w('consigo consegue conseguimos conseguem') },
  vestir: { pres: w('visto veste vestimos vestem') },
  repetir: { pres: w('repito repete repetimos repetem') },
  subir: { pres: w('subo sobe subimos sobem') },
  fugir: { pres: w('fujo foge fugimos fogem') },
  rir: { pres: w('rio ri rimos riem') },
  valer: { pres: w('valho vale valemos valem') },
  caber: { pres: w('caibo cabe cabemos cabem'), pret: w('coube coube coubemos couberam') },
  odiar: { pres: w('odeio odeia odiamos odeiam'), subj: w('odeie odeie odiemos odeiem') },
  passear: { pres: w('passeio passeia passeamos passeiam'), subj: w('passeie passeie passeemos passeiem') },
}

/** Verbs in the trainer: the course's verbs plus the common irregulars and a few everyday regulars. */
export const PT_VERBS: { inf: string; gloss: string }[] = [
  // Everyday irregulars (the course teaches their forms: sou, tenho, vou, quero, posso …)
  ['ser', 'to be (lasting)'], ['estar', 'to be (for now)'], ['ter', 'to have'], ['ir', 'to go'], ['fazer', 'to do, to make'],
  ['poder', 'to be able to'], ['querer', 'to want'], ['dizer', 'to say'], ['dar', 'to give'], ['ver', 'to see'], ['vir', 'to come'],
  ['saber', 'to know (facts)'], ['pôr', 'to put'], ['trazer', 'to bring'], ['ler', 'to read'], ['crer', 'to believe'], ['ouvir', 'to hear, to listen'],
  ['pedir', 'to ask for, to order'], ['medir', 'to measure'], ['dormir', 'to sleep'], ['sair', 'to go out'], ['cair', 'to fall'], ['perder', 'to lose'],
  ['haver', 'to have (there is)'], ['preferir', 'to prefer'], ['sentir', 'to feel'], ['servir', 'to serve'], ['seguir', 'to follow'],
  ['conseguir', 'to manage to'], ['vestir', 'to dress'], ['repetir', 'to repeat'], ['subir', 'to go up'], ['fugir', 'to run away'], ['rir', 'to laugh'],
  ['valer', 'to be worth'], ['caber', 'to fit'], ['odiar', 'to hate'], ['passear', 'to go for a walk'],
  // Everyday regulars, some with spelling changes
  ['gostar', 'to like'], ['trabalhar', 'to work'], ['estudar', 'to study'], ['chegar', 'to arrive'], ['ficar', 'to stay'], ['começar', 'to begin'],
  ['conhecer', 'to know (people, places)'], ['pagar', 'to pay'], ['jogar', 'to play (games)'], ['tocar', 'to play (music), to touch'], ['viver', 'to live'], ['partir', 'to leave'],
  // From the course
  ['comer', 'to eat'], ['beber', 'to drink'], ['comprar', 'to buy'], ['falar', 'to speak'], ['escrever', 'to write'], ['abrir', 'to open'],
  ['fechar', 'to close'], ['morar', 'to live (somewhere)'], ['ajudar', 'to help'], ['encontrar', 'to meet, to find'], ['combinar', 'to arrange'],
  ['ligar', 'to call'], ['usar', 'to wear, to use'], ['experimentar', 'to try on'], ['descansar', 'to rest'], ['melhorar', 'to get better'],
  ['cuidar', 'to take care'], ['cozinhar', 'to cook'], ['cortar', 'to cut'], ['misturar', 'to mix'], ['resolver', 'to solve'], ['responder', 'to reply'],
  ['enviar', 'to send'], ['mudar', 'to change'], ['tentar', 'to try'], ['desistir', 'to give up'], ['reciclar', 'to recycle'], ['proteger', 'to protect'],
  ['aumentar', 'to increase'], ['diminuir', 'to decrease'], ['ganhar', 'to win, to earn'], ['carregar', 'to charge, to carry'], ['quebrar', 'to break'],
  ['consertar', 'to fix'], ['baixar', 'to download'],
].map(([inf, gloss]) => ({ inf, gloss }))

const group = (inf: string): 'ar' | 'er' | 'ir' => (inf === 'pôr' ? 'er' : (inf.slice(-2) as 'ar' | 'er' | 'ir'))

/** Spelling changes so the consonant keeps its sound before the new vowel. */
function spell(stem: string, ending: string, g: 'ar' | 'er' | 'ir'): string {
  const v = ending[0]
  if (g === 'ar' && v === 'e') {
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'qu' + ending
    if (stem.endsWith('g')) return stem + 'u' + ending
    if (stem.endsWith('ç')) return stem.slice(0, -1) + 'c' + ending
  }
  if (g !== 'ar' && (v === 'o' || v === 'a')) {
    if (stem.endsWith('gu')) return stem.slice(0, -1) + ending // distinguir → distingo
    if (stem.endsWith('c')) return stem.slice(0, -1) + 'ç' + ending // conhecer → conheço
    if (stem.endsWith('g')) return stem.slice(0, -1) + 'j' + ending // proteger → protejo
  }
  return stem + ending
}

/** One form, e.g. conjugatePt('falar', 'pres', '1p') → "falamos". */
export function conjugatePt(inf: string, tense: PtTense, person: PtPerson): string {
  const i = IDX[person]
  const irr = PT_IRREGULAR[inf] ?? {}
  const g = group(inf)
  if (tense === 'fut') return (irr.futStem ?? inf) + FUT[i]
  if (tense === 'cond') return (irr.futStem ?? inf) + COND[i]
  const own = irr[tense]
  if (own) return own[i]
  const stem = inf.slice(0, -2)
  const uir = g === 'ir' && /[^g]uir$/.test(inf)
  if (tense === 'subj') {
    // From "eu" in the present: faço → faça, durmo → durma, conheço → conheça.
    const eu = conjugatePt(inf, 'pres', '1s')
    const base = eu.endsWith('o') ? eu.slice(0, -1) : stem
    const end = ENDINGS[g].subj[i]
    if (g === 'ar') return spell(base, end, g)
    return base + end
  }
  const end = (uir ? UIR : ENDINGS[g])[tense][i]
  return spell(stem, end, g)
}

export const isIrregularPt = (inf: string) => inf in PT_IRREGULAR
