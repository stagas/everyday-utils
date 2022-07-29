import { bool, toFluent } from 'to-fluent'

export * from 'deep-mutate-object'
export * from 'pick-omit'
export { default as isEqual } from './is-equal'

import type { Chunk, StringOf } from 'everyday-types'

export const chunk = <T, L extends number>(arr: T[], size: L): Chunk<T, L>[] => {
  return Array.from({ length: Math.ceil(arr.length / size) | 0 }, (_, i) => {
    const pos: number = i * size
    return arr.slice(pos, pos + size)
  }) as Chunk<T, L>[]
}

export const entries = <
  K extends keyof T,
  V extends T[K],
  T extends { [s: string]: any } | ArrayLike<any>,
>(obj: T): readonly [K, V][] => Object.entries(obj) as unknown as readonly [K, V][]

export const keys = <
  K extends keyof T,
  T extends { [s: string]: any } | ArrayLike<any>,
>(obj: T): readonly K[] => Object.keys(obj) as unknown as readonly K[]

export const fromEntries = <K extends string, V>(entries: readonly [K, V][]) =>
  Object.fromEntries(entries) as Record<K, V>

export const cheapRandomId = () => (Math.random() * 10e7 | 0).toString(36)

export const accessors = <S, T>(
  target: T,
  source: S,
  fn: (key: StringOf<keyof S>, value: S[StringOf<keyof S>]) => PropertyDescriptor,
  filter: (key: StringOf<keyof S>, value: S[StringOf<keyof S>]) => boolean = () =>
    true,
) => {
  const prevDesc = new Map()
  Object.defineProperties(
    target,
    Object.fromEntries(
      (entries(source)
        .filter(([key]) => typeof key === 'string') as [
          StringOf<keyof S>,
          S[StringOf<keyof S>],
        ][])
        .filter(([key, value]) => filter(key, value))
        .map(
          ([key, value]) => {
            const next = fn(key, value) as any
            const prev = Object.getOwnPropertyDescriptor(target, key)
            prevDesc.set(key, prev)
            if (prev && prev.get && prev.set) {
              const { get, set } = next
              next.get = () => {
                // run both getters if any, for side-effects to run
                // TODO: this should be revisited, what should be
                // the correct behavior here? maybe pass the previous
                // getter as a param to the next one and let them decide?
                // what should be the default behavior? this seems wrong
                // but it works.
                const top = get?.()
                const below = prev.get!()
                return below ?? top
              }
              next.set = (v: any) => {
                prev.set?.(v)
                set(prev.get?.() ?? v)
              }
            }
            //!? 'create accessor', key, prev, next
            return [key, {
              configurable: true,
              enumerable: true,
              ...next,
            }]
          }
        )
    )
  )
  return () => {
    for (const [key, desc] of prevDesc) {
      //!? 'removing accessor', key, desc
      if (desc == null) {
        delete (target as any)[key]
      } else {
        // const newValue = (target as any)[key]
        Object.defineProperty(target, key, desc)
        // ;(target as any)[key] = newValue
      }
    }
  }
}

export const kebab = (s: string) =>
  s.replace(/[a-z](?=[A-Z])|[A-Z]+(?=[A-Z][a-z])/g, '$&-').toLowerCase()

export const styleToCss = (style: CSSStyleDeclaration) => {
  let css = ''
  for (const key in style)
    css += style[key]
      ? kebab(key) + ':' + style[key] + ';'
      : ''
  return css
}

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

export const asyncSerialReduce = async <T, U>(
  arr: T[],
  fn: (prev: U, next: T, index: number, arr: T[]) => Promise<U>,
  prev: U,
): Promise<U> => {
  for (const [i, item] of arr.entries()) {
    prev = await fn(prev, item, i, arr)
  }
  return prev
}

export const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms))

export const tick = () => Promise.resolve()

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

export const removeFromArray = <T>(arr: T[], el: T, quiet = false): T[] | void => {
  const index = arr.indexOf(el)
  if (!~index) {
    if (quiet) return
    throw new ReferenceError('Item to be removed does not exist in the array.')
  }
  return arr.splice(index, 1)
}

export const chainSync = (...args: (() => any)[]) => (() => {
  for (const fn of args) fn()
})

export const shallowEqual = (a: object, b: object) =>
  [[a, b], [b, a]].every(([a, b]) =>
    entries(a).every(([key, value]) => key in b && b[key] == value)
  )

export const getOwnProperty = (object: object, name: string) =>
  Object.getOwnPropertyDescriptor(object, name)?.value

export const padCenter = (str: string | number, length: number) => {
  const strLength = getStringLength(str)
  const padLength = Math.floor((length - strLength) / 2)
  return repeatString(' ', length - strLength - padLength) + str
    + repeatString(' ', padLength)
}

export const getStringLength = (str: string | number) => stripAnsi(str).length

export const padStart = (str: string | number, length: number, char = ' ') => {
  const strLength = getStringLength(str)
  return repeatString(char, length - strLength) + str
}

export const repeatString = (s: string, x: number) => s.repeat(Math.max(0, x))

// const padEnd = (str: string, length: number) => {
//   const ansiLength = stripAnsi(str).length
//   return str + ' '.repeat(Math.max(0, length - ansiLength))
// }

export const stripAnsi = (str: string | number) =>
  // eslint-disable-next-line no-control-regex
  str.toString().replace(/\u001b\[\d+m/g, '')

export const includesAny = (str: string, predicates: string[]) =>
  predicates.some(p => str.includes(p))

export const asyncFilter = async <T>(
  array: T[],
  fn: (item: T) => Promise<boolean>,
) =>
  (await Promise.all(
    array.map(async x => [x, await fn(x)] as const)
  )).filter(([, truth]) => truth).map(([x]) => x)

export const defineProperty = toFluent(
  class {
    configurable = false
    enumerable = false
    writable = bool
    get?(): any
    set?(v: any): void
  },
  descriptor =>
    <T>(object: object, name: PropertyKey, value?: T) =>
      Object.defineProperty(
        object,
        name,
        value == null ? descriptor : {
          ...descriptor,
          value,
        }
      )
)

export const filterMap = <T, U>(
  array: T[],
  fn: (item: T, index: number, array: T[]) => U | false | null | undefined,
) => array.map(fn).filter(Boolean) as U[]

export const sortCompare = (a: number | string, b: number | string) =>
  a < b ? -1 : a > b ? 1 : 0

export const sortCompareKeys = ([a]: [string, any], [b]: [string, any]) =>
  a < b ? -1 : a > b ? 1 : 0

export const sortObjectInPlace = <T extends Record<string, any>>(data: T) => {
  const sorted = Object.fromEntries(
    Object.entries(data).sort(sortCompareKeys)
  )
  for (const key in data) delete data[key]
  Object.assign(data, sorted)
  return data
}
