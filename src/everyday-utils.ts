import type { Chunk } from 'everyday-types'

export const chunk = <T, L extends number>(arr: T[], size: L): Chunk<T, L>[] => {
  return Array.from({ length: Math.ceil(arr.length / size) | 0 }, (_, i) => {
    const pos = i * size
    return arr.slice(pos, pos + size)
  }) as Chunk<T, L>[]
}

export const entries = <
  K extends keyof T,
  V extends T[K],
  T extends { [s: string]: any } | ArrayLike<any>,
>(obj: T): readonly [K, V][] => Object.entries(obj) as unknown as readonly [K, V][]

export const cheapRandomId = () => (Math.random() * 10e7 | 0).toString(36)

export const accessors = (target: any, source: any, fn: (key: any, value: any) => PropertyDescriptor) =>
  Object.defineProperties(
    target,
    Object.fromEntries(
      Object.entries(source)
        .map(
          ([key, value]) => {
            const next = fn(key, value) as any
            const prev = Object.getOwnPropertyDescriptor(target, key)
            if (prev && prev.get && prev.set) {
              const { get, set } = next
              next.get = () => (prev.get?.() ?? get())
              next.set = (v: any) => {
                prev.set?.(v)
                set(prev.get?.() ?? v)
              }
            }
            return [key, {
              configurable: true,
              enumerable: true,
              ...next,
            }]
          }
        )
    )
  )

export const kebab = (s: string) => s.replace(/[a-z](?=[A-Z])|[A-Z]+(?=[A-Z][a-z])/g, '$&-').toLowerCase()

export const shuffle = <T>(arr: T[]): T[] => arr.sort(() => Math.random() - 0.5)

export const asyncSerialMap = async <T, U>(
  arr: T[],
  fn: (item: T, index: number, arr: T[]) => Promise<U>,
): Promise<U[]> => {
  const results: U[] = []
  for (const [i, item] of arr.entries()) {
    results.push(await fn(item, i, arr))
  }
  return results
}

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const colorHash = (string: string, minColorHex = '888') => {
  const minColor = parseInt(minColorHex, 16)

  const color = (
    (
      (string.split('').reduce(
        (p, n) => p + (n.charCodeAt(0) << 5),
        0
      ) | 0) % (4096 - minColor)
    ) + minColor
  ).toString(16).padStart(3, '0')

  return color
}
