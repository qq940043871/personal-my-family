// ============================================================
// 题目生成工具 - uni-app 适配版
// ============================================================
import {
  getCharactersByLesson, getCharactersByBook,
  getAllWords, getWordsContaining,
  shuffle, pickWrongAnswers
} from '@/data/chinese-data.js';

// 部首映射表
const radicalMap = {
  '\u6c35': '三点水', '\u624c': '提手旁', '\u4ebb': '单人旁', '\u53e3': '口字旁',
  '\u6728': '木字旁', '\u706b': '火字旁', '\u65e5': '日字旁', '\u6708': '月字旁',
  '\u9485': '金字旁', '\u7e9f': '绞丝旁', '\u8279': '草字头', '\u5ba0': '宝盖头',
  '\u8fb6': '走之底', '\u5973': '女字旁', '\u738b': '王字旁', '\u77f3': '石字旁',
  '\u571f': '提土旁', '\u5fc4': '竖心旁', '\u9963': '食字旁', '\u72ad': '反犬旁',
  '\u5f84': '双人旁', '\u5c71': '山字旁', '\u866b': '虫字旁',
  '\u9e1f': '鸟字旁', '\u9a6c': '马字旁', '\u9c7c': '鱼字旁', '\u8f66': '车字旁',
  '\u8ba0': '言字旁', '\u51ab': '两点水', '\u5235': '立刀旁', '\u529b': '力字旁',
  '\u53c8': '又字旁', '\u961d': '双耳旁', '\u5e7f': '广字头', '\u7592': '病字头',
  '\u95e8': '门字框', '\u5c38': '尸字头'
};

/** 1. 看字选拼音 */
export function generateReadPinyin(chars, count = 6) {
  const selected = shuffle(chars).slice(0, count);
  return selected.map(c => {
    const wrongPinyins = pickWrongAnswers(chars, c.char, 3)
      .map(wc => {
        const found = chars.find(ch => ch.char === wc);
        return found ? found.pinyin : '';
      })
      .filter(p => p && p !== c.pinyin);
    return {
      type: 'readPinyin',
      prompt: '这个字读什么？',
      char: c.char,
      correct: c.pinyin,
      wrong: wrongPinyins.slice(0, 3),
      meta: `第${c.lesson}课`
    };
  }).filter(q => q.wrong.length >= 2);
}

/** 2. 看拼音选字 */
export function generatePickChar(chars, count = 6) {
  const selected = shuffle(chars).slice(0, count);
  return selected.map(c => {
    const wrongChars = pickWrongAnswers(chars, c.char, 3);
    return {
      type: 'pickChar',
      prompt: '这个拼音对应的字是？',
      pinyin: c.pinyin,
      correct: c.char,
      wrong: wrongChars.slice(0, 3),
      meta: `第${c.lesson}课`
    };
  }).filter(q => q.wrong.length >= 2);
}

/** 3. 找偏旁部首 */
export function generateRadical(chars, count = 6) {
  const withRadicals = chars.filter(c => {
    for (const rad in radicalMap) {
      if (c.char.includes(rad)) return true;
    }
    return false;
  });
  const selected = shuffle(withRadicals).slice(0, count);
  return selected.map(c => {
    let radical = '';
    for (const rad in radicalMap) {
      if (c.char.includes(rad)) { radical = rad; break; }
    }
    if (!radical) return null;
    const wrongRadicals = shuffle(
      Object.keys(radicalMap).filter(r => r !== radical)
    ).slice(0, 3);
    return {
      type: 'radical',
      prompt: `"${c.char}"的偏旁部首是？`,
      char: c.char,
      correct: radical,
      wrong: wrongRadicals,
      radicalName: radicalMap[radical] || ''
    };
  }).filter(q => q !== null && q.wrong.length >= 2);
}

/** 4. 词语填空 */
export function generateWordFill(chars, count = 6) {
  const words = getAllWords();
  const selected = shuffle(words).slice(0, count);
  return selected.map(word => {
    const pos = Math.floor(Math.random() * word.length);
    const blankChar = word[pos];
    const blanked = word.slice(0, pos) + '_' + word.slice(pos + 1);
    const wrongChars = pickWrongAnswers(chars, blankChar, 3);
    return {
      type: 'wordFill',
      prompt: '填入正确的字',
      blanked: blanked,
      correct: blankChar,
      wrong: wrongChars.slice(0, 3),
      fullWord: word
    };
  }).filter(q => q.wrong.length >= 2);
}

/** 5. 组词 */
export function generateMakeWord(chars, count = 6) {
  const selected = shuffle(chars).slice(0, count);
  return selected.map(c => {
    const containing = getWordsContaining(c.char);
    if (containing.length < 2) return null;
    const correct = shuffle(containing)[0];
    const otherWords = getAllWords().filter(w => !w.includes(c.char));
    const wrong = shuffle(otherWords).slice(0, 3);
    return {
      type: 'makeWord',
      prompt: `"${c.char}"可以组成哪个词语？`,
      char: c.char,
      correct: correct,
      wrong: wrong.slice(0, 3)
    };
  }).filter(q => q !== null && q.wrong.length >= 2);
}

/** 混合生成多种题型 */
export function generateMixed(chars, count = 8) {
  const generators = [
    () => generateReadPinyin(chars, 2),
    () => generatePickChar(chars, 2),
    () => generateRadical(chars, 2),
    () => generateWordFill(chars, 2),
    () => generateMakeWord(chars, 2)
  ];
  let questions = [];
  const shuffled = shuffle(generators);
  for (let i = 0; i < Math.ceil(count / 2); i++) {
    const gen = shuffled[i % shuffled.length];
    questions = questions.concat(gen());
  }
  return shuffle(questions).slice(0, count);
}

/** 按课程生成题目 */
export function generateByLesson(book, lesson, count = 8) {
  const chars = getCharactersByLesson(book, lesson);
  if (chars.length === 0) return [];
  return generateMixed(chars, Math.min(count, chars.length));
}

/** 获取所有课程列表 */
export function getLessonList(book) {
  const chars = getCharactersByBook(book);
  const lessons = {};
  chars.forEach(c => {
    const key = `${c.type}_${c.lesson}`;
    if (!lessons[key]) {
      lessons[key] = {
        type: c.type,
        lesson: c.lesson,
        charCount: 0,
        sampleChars: []
      };
    }
    lessons[key].charCount++;
    if (lessons[key].sampleChars.length < 3) {
      lessons[key].sampleChars.push(c.char);
    }
  });
  return Object.values(lessons).sort((a, b) => {
    if (a.type === b.type) return a.lesson - b.lesson;
    const order = { '阅读': 0, '识字': 1, '语文园地': 2 };
    return order[a.type] - order[b.type];
  });
}
