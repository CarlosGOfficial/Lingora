/** Portuguese: a third lesson for units 2–9, continuing each unit's theme. */
import type { GrammarExample, GrammarPoint, Item, Lesson } from './types'

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

const ex = (target: string, meaning: string): GrammarExample => ({ target, meaning })

export const ptMoreLessons: Record<string, Lesson[]> = {
  'pt-u2': [
    {
      id: 'pt-u2-l3',
      title: 'At the Café',
      goal: 'Order food and ask for the bill',
      items: [
        w('u2-cardapio', 'cardápio', 'menu'),
        w('u2-suco', 'suco', 'juice'),
        w('u2-leite', 'leite', 'milk'),
        w('u2-arroz', 'arroz', 'rice'),
        w('u2-feijao', 'feijão', 'beans'),
        w('u2-conta', 'conta', 'bill', { meaningAlt: ['check'] }),
        w('u2-gostoso', 'gostoso', 'delicious', { alt: ['gostosa'], meaningAlt: ['tasty'] }),
      ],
      sentences: [
        s('u2-s-acontaporfavor', 'A conta, por favor.', 'The bill, please.'),
        s('u2-s-queroumsuco', 'Eu quero um suco.', 'I want a juice.'),
        s('u2-s-paogostoso', 'O pão é gostoso.', 'The bread is tasty.'),
      ],
    },
  ],
  'pt-u3': [
    {
      id: 'pt-u3-l3',
      title: 'The Wider Family',
      goal: 'Talk about relatives and partners',
      items: [
        w('u3-avo-m', 'avô', 'grandfather', { meaningAlt: ['grandpa'], note: 'avô (closed ô) is grandfather; avó (open ó) is grandmother.' }),
        w('u3-avo-f', 'avó', 'grandmother', { meaningAlt: ['grandma'] }),
        w('u3-tio', 'tio', 'uncle'),
        w('u3-tia', 'tia', 'aunt'),
        w('u3-primo', 'primo', 'cousin', { alt: ['prima'] }),
        w('u3-marido', 'marido', 'husband'),
        w('u3-esposa', 'esposa', 'wife'),
        w('u3-namorado', 'namorado', 'boyfriend', { alt: ['namorada'], meaningAlt: ['girlfriend'] }),
      ],
      sentences: [
        s('u3-s-minhaavo', 'Minha avó é muito simpática.', 'My grandmother is very nice.'),
        s('u3-s-doisprimos', 'Eu tenho dois primos.', 'I have two cousins.'),
        s('u3-s-tiomora', 'O meu tio mora no Brasil.', 'My uncle lives in Brazil.', { note: 'mora = lives; no = em + o' }),
      ],
    },
  ],
  'pt-u4': [
    {
      id: 'pt-u4-l3',
      title: 'The Week',
      goal: 'Name the days and plan your week',
      items: [
        w('u4-segunda', 'segunda', 'Monday', { alt: ['segunda-feira'] }),
        w('u4-terca', 'terça', 'Tuesday', { alt: ['terça-feira'] }),
        w('u4-quarta', 'quarta', 'Wednesday', { alt: ['quarta-feira'] }),
        w('u4-quinta', 'quinta', 'Thursday', { alt: ['quinta-feira'] }),
        w('u4-sexta', 'sexta', 'Friday', { alt: ['sexta-feira'] }),
        w('u4-sabado', 'sábado', 'Saturday'),
        w('u4-domingo', 'domingo', 'Sunday'),
        w('u4-semana', 'semana', 'week'),
      ],
      sentences: [
        s('u4-s-hojesabado', 'Hoje é sábado.', 'Today is Saturday.'),
        s('u4-s-segundaasexta', 'Eu trabalho de segunda a sexta.', 'I work from Monday to Friday.'),
        s('u4-s-domingodurmo', 'No domingo eu durmo muito.', 'On Sunday I sleep a lot.'),
      ],
    },
  ],
  'pt-u5': [
    {
      id: 'pt-u5-l3',
      title: 'Getting Around',
      goal: 'Say how you travel and follow directions',
      items: [
        w('u5-onibus', 'ônibus', 'bus'),
        w('u5-metro', 'metrô', 'subway', { meaningAlt: ['metro', 'underground'] }),
        w('u5-taxi', 'táxi', 'taxi'),
        w('u5-carro', 'carro', 'car'),
        w('u5-ape', 'a pé', 'on foot'),
        w('u5-esquerda', 'esquerda', 'left'),
        w('u5-direita', 'direita', 'right'),
        w('u5-reto', 'reto', 'straight ahead', { meaningAlt: ['straight'] }),
      ],
      sentences: [
        s('u5-s-voudeonibus', 'Eu vou de ônibus.', 'I’m going by bus.'),
        s('u5-s-viredireita', 'Vire à direita.', 'Turn right.', { note: 'vire = turn (command)' }),
        s('u5-s-sigareto', 'Siga reto.', 'Go straight ahead.', { note: 'siga = keep going (command)' }),
      ],
    },
  ],
  'pt-u6': [
    {
      id: 'pt-u6-l3',
      title: 'Making Plans',
      goal: 'Invite friends and make plans',
      items: [
        w('u6-convite', 'convite', 'invitation'),
        w('u6-festa', 'festa', 'party'),
        w('u6-cinema', 'cinema', 'cinema', { meaningAlt: ['movie theater'] }),
        w('u6-encontrar', 'encontrar', 'to meet', { meaningAlt: ['to find'] }),
        w('u6-combinar', 'combinar', 'to arrange', { meaningAlt: ['to agree on'] }),
        w('u6-ligar', 'ligar', 'to call', { meaningAlt: ['to phone'] }),
        w('u6-aniversario', 'aniversário', 'birthday'),
        w('u6-claro', 'claro', 'of course', { meaningAlt: ['sure'] }),
      ],
      sentences: [
        s('u6-s-vamosaocinema', 'Vamos ao cinema?', 'Shall we go to the cinema?'),
        s('u6-s-eutelligo', 'Eu te ligo amanhã.', 'I’ll call you tomorrow.'),
        s('u6-s-clarocombinado', 'Claro, combinado!', 'Of course, it’s a deal!', { note: 'combinado = agreed (a very common Brazilian “OK!”)' }),
      ],
    },
  ],
  'pt-u7': [
    {
      id: 'pt-u7-l3',
      title: 'In the Clothes Shop',
      goal: 'Try things on and ask about colours',
      items: [
        w('u7-provador', 'provador', 'fitting room'),
        w('u7-experimentar', 'experimentar', 'to try on', { meaningAlt: ['to try'] }),
        w('u7-cor', 'cor', 'colour', { meaningAlt: ['color'] }),
        w('u7-azul', 'azul', 'blue'),
        w('u7-vermelho', 'vermelho', 'red', { alt: ['vermelha'] }),
        w('u7-preto', 'preto', 'black', { alt: ['preta'] }),
        w('u7-branco', 'branco', 'white', { alt: ['branca'] }),
        w('u7-desconto', 'desconto', 'discount'),
      ],
      sentences: [
        s('u7-s-possoexperimentar', 'Posso experimentar?', 'Can I try it on?'),
        s('u7-s-tememazul', 'Tem em azul?', 'Do you have it in blue?', { note: 'tem = there is / do you have (very common in Brazil)' }),
        s('u7-s-temdesconto', 'Tem desconto?', 'Is there a discount?'),
      ],
    },
  ],
  'pt-u8': [
    {
      id: 'pt-u8-l3',
      title: 'Projects & Deadlines',
      goal: 'Talk about tasks and problems at work',
      items: [
        w('u8-prazo', 'prazo', 'deadline'),
        w('u8-projeto', 'projeto', 'project'),
        w('u8-equipe', 'equipe', 'team'),
        w('u8-cliente', 'cliente', 'client', { meaningAlt: ['customer'] }),
        w('u8-resolver', 'resolver', 'to solve', { meaningAlt: ['to sort out'] }),
        w('u8-problema', 'problema', 'problem', { note: 'Masculine despite the -a: o problema.' }),
        w('u8-responder', 'responder', 'to reply', { meaningAlt: ['to answer'] }),
        w('u8-enviar', 'enviar', 'to send'),
      ],
      sentences: [
        s('u8-s-prazosexta', 'O prazo é sexta-feira.', 'The deadline is Friday.'),
        s('u8-s-vouenviar', 'Vou enviar o relatório hoje.', 'I’ll send the report today.', { note: 'relatório = report' }),
        s('u8-s-resolverproblema', 'Precisamos resolver esse problema.', 'We need to solve this problem.'),
      ],
    },
  ],
  'pt-u9': [
    {
      id: 'pt-u9-l3',
      title: 'Hopes & Advice',
      goal: 'Talk about the future and give advice',
      items: [
        w('u9-espero', 'espero', 'I hope', { meaningAlt: ['I wait'] }),
        w('u9-sonho', 'sonho', 'dream'),
        w('u9-futuro', 'futuro', 'future'),
        w('u9-mudar', 'mudar', 'to change', { meaningAlt: ['to move'] }),
        w('u9-tentar', 'tentar', 'to try'),
        w('u9-conselho', 'conselho', 'advice'),
        w('u9-deveria', 'deveria', 'should'),
        w('u9-desistir', 'desistir', 'to give up'),
      ],
      sentences: [
        s('u9-s-esperoquede', 'Espero que dê tudo certo.', 'I hope everything works out.', { note: 'dê = subjunctive of dar (to give)' }),
        s('u9-s-voceeveria', 'Você deveria descansar.', 'You should rest.'),
        s('u9-s-naodesista', 'Não desista!', 'Don’t give up!'),
      ],
    },
  ],
}

