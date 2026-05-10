import { MathQuestion } from '@/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(answer: number, count: number = 4): number[] {
  const opts = new Set<number>([answer])
  while (opts.size < count) {
    const offset = Math.floor(Math.random() * 5) + 1
    opts.add(Math.max(0, answer + (Math.random() > 0.5 ? offset : -offset)))
  }
  return shuffle([...opts])
}

// 数数题
export function generateCountQuestion(): MathQuestion {
  const count = Math.floor(Math.random() * 8) + 3 // 3-10
  const fruits = ['🍎', '🍌', '🍊', '🍇', '🍓', '🍑', '🍒', '🍐']
  const fruit = fruits[Math.floor(Math.random() * fruits.length)]
  return {
    id: `count-${Date.now()}`,
    type: 'count',
    question: `看看，有几个${fruit}？`,
    emojis: fruit.repeat(count),
    options: generateOptions(count),
    answer: count,
  }
}

// 比大小题
export function generateCompareQuestion(): MathQuestion {
  const left = Math.floor(Math.random() * 5) + 2
  const right = Math.floor(Math.random() * 5) + 2
  const fruits = ['🍎', '🍌', '🍊', '🍇']
  const f1 = fruits[Math.floor(Math.random() * fruits.length)]
  const f2 = fruits[Math.floor(Math.random() * fruits.length)]
  // 如果一样就微调
  const adjustedRight = left === right ? left + 1 : right
  return {
    id: `compare-${Date.now()}`,
    type: 'compare',
    question: '哪边更多？',
    emojis: `${f1.repeat(left)} vs ${f2.repeat(adjustedRight)}`,
    options: [left, adjustedRight],
    answer: Math.max(left, adjustedRight),
  }
}

// 加减法题
export function generateAddSubQuestion(): MathQuestion {
  const a = Math.floor(Math.random() * 5) + 1  // 1-5
  const b = Math.floor(Math.random() * 4) + 1  // 1-4
  const isAdd = Math.random() > 0.5
  const fruits = ['🍎', '🍌', '🍊', '🍇', '🍓']
  const fruit = fruits[Math.floor(Math.random() * fruits.length)]

  // 减法：大减小，允许结果为0（如 4-4=0）
  const big = Math.max(a, b)
  const small = Math.min(a, b)
  const answer = isAdd ? a + b : big - small

  const display = isAdd
    ? `${fruit.repeat(a)} + ${fruit.repeat(b)} = ?`
    : `${fruit.repeat(big)} - ${fruit.repeat(small)} = ?`

  return {
    id: `addsub-${Date.now()}`,
    type: 'addsub',
    question: isAdd
      ? `${a} 加 ${b} 等于几？`
      : `${big} 减 ${small} 等于几？`,
    display: isAdd
      ? `${a} + ${b} = ?`
      : `${big} - ${small} = ?`,
    emojis: display,
    options: generateOptions(answer),
    answer,
  }
}
