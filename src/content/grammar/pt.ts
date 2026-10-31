import type { GrammarExample, GrammarPoint } from '../types'

const ex = (target: string, meaning: string): GrammarExample => ({ target, meaning })

export const ptGrammar: Record<string, GrammarPoint[]> = {
  'pt-u1-l1': [
    {
      title: 'Tudo bem?',
      explanation: 'This is the most common way to say “how are you?” in Brazil. You can answer with the same words.',
      examples: [ex('Tudo bem?', 'How are you?'), ex('Tudo bem, e você?', 'Fine, and you?')],
    },
    {
      title: 'Obrigado or obrigada?',
      explanation: 'It literally means “obliged”, so it matches the speaker: men say obrigado and women say obrigada.',
      examples: [ex('Obrigada!', 'Thank you! (said by a woman)'), ex('Obrigado!', 'Thank you! (said by a man)')],
    },
    {
      title: 'Nasal sounds',
      explanation: 'ã, õ, and m or n at the end of a syllable are nasal: some air goes through your nose. Examples: pão, mãe, bom.',
      examples: [ex('Bom dia!', 'Good morning!')],
    },
  ],
  'pt-u1-l2': [
    {
      title: 'Ser (to be)',
      pattern: 'eu sou · você/ele/ela é',
      explanation: 'In Brazil, você takes the same verb form as ele and ela, so there are only two forms to learn here.',
      examples: [ex('Eu sou estudante.', 'I am a student.'), ex('Você é professor?', 'Are you a teacher?')],
    },
    {
      title: 'Questions by intonation',
      explanation: 'Yes/no questions keep the normal word order. Just raise your voice at the end.',
      examples: [ex('Ela é professora?', 'Is she a teacher?')],
    },
    {
      title: 'Gender in job words',
      explanation: 'Many job and nationality words change for women: -o becomes -a, and -or adds -a (professor → professora).',
      examples: [ex('Ela é professora.', 'She is a teacher.'), ex('Ela é americana.', 'She is American.')],
    },
  ],
  'pt-u1-l3': [
    {
      title: 'de + o = do',
      explanation: 'de (from, of) merges with “the”: de + o = do and de + a = da. Many countries take an article, so “from Brazil” is do Brasil.',
      examples: [ex('Eu sou do Brasil.', 'I am from Brazil.'), ex('Ela é da Itália.', 'She is from Italy.')],
    },
    {
      title: 'meu or minha?',
      explanation: 'The word for “my” agrees with the thing you own, not with you: meu for masculine words, minha for feminine ones.',
      examples: [ex('Meu nome é Ana.', 'My name is Ana.'), ex('Minha família', 'My family')],
    },
    {
      title: 'Two ways to give your name',
      explanation: 'Both Meu nome é… (“my name is…”) and Eu me chamo… (“I call myself…”) are common.',
      examples: [ex('Eu me chamo Pedro.', 'My name is Pedro.')],
    },
  ],
  'pt-u2-l1': [
    {
      title: '1 and 2 have genders',
      explanation: 'The words for 1 and 2 match the noun: um/uma for one, dois/duas for two.',
      examples: [ex('um café', 'one coffee'), ex('uma água', 'one water'), ex('duas águas', 'two waters')],
    },
    {
      title: 'Numbers 11–21',
      explanation:
        'From 11 to 20: onze, doze, treze, catorze, quinze, dezesseis, dezessete, dezoito, dezenove, vinte. After 20, join tens and units with e (“and”).',
      examples: [ex('onze', '11'), ex('quinze', '15'), ex('vinte e um', '21')],
    },
  ],
  'pt-u2-l2': [
    {
      title: 'Regular -er verbs',
      pattern: 'eu -o · você/ele/ela -e',
      explanation: 'Verbs like beber and comer follow one pattern: eu bebo / ela bebe, and eu como / ela come.',
      examples: [ex('Eu bebo café.', 'I drink coffee.'), ex('Ela come pão.', 'She eats bread.')],
    },
    {
      title: 'Gostar de',
      pattern: 'gosto de + noun/verb',
      explanation: 'gostar (to like) always needs de after it. Remember that de + o = do.',
      examples: [ex('Eu gosto de café.', 'I like coffee.'), ex('Eu gosto do Brasil.', 'I like Brazil.')],
    },
    {
      title: 'Quero + noun or verb',
      explanation: 'quero (“I want”) can go before a noun or a verb.',
      examples: [ex('Eu quero um café.', 'I want a coffee.'), ex('Eu quero comer.', 'I want to eat.')],
    },
  ],
  'pt-u3-l1': [
    {
      title: 'Ter (to have)',
      pattern: 'eu tenho · você/ele/ela tem',
      explanation: 'ter means “to have”. It is also how you say your age: “I have 20 years.”',
      examples: [ex('Ela tem dois filhos.', 'She has two children.'), ex('Eu tenho vinte anos.', 'I am twenty years old.')],
    },
    {
      title: 'Mixed groups use the masculine plural',
      explanation: 'pais means parents, irmãos means siblings (or brothers), and filhos means children (or sons).',
      examples: [ex('Meus pais são brasileiros.', 'My parents are Brazilian.')],
    },
  ],
  'pt-u3-l2': [
    {
      title: 'Adjectives agree and follow',
      pattern: 'Noun + Adjective',
      explanation: 'Adjectives match the noun in gender and number, and they usually come after it.',
      examples: [ex('uma casa pequena', 'a small house'), ex('Ela é simpática.', 'She is nice.'), ex('Eles são bonitos.', 'They are good-looking.')],
    },
    {
      title: 'Muito: very or a lot',
      explanation: 'Before an adjective, muito means “very”. After a verb, it means “a lot”.',
      examples: [ex('muito grande', 'very big'), ex('Eu estudo muito.', 'I study a lot.')],
    },
  ],
  'pt-u4-l1': [
    {
      title: 'Telling the time',
      pattern: 'São + number + horas',
      explanation: 'Times use São … horas, except 1:00, which is É uma hora. For half past, add e meia.',
      examples: [ex('São duas horas.', 'It’s two o’clock.'), ex('É uma hora.', 'It’s one o’clock.'), ex('São três e meia.', 'It’s half past three.')],
    },
    {
      title: 'Parts of the day and weekdays',
      explanation:
        'Say de manhã (in the morning), à tarde (in the afternoon) and à noite (at night). Weekdays run segunda-feira … sexta-feira, then sábado and domingo. People often drop -feira when speaking.',
      examples: [ex('Eu trabalho de manhã.', 'I work in the morning.'), ex('Hoje é sexta.', 'Today is Friday.')],
    },
  ],
  'pt-u4-l2': [
    {
      title: 'The “I” form ends in -o',
      explanation: 'Most verbs end in -o for “I”: estudar → estudo, trabalhar → trabalho, acordar → acordo. Two common irregular ones are ir → vou and dormir → durmo.',
      examples: [ex('Eu estudo português.', 'I study Portuguese.'), ex('Eu durmo cedo.', 'I sleep early.')],
    },
    {
      title: 'Going places: para / a',
      explanation: 'Use para or a for where you’re going. a merges with “the”: a + o = ao and a + a = à.',
      examples: [ex('Eu vou para casa.', 'I’m going home.'), ex('Eu vou ao mercado.', 'I’m going to the market.')],
    },
    {
      title: 'At a time: às',
      explanation: 'To say “at” a clock time, use às + hour. The exception is 1:00: à uma.',
      examples: [ex('Eu acordo às sete.', 'I wake up at seven.')],
    },
  ],
  'pt-u5-l1': [
    {
      title: 'Ficar vs estar for location',
      explanation: 'Onde fica…? asks where something fixed is, such as a building or a city. For people or temporary locations, use estar.',
      examples: [ex('Onde fica o banco?', 'Where is the bank?'), ex('Onde você está?', 'Where are you?')],
    },
    {
      title: 'Perto de / longe de',
      explanation: 'perto (near) and longe (far) take de before a place. Remember that de + o = do.',
      examples: [ex('O banco é perto do mercado.', 'The bank is near the market.')],
    },
  ],
  'pt-u5-l2': [
    {
      title: 'Asking prices',
      explanation: 'Use Quanto custa? for one thing and Quanto custam? for several.',
      examples: [ex('Quanto custa o café?', 'How much is the coffee?'), ex('Quanto custam os pães?', 'How much are the rolls?')],
    },
    {
      title: 'Isso: that thing',
      explanation:
        'Strictly, isto means “this” (near me) and isso means “that” (near you). In everyday Brazilian speech, isso is used for both.',
      examples: [ex('Eu quero isso.', 'I want that.')],
    },
    {
      title: 'Paying',
      explanation: 'Say pagar com cartão for paying by card and pagar em dinheiro for paying in cash.',
      examples: [ex('Posso pagar com cartão?', 'Can I pay by card?')],
    },
  ],
}
