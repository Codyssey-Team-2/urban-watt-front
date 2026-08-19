/** 조건부 클래스 결합. clsx를 따로 넣을 만큼 쓰임이 많지 않다. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
