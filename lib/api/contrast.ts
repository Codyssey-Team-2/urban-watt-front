/**
 * 배경색 위에서 읽히는 글자색을 고른다.
 *
 * 등급 배지 색은 서버가 정한다(계약 규칙 #1). 그런데 서버 팔레트에는
 * #FBC02D 같은 밝은 색이 있어 흰 글자를 얹으면 읽히지 않는다.
 * 색은 서버 값을 그대로 쓰되, 글자색만 대비로 결정한다.
 */
const channel = (v: number) =>
  v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
  const [r, g, b] = [0, 2, 4].map((i) =>
    channel(parseInt(full.slice(i, i + 2), 16) / 255),
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const ratio = (a: number, b: number) =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

const INK = '#16241D'
const WHITE = '#FFFFFF'

export function readableOn(background: string): string {
  try {
    const bg = luminance(background)
    return ratio(bg, luminance(WHITE)) >= ratio(bg, luminance(INK)) ? WHITE : INK
  } catch {
    return INK
  }
}
