import type { Story } from './types'

export const PT_STORIES: Story[] = [
  {
    id: 'story:pt-padaria', lang: 'pt', emoji: '🥐', title: 'Na padaria', titleMeaning: 'At the bakery', level: 'A1',
    scenes: [
      {
        lines: [
          { speaker: 'Atendente', target: 'Bom dia! O que você deseja?', meaning: 'Good morning! What would you like?' },
          { speaker: 'Lucas', target: 'Bom dia! Eu quero cinco pães, por favor.', meaning: 'Good morning! I’d like five bread rolls, please.' },
          { speaker: 'Atendente', target: 'Mais alguma coisa?', meaning: 'Anything else?' },
        ],
        question: { q: 'How many rolls does Lucas want?', options: ['Three', 'Five', 'Ten'], answer: 1 },
      },
      {
        lines: [
          { speaker: 'Lucas', target: 'Sim, um café com leite.', meaning: 'Yes, a coffee with milk.' },
          { speaker: 'Atendente', target: 'Pequeno ou grande?', meaning: 'Small or large?' },
          { speaker: 'Lucas', target: 'Grande, por favor. Estou com muito sono!', meaning: 'Large, please. I’m really sleepy!' },
        ],
        question: { q: 'Why does Lucas want a large coffee?', options: ['He’s sleepy', 'He’s cold', 'He’s hungry'], answer: 0 },
      },
      {
        lines: [
          { speaker: 'Atendente', target: 'São doze reais.', meaning: 'That’s twelve reais.' },
          { speaker: 'Lucas', target: 'Aqui está. Obrigado!', meaning: 'Here you are. Thanks!' },
          { speaker: 'Atendente', target: 'De nada. Tenha um bom dia!', meaning: 'You’re welcome. Have a good day!' },
        ],
        question: { q: 'How much does Lucas pay?', options: ['Ten reais', 'Twelve reais', 'Twenty reais'], answer: 1 },
      },
    ],
    glossary: {
      'bom dia': 'good morning', 'o que': 'what', 'você': 'you', 'deseja': 'would like (polite)', 'eu': 'I', 'quero': 'I want', 'cinco': 'five',
      'pães': 'bread rolls', 'por favor': 'please', 'mais alguma coisa': 'anything else', 'sim': 'yes', 'café com leite': 'coffee with milk',
      'pequeno': 'small', 'ou': 'or', 'grande': 'large', 'estou com': 'I have / I feel (estou com sono: I’m sleepy)', 'sono': 'sleepiness', 'muito': 'very, really', 'são': 'it’s, they are',
      'doze': 'twelve', 'reais': 'reais (Brazilian money)', 'aqui está': 'here you are', 'obrigado': 'thank you (said by a man)',
      'de nada': 'you’re welcome', 'tenha um bom dia': 'have a good day',
    },
  },
  {
    id: 'story:pt-parque', lang: 'pt', emoji: '🌳', title: 'No parque', titleMeaning: 'At the park', level: 'A1',
    scenes: [
      {
        lines: [
          { speaker: 'Ana', target: 'Oi, Pedro! Tudo bem?', meaning: 'Hi, Pedro! How’s it going?' },
          { speaker: 'Pedro', target: 'Tudo ótimo! E você?', meaning: 'All great! And you?' },
          { speaker: 'Ana', target: 'Tudo bem. Que dia lindo, né?', meaning: 'Good. What a beautiful day, isn’t it?' },
        ],
        question: { q: 'What is the day like?', options: ['Rainy', 'Beautiful', 'Cold'], answer: 1 },
      },
      {
        lines: [
          { speaker: 'Pedro', target: 'Vamos jogar futebol?', meaning: 'Shall we play football?' },
          { speaker: 'Ana', target: 'Agora não. Estou com fome.', meaning: 'Not now. I’m hungry.' },
          { speaker: 'Pedro', target: 'Então vamos tomar um sorvete!', meaning: 'Then let’s have an ice cream!' },
        ],
        question: { q: 'Why doesn’t Ana want to play right now?', options: ['She’s tired', 'She’s hungry', 'She’s busy'], answer: 1 },
      },
      {
        lines: [
          { speaker: 'Ana', target: 'Boa ideia! Eu gosto de sorvete de chocolate.', meaning: 'Good idea! I like chocolate ice cream.' },
          { speaker: 'Pedro', target: 'Eu prefiro de morango.', meaning: 'I prefer strawberry.' },
          { speaker: 'Ana', target: 'Depois a gente joga futebol.', meaning: 'Afterwards we’ll play football.' },
        ],
        question: { q: 'Which flavour does Pedro prefer?', options: ['Chocolate', 'Vanilla', 'Strawberry'], answer: 2 },
      },
    ],
    glossary: {
      'oi': 'hi', 'tudo bem': 'how’s it going / all good', 'tudo ótimo': 'all great', 'e você': 'and you', 'que dia lindo': 'what a beautiful day',
      'né': 'right? (informal)', 'vamos': 'let’s', 'jogar': 'play', 'futebol': 'football (soccer)', 'agora não': 'not now',
      'estou com fome': 'I’m hungry', 'então': 'then, so', 'tomar um sorvete': 'have an ice cream', 'boa ideia': 'good idea',
      'eu gosto de': 'I like', 'sorvete': 'ice cream', 'chocolate': 'chocolate', 'eu prefiro': 'I prefer', 'morango': 'strawberry',
      'depois': 'afterwards', 'a gente': 'we (informal)', 'joga': 'plays',
    },
  },
]