export const ptMoreGrammar: Record<string, GrammarPoint[]> = {
  'pt-u2-l3': [
    {
      title: 'Ordering politely',
      explanation: 'Eu queria… (“I’d like…”) is softer than Eu quero…. In cafés you’ll also hear the casual Me vê… (“get me…”).',
      examples: [ex('Eu queria um suco.', 'I’d like a juice.'), ex('Me vê um café, por favor.', 'A coffee, please.')],
    },
    {
      title: 'Food takes an article',
      explanation: 'When you talk about food in general, Portuguese keeps the article: o arroz, o feijão, a água.',
      examples: [ex('O arroz e o feijão são gostosos.', 'Rice and beans are tasty.')],
    },
  ],
  'pt-u3-l3': [
    {
      title: 'Plural possessives',
      pattern: 'meus / minhas + plural noun',
      explanation: 'meu and minha add -s in the plural. The masculine plural also covers mixed groups.',
      examples: [ex('Meus avós moram aqui.', 'My grandparents live here.'), ex('Minhas tias são simpáticas.', 'My aunts are nice.')],
    },
    {
      title: 'Optional article with possessives',
      explanation: 'In Brazil you can say minha mãe or a minha mãe — both are correct.',
      examples: [ex('A minha avó é brasileira.', 'My grandmother is Brazilian.')],
    },
  ],
  'pt-u4-l3': [
    {
      title: 'On a day: na / no',
      explanation: 'Weekdays ending in -feira are feminine (na segunda), while sábado and domingo are masculine (no sábado).',
      examples: [ex('Na sexta eu vou ao cinema.', 'On Friday I’m going to the cinema.'), ex('No domingo eu descanso.', 'On Sunday I rest.')],
    },
    {
      title: 'From … to …: de … a …',
      explanation: 'de … a … marks a range of days or times.',
      examples: [ex('de segunda a sexta', 'from Monday to Friday')],
    },
  ],
  'pt-u5-l3': [
    {
      title: 'Travelling: de + vehicle',
      pattern: 'ir de ônibus / de carro / a pé',
      explanation: 'Use de with vehicles, but say a pé for on foot.',
      examples: [ex('Eu vou de metrô.', 'I go by subway.'), ex('Eu vou a pé.', 'I walk there.')],
    },
    {
      title: 'Directions as commands',
      explanation: 'Directions use the command form: vire (turn), siga (keep going), pegue (take).',
      examples: [ex('Pegue o ônibus.', 'Take the bus.'), ex('Vire à esquerda.', 'Turn left.')],
    },
  ],
  'pt-u6-l3': [
    {
      title: 'Let’s: vamos + infinitive',
      explanation: 'vamos + an infinitive is the easiest way to suggest something.',
      examples: [ex('Vamos comer!', 'Let’s eat!'), ex('Vamos à festa?', 'Shall we go to the party?')],
    },
    {
      title: 'te before the verb',
      explanation: 'In Brazil, object pronouns like te (you) usually go before the verb.',
      examples: [ex('Eu te encontro lá.', 'I’ll meet you there.'), ex('Eu te amo.', 'I love you.')],
    },
  ],
  'pt-u7-l3': [
    {
      title: 'Can I…? posso + infinitive',
      explanation: 'posso (I can) + an infinitive is a polite way to ask permission.',
      examples: [ex('Posso ver?', 'Can I see?'), ex('Posso pagar com cartão?', 'Can I pay by card?')],
    },
    {
      title: 'Colours agree',
      explanation: 'Most colours change for gender (vermelho / vermelha), but azul stays the same for both.',
      examples: [ex('uma camisa vermelha', 'a red shirt'), ex('um sapato azul', 'a blue shoe')],
    },
  ],
  'pt-u8-l3': [
    {
      title: 'Polite requests: poderia…?',
      pattern: 'poderia + infinitive',
      explanation: 'poderia (could you) is the polite choice for requests at work.',
      examples: [ex('Poderia me enviar o arquivo?', 'Could you send me the file?'), ex('Poderia repetir?', 'Could you repeat that?')],
    },
    {
      title: 'Object pronouns: spoken vs written',
      explanation: 'In speech, Brazilians use ele / ela after the verb. In writing, o / a goes before it.',
      examples: [ex('Eu vi ele ontem.', 'I saw him yesterday. (spoken)'), ex('Eu o vi ontem.', 'I saw him yesterday. (written)')],
    },
  ],
  'pt-u9-l3': [
    {
      title: 'Hoping: espero que + subjunctive',
      explanation: 'Wishes and hopes need the subjunctive after que.',
      examples: [ex('Espero que você venha.', 'I hope you come.')],
    },
    {
      title: 'Advice: deveria + infinitive',
      explanation: 'deveria (should) softens advice. It’s the conditional of dever (must).',
      examples: [ex('Eu deveria estudar mais.', 'I should study more.')],
    },
  ],
}
