/*
 * Chinese measure words (classifiers): for each course noun, the classifier you use
 * with a number ("一本书"), hand-checked, plus others that are also fine.
 */

export type Classifier = { char: string; pinyin: string; use: string }
export const CLASSIFIERS: Record<string, Classifier> = {
  个: { char: '个', pinyin: 'gè', use: 'the general one: people, fruit, most things' },
  本: { char: '本', pinyin: 'běn', use: 'books and bound things' },
  只: { char: '只', pinyin: 'zhī', use: 'most animals; one of a pair' },
  条: { char: '条', pinyin: 'tiáo', use: 'long, thin things: fish, roads, rivers, trousers' },
  张: { char: '张', pinyin: 'zhāng', use: 'flat things: tables, photos, maps, tickets' },
  辆: { char: '辆', pinyin: 'liàng', use: 'vehicles' },
  件: { char: '件', pinyin: 'jiàn', use: 'clothes (tops), matters' },
  杯: { char: '杯', pinyin: 'bēi', use: 'a cup / glass of' },
  碗: { char: '碗', pinyin: 'wǎn', use: 'a bowl of' },
  部: { char: '部', pinyin: 'bù', use: 'films, phones' },
  把: { char: '把', pinyin: 'bǎ', use: 'things with a handle: chairs, umbrellas, knives' },
  台: { char: '台', pinyin: 'tái', use: 'machines: computers, TVs' },
  家: { char: '家', pinyin: 'jiā', use: 'businesses: shops, restaurants, companies' },
  所: { char: '所', pinyin: 'suǒ', use: 'schools, hospitals (institutions)' },
  位: { char: '位', pinyin: 'wèi', use: 'people (polite)' },
  双: { char: '双', pinyin: 'shuāng', use: 'pairs: eyes, shoes, chopsticks' },
  道: { char: '道', pinyin: 'dào', use: 'dishes of food, questions' },
  架: { char: '架', pinyin: 'jià', use: 'planes' },
  封: { char: '封', pinyin: 'fēng', use: 'letters, emails' },
  场: { char: '场', pinyin: 'chǎng', use: 'events: exams, matches, films showing' },
  座: { char: '座', pinyin: 'zuò', use: 'big fixed things: cities, mountains, bridges' },
  份: { char: '份', pinyin: 'fèn', use: 'portions, copies, gifts' },
}

export type MeasureWord = { noun: string; pinyin: string; gloss: string; mw: string; also?: string[] }
const m = (noun: string, pinyin: string, gloss: string, mw: string, ...also: string[]): MeasureWord => ({ noun, pinyin, gloss, mw, ...(also.length ? { also } : {}) })

export const MEASURE_WORDS: MeasureWord[] = [
  m('书', 'shū', 'book', '本'), m('人', 'rén', 'person', '个'), m('猫', 'māo', 'cat', '只'), m('狗', 'gǒu', 'dog', '只', '条'),
  m('鱼', 'yú', 'fish', '条'), m('桌子', 'zhuōzi', 'table', '张'), m('车', 'chē', 'car', '辆'), m('衣服', 'yīfu', 'item of clothing', '件'),
  m('杯子', 'bēizi', 'cup', '个', '只'), m('水', 'shuǐ', 'water', '杯', '瓶'), m('茶', 'chá', 'tea', '杯'), m('苹果', 'píngguǒ', 'apple', '个'),
  m('电影', 'diànyǐng', 'film', '部', '个', '场'), m('椅子', 'yǐzi', 'chair', '把'), m('电脑', 'diànnǎo', 'computer', '台'), m('手机', 'shǒujī', 'mobile phone', '部', '个'),
  m('路', 'lù', 'road', '条'), m('照片', 'zhàopiàn', 'photo', '张'), m('米饭', 'mǐfàn', 'rice', '碗'), m('面条', 'miàntiáo', 'noodles', '碗'),
  m('鸡蛋', 'jīdàn', 'egg', '个'), m('学校', 'xuéxiào', 'school', '所', '个'), m('医院', 'yīyuàn', 'hospital', '家', '所'), m('公司', 'gōngsī', 'company', '家'),
  m('饭店', 'fàndiàn', 'restaurant', '家'), m('商店', 'shāngdiàn', 'shop', '家'), m('银行', 'yínháng', 'bank', '家'), m('问题', 'wèntí', 'question, problem', '个', '道'),
  m('字', 'zì', 'character', '个'), m('朋友', 'péngyou', 'friend', '个', '位'), m('老师', 'lǎoshī', 'teacher', '位', '个'), m('学生', 'xuésheng', 'student', '个', '名'),
  m('眼睛', 'yǎnjing', 'eyes (a pair)', '双'), m('菜', 'cài', 'dish', '道', '个', '盘'), m('飞机', 'fēijī', 'plane', '架'), m('出租车', 'chūzūchē', 'taxi', '辆'),
  m('电视', 'diànshì', 'TV set', '台'), m('西瓜', 'xīguā', 'watermelon', '个'), m('鸡', 'jī', 'chicken', '只'), m('地图', 'dìtú', 'map', '张'),
  m('邮件', 'yóujiàn', 'email', '封'), m('考试', 'kǎoshì', 'exam', '场', '次', '个'), m('医生', 'yīshēng', 'doctor', '位', '个', '名'), m('城市', 'chéngshì', 'city', '座', '个'),
  m('礼物', 'lǐwù', 'gift', '份', '个', '件'), m('哥哥', 'gēge', 'older brother', '个'), m('公园', 'gōngyuán', 'park', '个', '座'),
]
