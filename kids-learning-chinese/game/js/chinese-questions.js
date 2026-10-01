// ============================================================
// 题目生成模块 - 从数据生成各类题目
// 支持专项练习：识字表 / 写字表 / 词语表
// ============================================================
const CHINESE_QUESTIONS = (function() {
  const D = CHINESE_DATA;

  // ==================== QUESTION TYPES ====================

  /** Type 1: 看字选拼音 (Character → Pinyin) */
  function generateReadPinyin(chars, poolSize) {
    const selected = D.shuffle(chars).slice(0, poolSize || 6);
    return selected.map(c => {
      const wrongPinyins = D.pickWrongAnswers(chars, c.char, 3)
        .map(wc => {
          const found = chars.find(ch => ch.char === wc);
          return found ? found.pinyin : '';
        })
        .filter(p => p && p !== c.pinyin);
      return {
        type: 'readPinyin',
        char: c.char,
        correct: c.pinyin,
        wrong: wrongPinyins.slice(0, 3),
        meta: `第${c.lesson}课`
      };
    }).filter(q => q.wrong.length >= 2);
  }

  /** Type 2: 看拼音选字 (Pinyin → Character) */
  function generatePickChar(chars, poolSize) {
    const selected = D.shuffle(chars).slice(0, poolSize || 6);
    return selected.map(c => {
      const wrongChars = D.pickWrongAnswers(chars, c.char, 3);
      return {
        type: 'pickChar',
        pinyin: c.pinyin,
        correct: c.char,
        wrong: wrongChars.slice(0, 3),
        meta: `第${c.lesson}课`
      };
    }).filter(q => q.wrong.length >= 2);
  }

  /** Type 3: 听音选字 */
  function generateListenChar(chars, poolSize) {
    return generatePickChar(chars, poolSize).map(q => ({
      ...q,
      type: 'listenChar'
    }));
  }

  /** Type 4: 找偏旁部首 */
  function generateRadical(chars, poolSize) {
    // Chinese character radicals
    const radicalMap = {
      '氵': '三点水', '扌': '提手旁', '亻': '单人旁', '口': '口字旁',
      '木': '木字旁', '火': '火字旁', '日': '日字旁', '月': '月字旁',
      '钅': '金字旁', '纟': '绞丝旁', '艹': '草字头', '宀': '宝盖头',
      '辶': '走之底', '女': '女字旁', '王': '王字旁', '石': '石字旁',
      '土': '提土旁', '忄': '竖心旁', '饣': '食字旁', '犭': '反犬旁',
      '忄': '竖心旁', '彳': '双人旁', '山': '山字旁', '虫': '虫字旁',
      '鸟': '鸟字旁', '马': '马字旁', '鱼': '鱼字旁', '车': '车字旁',
      '讠': '言字旁', '冫': '两点水', '刂': '立刀旁', '力': '力字旁',
      '又': '又字旁', '阝': '双耳旁', '广': '广字头', '疒': '病字头',
      '门': '门字框', '尸': '尸字头', '囗': '方框', '忄': '竖心旁'
    };

    // Simple radical extraction: look for known radicals in characters
    const withRadicals = chars.filter(c => {
      for (const rad in radicalMap) {
        if (c.char.includes(rad)) return true;
      }
      return false;
    });

    const selected = D.shuffle(withRadicals).slice(0, poolSize || 6);
    return selected.map(c => {
      let radical = '';
      for (const rad in radicalMap) {
        if (c.char.includes(rad)) {
          radical = rad;
          break;
        }
      }
      if (!radical) radical = c.char[0]; // fallback: first component

      const wrongRadicals = D.shuffle(
        Object.keys(radicalMap).filter(r => r !== radical)
      ).slice(0, 3);

      return {
        type: 'radical',
        char: c.char,
        question: `"${c.char}"的偏旁部首是？`,
        correct: radical,
        wrong: wrongRadicals,
        radicalName: radicalMap[radical] || ''
      };
    }).filter(q => q.wrong.length >= 2);
  }

  /** Type 5: 词语填空 (Fill in the missing character in a word) */
  function generateWordFill(chars, wordCount) {
    const words = D.getAllWords();
    const selected = D.shuffle(words).slice(0, wordCount || 6);
    return selected.map(word => {
      // Pick a random character position to blank out
      const pos = Math.floor(Math.random() * word.length);
      const blankChar = word[pos];
      const blanked = word.slice(0, pos) + '___' + word.slice(pos + 1);

      const wrongChars = D.pickWrongAnswers(chars, blankChar, 3);

      return {
        type: 'wordFill',
        blanked: blanked,
        correct: blankChar,
        wrong: wrongChars.slice(0, 3),
        fullWord: word
      };
    }).filter(q => q.wrong.length >= 2);
  }

  /** Type 6: 组词 (Make a word using the given character) */
  function generateMakeWord(chars, poolSize) {
    const selected = D.shuffle(chars).slice(0, poolSize || 6);
    return selected.map(c => {
      // Find words containing this character
      const containing = D.getWordsContaining(c.char);
      if (containing.length < 2) return null;

      const correct = D.shuffle(containing)[0];
      // Pick wrong words that DON'T include the character
      const otherWords = D.getAllWords()
        .filter(w => !w.includes(c.char));
      const wrong = D.shuffle(otherWords).slice(0, 3);

      return {
        type: 'makeWord',
        char: c.char,
        question: `"${c.char}"可以组成哪个词语？`,
        correct: correct,
        wrong: wrong.slice(0, 3)
      };
    }).filter(q => q !== null && q.wrong.length >= 2);
  }

  // ==================== MIXED QUESTION GENERATOR ====================

  /** Generate a mixed set of questions from all types */
  function generateMixed(chars, count) {
    const generators = [
      () => generateReadPinyin(chars, 2),
      () => generatePickChar(chars, 2),
      () => generateRadical(chars, 2),
      () => generateWordFill(chars, 2),
      () => generateMakeWord(chars, 2)
    ];

    let questions = [];
    const shuffled = D.shuffle(generators);
    for (let i = 0; i < Math.ceil(count / 2); i++) {
      const gen = shuffled[i % shuffled.length];
      const qs = gen();
      questions = questions.concat(qs);
    }
    return D.shuffle(questions).slice(0, count);
  }

  /** Generate questions for a specific lesson */
  function generateByLesson(book, lesson, count) {
    const chars = D.getCharactersByLesson(book, lesson);
    if (chars.length === 0) return [];
    return generateMixed(chars, Math.min(count, chars.length));
  }

  /** Generate questions for a whole book, grouped by lesson */
  function generateByBook(book, questionsPerLesson) {
    const chars = D.getCharactersByBook(book);
    const byLesson = {};
    chars.forEach(c => {
      const key = `${c.type}_${c.lesson}`;
      if (!byLesson[key]) byLesson[key] = [];
      byLesson[key].push(c);
    });

    let allQuestions = [];
    Object.values(byLesson).forEach(lessonChars => {
      const qs = generateMixed(lessonChars, questionsPerLesson || 4);
      allQuestions = allQuestions.concat(qs);
    });
    return D.shuffle(allQuestions);
  }

  // ==================== 专项练习：识字表 / 写字表 / 词语表 ====================

  /** 识字表专项 — 只使用识字表中的生字出题 */
  function generateRecognitionExercises(book, count) {
    const chars = D.getRecognitionChars(book);
    return generateMixed(chars, count || 8);
  }

  /** 写字表专项 — 只使用写字表中的生字出题 */
  function generateWritingExercises(book, count) {
    const chars = D.getWritingChars(book);
    return generateMixed(chars, count || 8);
  }

  /** 词语表专项 — 词语填空和组词练习 */
  function generateWordExercises(book, count) {
    const chars = D.getCharactersByBook(book);
    const wordCount = Math.floor((count || 8) / 2);
    let qs = generateWordFill(chars, wordCount);
    qs = qs.concat(generateMakeWord(chars, wordCount));
    return D.shuffle(qs).slice(0, count || 8);
  }

  /** 按课程生成专项练习 */
  function generateByLessonType(book, lesson, tableType, count) {
    let chars;
    if (tableType === 'recognition') {
      chars = D.getRecognitionByLesson(book, lesson);
    } else if (tableType === 'writing') {
      chars = D.getWritingByLesson(book, lesson);
    } else {
      chars = D.getCharactersByLesson(book, lesson);
    }
    if (chars.length === 0) return [];
    return generateMixed(chars, Math.min(count || 6, chars.length));
  }

  return {
    generateReadPinyin,
    generatePickChar,
    generateListenChar,
    generateRadical,
    generateWordFill,
    generateMakeWord,
    generateMixed,
    generateByLesson,
    generateByBook,
    generateRecognitionExercises,
    generateWritingExercises,
    generateWordExercises,
    generateByLessonType
  };
})();
