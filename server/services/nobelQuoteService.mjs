/**
 * 诺贝尔文学奖经典名言智库与每日确定性派发服务
 * (Nobel Prize in Literature Quotes Archive & Daily Deterministic Engine)
 */

export const NOBEL_QUOTES_ARCHIVE = [
  {
    year: '1957 诺贝尔文学奖',
    author: '阿尔贝·加缪',
    work: '夏天集',
    enAuthor: 'Albert Camus',
    enWork: 'Summer',
    zh: '“在隆冬，我终于知道，我身上有一个不可战胜的夏天。”',
    en: '“In the depth of winter, I finally learned that within me there lay an invincible summer.”'
  },
  {
    year: '1982 诺贝尔文学奖',
    author: '加西亚·马尔克斯',
    work: '百年孤独',
    enAuthor: 'Gabriel García Márquez',
    enWork: 'One Hundred Years of Solitude',
    zh: '“多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起父亲带他去见识冰块的那个遥远的下午。”',
    en: '“Many years later, as he faced the firing squad, Colonel Aureliano Buendía was to remember that distant afternoon when his father took him to discover ice.”'
  },
  {
    year: '1954 诺贝尔文学奖',
    author: '欧内斯特·海明威',
    work: '老人与海',
    enAuthor: 'Ernest Hemingway',
    enWork: 'The Old Man and the Sea',
    zh: '“人不是为了失败而生的。一个人可以被毁灭，但绝不能被击败。”',
    en: '“Man is not made for defeat. A man can be destroyed but not defeated.”'
  },
  {
    year: '1993 诺贝尔文学奖',
    author: '托妮·莫里森',
    work: '所罗门之歌',
    enAuthor: 'Toni Morrison',
    enWork: 'Song of Solomon',
    zh: '“要想展翅高飞，就必须抛弃那些拖累你的沉重负荷。”',
    en: '“If you wanna fly, you got to give up the stuff that weighs you down.”'
  },
  {
    year: '2016 诺贝尔文学奖',
    author: '鲍勃·迪伦',
    work: '答案在风中飘',
    enAuthor: 'Bob Dylan',
    enWork: 'Blowin\' in the Wind',
    zh: '“不忙着求生的人，便忙着死去。”',
    en: '“He not busy being born is busy dying.”'
  },
  {
    year: '1946 诺贝尔文学奖',
    author: '赫尔曼·黑塞',
    work: '悉达多',
    enAuthor: 'Hermann Hesse',
    enWork: 'Siddhartha',
    zh: '“知识可以传授，但智慧不能。一个人可以找到智慧，在智慧中生活，但却无法言说和传授智慧。”',
    en: '“Knowledge can be communicated, but not wisdom. One can find it, live it, but cannot speak or teach it.”'
  },
  {
    year: '1968 诺贝尔文学奖',
    author: '川端康成',
    work: '雪国',
    enAuthor: 'Yasunari Kawabata',
    enWork: 'Snow Country',
    zh: '“穿过县界长长的隧道，便是雪国。夜空下一片白茫茫。”',
    en: '“The train came out of the long tunnel into the snow country. The earth lay white under the night sky.”'
  },
  {
    year: '1923 诺贝尔文学奖',
    author: '威廉·巴特勒·叶芝',
    work: '当你老了',
    enAuthor: 'William Butler Yeats',
    enWork: 'When You Are Old',
    zh: '“多少人爱过你昙花一现的身影，唯独一人爱过你朝圣者的灵魂。”',
    en: '“How many loved your moments of glad grace, but one man loved the pilgrim soul in you.”'
  },
  {
    year: '1998 诺贝尔文学奖',
    author: '若泽·萨拉马戈',
    work: '失明症漫记',
    enAuthor: 'José Saramago',
    enWork: 'Blindness',
    zh: '“我想我们没有失明，我想我们本来就是盲人。盲人能看却看不见，能看却不去看。”',
    en: '“I don\'t think we did go blind, I think we are blind, Blind but seeing, Blind people who can see, but do not see.”'
  },
  {
    year: '2017 诺贝尔文学奖',
    author: '石黑一雄',
    work: '长日将尽',
    enAuthor: 'Kazuo Ishiguro',
    enWork: 'The Remains of the Day',
    zh: '“如果一个人因为疲惫而停下脚步，并不意味着他背弃了自己的人生。”',
    en: '“What is the point in worrying oneself too much about what one could or could not have done to control the course one\'s life took?”'
  },
  {
    year: '1925 诺贝尔文学奖',
    author: '乔治·萧伯纳',
    work: '人与超人',
    enAuthor: 'George Bernard Shaw',
    enWork: 'Man and Superman',
    zh: '“理性的人让自己适应世界；非理性的人坚持让世界适应自己。”',
    en: '“The reasonable man adapts himself to the world: the unreasonable one persists in trying to adapt the world to himself.”'
  },
  {
    year: '1907 诺贝尔文学奖',
    author: '约瑟夫·鲁德亚德·吉卜林',
    work: '如果',
    enAuthor: 'Rudyard Kipling',
    enWork: 'If—',
    zh: '“如果在众人六神无主之时，你能镇定自若而不是人云亦云。”',
    en: '“If you can keep your head when all about you are losing theirs and blaming it on you.”'
  }
];

/**
 * 基于日期的确定性哈希算法，保证同一归档日期在任何时间访问时生成的每日名言恒定一致
 * @param {string} date - 日期字符串 (YYYY-MM-DD)
 * @returns {object} NobelQuote
 */
export function getDailyNobelQuote(date = new Date().toISOString().slice(0, 10)) {
  let hash = 0;
  const str = String(date);
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % NOBEL_QUOTES_ARCHIVE.length;
  return {
    ...NOBEL_QUOTES_ARCHIVE[index],
    batchDate: date
  };
}

/**
 * 随机获取一句诺奖名言（供换一句功能或测试使用）
 */
export function getRandomNobelQuote(excludeIndex = -1) {
  let idx = Math.floor(Math.random() * NOBEL_QUOTES_ARCHIVE.length);
  if (excludeIndex >= 0 && idx === excludeIndex && NOBEL_QUOTES_ARCHIVE.length > 1) {
    idx = (idx + 1) % NOBEL_QUOTES_ARCHIVE.length;
  }
  return {
    ...NOBEL_QUOTES_ARCHIVE[idx]
  };
}
