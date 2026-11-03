import { addLessons, insertUnits } from './extend'
import { ptMoreUnits } from './pt-units-more'
import { ptSectionUnits } from './pt-units-sections'
import { ptMoreLessons } from './pt-more'
import { ptTier23Units } from './pt-tier2-3'
import type { Course, Item } from './types'

const w = (id: string, target: string, meaning: string, extra: Partial<Item> = {}): Item => ({
  id: `pt-${id}`,
  kind: 'word',
  target,
  meaning,
  ...extra,
})

const s = (id: string, target: string, meaning: string, extra: Partial<Item> = {}): Item => ({
  id: `pt-${id}`,
  kind: 'sentence',
  target,
  meaning,
  tokens: target.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean),
  ...extra,
})

export const pt: Course = {
  lang: 'pt',
  name: 'Portuguese',
  nativeName: 'Português (Brasil)',
  badge: 'Pt',
  standard: 'CEFR',
  standardFull: 'Common European Framework of Reference for Languages (A1 → C2)',
  bcp47: 'pt-BR',
  typingHint: 'Accents count — small slips are marked “almost”.',
  units: insertUnits(addLessons([
    {
      id: 'pt-u1',
      title: 'Greetings & Introductions',
      level: 'A1',
      canDo: ['Greet people and ask how they are', 'Say who you are and what you do', 'Say your name and where you’re from'],
      lessons: [
        {
          id: 'pt-u1-l1',
          title: 'Hello & Thanks',
          goal: 'Greet people politely',
          items: [
            w('oi', 'oi', 'hi'),
            w('ola', 'olá', 'hello'),
            w('bomdia', 'bom dia', 'good morning'),
            w('tchau', 'tchau', 'bye', { meaningAlt: ['goodbye'] }),
            w('obrigado', 'obrigado', 'thank you', { alt: ['obrigada'], note: 'Men say obrigado, women usually say obrigada.' }),
            w('porfavor', 'por favor', 'please'),
            w('desculpa', 'desculpa', 'sorry', { alt: ['desculpe'] }),
          ],
          sentences: [
            s('s-tudobem', 'Tudo bem?', 'How are you?', { meaningAlt: ['Everything OK?'] }),
            s('s-tudobemobrigado', 'Tudo bem, obrigado.', 'I’m fine, thanks.', { alt: ['Tudo bem, obrigada.'] }),
            s('s-bomdiatudobem', 'Bom dia, tudo bem?', 'Good morning, how are you?'),
          ],
        },
        {
          id: 'pt-u1-l2',
          title: 'People',
          goal: 'Say who someone is',
          items: [
            w('eu', 'eu', 'I'),
            w('voce', 'você', 'you'),
            w('ele', 'ele', 'he'),
            w('ela', 'ela', 'she'),
            w('sou', 'sou', 'I am', { note: 'From ser (to be): eu sou, você/ele/ela é.' }),
            w('e', 'é', 'is', { meaningAlt: ['you are'] }),
            w('estudante', 'estudante', 'student'),
            w('professor', 'professor', 'teacher', { alt: ['professora'] }),
          ],
          sentences: [
            s('s-eusouestudante', 'Eu sou estudante.', 'I am a student.'),
            s('s-elaeprofessora', 'Ela é professora.', 'She is a teacher.'),
            s('s-voceeprofessor', 'Você é professor?', 'Are you a teacher?'),
          ],
        },
        {
          id: 'pt-u1-l3',
          title: 'Names & Countries',
          goal: 'Say your name and origin',
          items: [
            w('nome', 'nome', 'name'),
            w('meu', 'meu', 'my'),
            w('como', 'como', 'how'),
            w('brasil', 'Brasil', 'Brazil'),
            w('brasileiro', 'brasileiro', 'Brazilian', { alt: ['brasileira'] }),
            w('americano', 'americano', 'American', { alt: ['americana'] }),
          ],
          sentences: [
            s('s-meunomeeana', 'Meu nome é Ana.', 'My name is Ana.'),
            s('s-eusoudobrasil', 'Eu sou do Brasil.', 'I am from Brazil.', { note: 'do = de + o (“from the”).' }),
            s('s-comovocesechama', 'Como você se chama?', 'What is your name?', { note: 'Literally “How do you call yourself?”' }),
          ],
        },
      ],
      reading: {
        id: 'pt-u1-r',
        title: 'Pedro e Sarah',
        sentences: [
          s('r1-1', 'Oi! Meu nome é Pedro.', 'Hi! My name is Pedro.'),
          s('r1-2', 'Eu sou brasileiro. Eu sou estudante.', 'I am Brazilian. I am a student.'),
          s('r1-3', 'Esta é a Sarah. Ela é americana.', 'This is Sarah. She is American.', { note: 'esta = this (feminine)' }),
          s('r1-4', 'Ela é professora.', 'She is a teacher.'),
        ],
        questions: [
          { q: 'Where is Pedro from?', options: ['Portugal', 'Brazil', 'USA'], answer: 1 },
          { q: 'What does Sarah do?', options: ['She is a student', 'She is a teacher', 'She is a doctor'], answer: 1 },
          { q: 'Who is a student?', options: ['Pedro', 'Sarah', 'Both'], answer: 0 },
        ],
      },
    },
    {
      id: 'pt-u2',
      title: 'Numbers & Food',
      level: 'A1',
      canDo: ['Count from one to ten', 'Order food and drinks', 'Say what you like with “gosto de”'],
      lessons: [
        {
          id: 'pt-u2-l1',
          title: 'Numbers 1–10',
          goal: 'Count from one to ten',
          items: [
            w('um', 'um', 'one', { alt: ['uma'], meaningAlt: ['1'] }),
            w('dois', 'dois', 'two', { alt: ['duas'], meaningAlt: ['2'] }),
            w('tres', 'três', 'three', { meaningAlt: ['3'] }),
            w('quatro', 'quatro', 'four', { meaningAlt: ['4'] }),
            w('cinco', 'cinco', 'five', { meaningAlt: ['5'] }),
            w('seis', 'seis', 'six', { meaningAlt: ['6'] }),
            w('sete', 'sete', 'seven', { meaningAlt: ['7'] }),
            w('oito', 'oito', 'eight', { meaningAlt: ['8'] }),
            w('nove', 'nove', 'nine', { meaningAlt: ['9'] }),
            w('dez', 'dez', 'ten', { meaningAlt: ['10'] }),
          ],
          sentences: [s('s-quantocusta', 'Quanto custa?', 'How much is it?')],
        },
        {
          id: 'pt-u2-l2',
          title: 'Eating & Drinking',
          goal: 'Order and say what you like',
          items: [
            w('agua', 'água', 'water'),
            w('cafe', 'café', 'coffee'),
            w('pao', 'pão', 'bread'),
            w('comer', 'comer', 'to eat'),
            w('beber', 'beber', 'to drink'),
            w('quero', 'quero', 'I want'),
            w('gostode', 'gosto de', 'I like'),
          ],
          sentences: [
            s('s-euquerouncafe', 'Eu quero um café.', 'I want a coffee.'),
            s('s-eugostodepao', 'Eu gosto de pão.', 'I like bread.'),
            s('s-elabebeagua', 'Ela bebe água.', 'She drinks water.'),
          ],
        },
      ],
      reading: {
        id: 'pt-u2-r',
        title: 'O café da manhã · Breakfast',
        sentences: [
          s('r2-1', 'Eu sou o Pedro.', 'I am Pedro.'),
          s('r2-2', 'De manhã, eu bebo café.', 'In the morning, I drink coffee.', { note: 'de manhã = in the morning' }),
          s('r2-3', 'Eu gosto de pão.', 'I like bread.'),
          s('r2-4', 'A Sarah não bebe café. Ela bebe água.', 'Sarah doesn’t drink coffee. She drinks water.', { note: 'não = not' }),
        ],
        questions: [
          { q: 'What does Pedro drink in the morning?', options: ['Water', 'Coffee', 'Tea'], answer: 1 },
          { q: 'What does Pedro like?', options: ['Bread', 'Rice', 'Fish'], answer: 0 },
          { q: 'What does Sarah drink?', options: ['Coffee', 'Juice', 'Water'], answer: 2 },
        ],
      },
    },
    {
      id: 'pt-u3',
      title: 'Family & Describing',
      level: 'A1',
      canDo: ['Talk about your family', 'Describe people and things', 'Use masculine and feminine forms'],
      lessons: [
        {
          id: 'pt-u3-l1',
          title: 'My Family',
          goal: 'Name family members',
          items: [
            w('u3-familia', 'família', 'family'),
            w('u3-pai', 'pai', 'father', { meaningAlt: ['dad'] }),
            w('u3-mae', 'mãe', 'mother', { meaningAlt: ['mom'] }),
            w('u3-irmao', 'irmão', 'brother'),
            w('u3-irma', 'irmã', 'sister'),
            w('u3-filho', 'filho', 'son'),
            w('u3-filha', 'filha', 'daughter'),
            w('u3-tenho', 'tenho', 'I have', { note: 'From ter (to have): eu tenho, você/ele/ela tem.' }),
          ],
          sentences: [
            s('u3-s-tenhoirma', 'Eu tenho uma irmã.', 'I have a sister.', { note: 'um (masc.) / uma (fem.) = a, one' }),
            s('u3-s-meupaiprofessor', 'Meu pai é professor.', 'My father is a teacher.', { note: 'No “a” before professions: é professor.' }),
            s('u3-s-minhamae', 'Minha mãe é brasileira.', 'My mother is Brazilian.', { note: 'meu (masc.) / minha (fem.) = my' }),
          ],
        },
        {
          id: 'pt-u3-l2',
          title: 'Describing People',
          goal: 'Describe people and things',
          items: [
            w('u3-grande', 'grande', 'big', { meaningAlt: ['large'], note: 'Words ending in -e don’t change for gender.' }),
            w('u3-pequeno', 'pequeno', 'small', { alt: ['pequena'], meaningAlt: ['little'] }),
            w('u3-novo', 'novo', 'new', { alt: ['nova'], meaningAlt: ['young'] }),
            w('u3-velho', 'velho', 'old', { alt: ['velha'] }),
            w('u3-bonito', 'bonito', 'beautiful', { alt: ['bonita'], meaningAlt: ['pretty', 'handsome'] }),
            w('u3-simpatico', 'simpático', 'nice', { alt: ['simpática'], meaningAlt: ['friendly'] }),
            w('u3-muito', 'muito', 'very', { meaningAlt: ['a lot', 'much'] }),
          ],
          sentences: [
            s('u3-s-familiagrande', 'Minha família é grande.', 'My family is big.'),
            s('u3-s-irmaosimpatico', 'Meu irmão é muito simpático.', 'My brother is very nice.'),
            s('u3-s-elabonita', 'Ela é bonita.', 'She is beautiful.', { note: 'Adjectives match the noun: bonito → bonita.' }),
          ],
        },
      ],
      reading: {
        id: 'pt-u3-r',
        title: 'A família da Ana · Ana’s Family',
        sentences: [
          s('r3-1', 'Eu me chamo Ana.', 'My name is Ana.'),
          s('r3-2', 'Minha família é pequena.', 'My family is small.'),
          s('r3-3', 'Eu tenho um irmão. Ele se chama Lucas.', 'I have a brother. His name is Lucas.'),
          s('r3-4', 'O Lucas é muito simpático.', 'Lucas is very nice.', { note: 'In Brazil, names often take o / a (“the”).' }),
          s('r3-5', 'Meu pai é médico.', 'My father is a doctor.', { note: 'médico = doctor' }),
        ],
        questions: [
          { q: 'What is Ana’s family like?', options: ['Big', 'Small', 'Very big'], answer: 1 },
          { q: 'What is her brother’s name?', options: ['Lucas', 'Pedro', 'Rafael'], answer: 0 },
          { q: 'What does her father do?', options: ['He is a teacher', 'He is a student', 'He is a doctor'], answer: 2 },
        ],
      },
    },
    {
      id: 'pt-u4',
      title: 'Time & Routine',
      level: 'A1',
      canDo: ['Ask and tell the time', 'Name days and parts of the day', 'Describe your daily routine'],
      lessons: [
        {
          id: 'pt-u4-l1',
          title: 'Today & Now',
          goal: 'Talk about days and times',
          items: [
            w('u4-hoje', 'hoje', 'today'),
            w('u4-amanha', 'amanhã', 'tomorrow'),
            w('u4-ontem', 'ontem', 'yesterday'),
            w('u4-agora', 'agora', 'now'),
            w('u4-hora', 'hora', 'hour', { meaningAlt: ['time'] }),
            w('u4-manha', 'manhã', 'morning'),
            w('u4-tarde', 'tarde', 'afternoon', { meaningAlt: ['late'] }),
            w('u4-noite', 'noite', 'night', { meaningAlt: ['evening'] }),
          ],
          sentences: [
            s('u4-s-quehoras', 'Que horas são?', 'What time is it?'),
            s('u4-s-treshoras', 'São três horas.', 'It’s three o’clock.', { note: 'São for 2+ hours; “É uma hora” for 1:00.' }),
            s('u4-s-segunda', 'Hoje é segunda-feira.', 'Today is Monday.', { note: 'segunda-feira = Monday, terça = Tuesday … sábado, domingo.' }),
          ],
        },
        {
          id: 'pt-u4-l2',
          title: 'Daily Routine',
          goal: 'Say what you do each day',
          items: [
            w('u4-acordo', 'acordo', 'I wake up'),
            w('u4-trabalho', 'trabalho', 'I work', { meaningAlt: ['work', 'job'] }),
            w('u4-estudo', 'estudo', 'I study'),
            w('u4-durmo', 'durmo', 'I sleep'),
            w('u4-vou', 'vou', 'I go', { note: 'From ir (to go): eu vou, você/ele/ela vai.' }),
            w('u4-casa', 'casa', 'home', { meaningAlt: ['house'] }),
            w('u4-cedo', 'cedo', 'early'),
          ],
          sentences: [
            s('u4-s-acordocedo', 'Eu acordo cedo.', 'I wake up early.'),
            s('u4-s-vouparacasa', 'Eu vou para casa.', 'I’m going home.', { note: 'para = to (destination)' }),
            s('u4-s-estudoanoite', 'Eu estudo à noite.', 'I study at night.', { note: 'à noite = at night, de manhã = in the morning, à tarde = in the afternoon' }),
          ],
        },
      ],
      reading: {
        id: 'pt-u4-r',
        title: 'Meu dia · My Day',
        sentences: [
          s('r4-1', 'Eu acordo às sete horas.', 'I wake up at seven.', { note: 'às = at (with times)' }),
          s('r4-2', 'De manhã, eu trabalho.', 'In the morning, I work.'),
          s('r4-3', 'À tarde, eu estudo português.', 'In the afternoon, I study Portuguese.'),
          s('r4-4', 'À noite, eu volto para casa e durmo cedo.', 'At night, I go back home and sleep early.', { note: 'volto = I come back; e = and' }),
        ],
        questions: [
          { q: 'What time does the writer wake up?', options: ['6:00', '7:00', '8:00'], answer: 1 },
          { q: 'What does the writer do in the afternoon?', options: ['Studies Portuguese', 'Works', 'Sleeps'], answer: 0 },
          { q: 'What happens at night?', options: ['Goes out with friends', 'Studies', 'Goes home and sleeps early'], answer: 2 },
        ],
      },
    },
    {
      id: 'pt-u5',
      title: 'Places & Shopping',
      level: 'A1',
      canDo: ['Ask where places are', 'Say if something is near or far', 'Ask prices and pay'],
      lessons: [
        {
          id: 'pt-u5-l1',
          title: 'Where Is It?',
          goal: 'Ask for and give locations',
          items: [
            w('u5-onde', 'onde', 'where'),
            w('u5-aqui', 'aqui', 'here'),
            w('u5-ali', 'ali', 'over there', { meaningAlt: ['there'] }),
            w('u5-rua', 'rua', 'street'),
            w('u5-mercado', 'mercado', 'market', { meaningAlt: ['supermarket'] }),
            w('u5-banco', 'banco', 'bank', { meaningAlt: ['bench'] }),
            w('u5-banheiro', 'banheiro', 'bathroom', { meaningAlt: ['restroom', 'toilet'] }),
            w('u5-perto', 'perto', 'near', { meaningAlt: ['close'] }),
            w('u5-longe', 'longe', 'far'),
          ],
          sentences: [
            s('u5-s-ondebanheiro', 'Onde fica o banheiro?', 'Where is the bathroom?', { note: 'ficar = to be located (for places)' }),
            s('u5-s-mercadoperto', 'O mercado é perto.', 'The market is close.'),
            s('u5-s-bancoali', 'O banco fica ali.', 'The bank is over there.'),
          ],
        },
        {
          id: 'pt-u5-l2',
          title: 'Shopping',
          goal: 'Ask prices and pay',
          items: [
            w('u5-comprar', 'comprar', 'to buy'),
            w('u5-quanto', 'quanto', 'how much'),
            w('u5-reais', 'reais', 'reais (money)', { alt: ['real'], note: 'Brazil’s currency: 1 real, 2 reais (R$).' }),
            w('u5-caro', 'caro', 'expensive', { alt: ['cara'] }),
            w('u5-barato', 'barato', 'cheap', { alt: ['barata'] }),
            w('u5-isso', 'isso', 'that', { meaningAlt: ['this'] }),
            w('u5-cartao', 'cartão', 'card'),
          ],
          sentences: [
            s('u5-s-quantocustaisso', 'Quanto custa isso?', 'How much does that cost?'),
            s('u5-s-muitocaro', 'É muito caro!', 'It’s very expensive!'),
            s('u5-s-comprarpao', 'Eu quero comprar pão.', 'I want to buy bread.'),
          ],
        },
      ],
      reading: {
        id: 'pt-u5-r',
        title: 'No mercado · At the Market',
        sentences: [
          s('r5-1', 'A Sarah vai ao mercado.', 'Sarah goes to the market.', { note: 'vai = goes; ao = to the' }),
          s('r5-2', 'Ela quer comprar café e pão.', 'She wants to buy coffee and bread.', { note: 'quer = wants' }),
          s('r5-3', 'O café custa dez reais.', 'The coffee costs ten reais.'),
          s('r5-4', 'O pão é barato.', 'The bread is cheap.'),
          s('r5-5', 'Ela paga com cartão.', 'She pays by card.', { note: 'paga = pays' }),
        ],
        questions: [
          { q: 'Where does Sarah go?', options: ['To the bank', 'To the market', 'Home'], answer: 1 },
          { q: 'How much is the coffee?', options: ['10 reais', '5 reais', '20 reais'], answer: 0 },
          { q: 'How does she pay?', options: ['In cash', 'She doesn’t pay', 'By card'], answer: 2 },
        ],
      },
    },
    ...ptTier23Units,
  ], ptMoreLessons), [...ptMoreUnits, ...ptSectionUnits]),
}
