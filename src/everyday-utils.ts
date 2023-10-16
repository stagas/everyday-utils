import { bool, toFluent } from 'to-fluent'

export * from 'to-fluent'
export * from 'deep-mutate-object'
export * from 'pick-omit'

export * from './rgb'
export * from './eventemitter'
export { default as isEqual } from './is-equal'

import type { Chunk, Class, Fn, StringOf } from 'everyday-types'

export function chunk<T, L extends number>(arr: T[], size: L): Chunk<T, L>[] {
  return Array.from({ length: Math.ceil(arr.length / size) | 0 }, (_, i) => {
    const pos: number = i * size
    return arr.slice(pos, pos + size)
  }) as Chunk<T, L>[]
}

export function entries<K extends keyof T,
  V extends T[K],
  T extends { [s: string]: any }>(obj: T): readonly [K, V][]
export function entries<K extends keyof T,
  V extends T[K],
  T extends ArrayLike<any>>(obj: T): readonly [K, V][]
export function entries<K extends keyof T,
  V extends T[K],
  T extends { [s: string]: any } | ArrayLike<any>>(obj: T): readonly [K, V][] {
  return Object.entries(obj) as unknown as readonly [K, V][]
}

export function keys<K extends keyof T,
  T extends { [s: string]: any }>(obj: T): readonly K[]
export function keys<K extends keyof T,
  T extends ArrayLike<any>>(obj: T): readonly K[]
export function keys<K extends keyof T,
  T extends { [s: string]: any } | ArrayLike<any>>(obj: T): readonly K[] {
  return Object.keys(obj) as unknown as readonly K[]
}

export function fromEntries<K extends string, V>(entries: readonly [K, V][]) {
  return Object.fromEntries(entries) as Record<K, V>
}

export function cheapRandomId() {
  return `${String.fromCharCode(97 + Math.random() * 25)}${(Math.random() * 10e7 | 0).toString(36)}`
}

export const randomId = cheapRandomId

export function accessors<S extends { [s: string]: any }, T>(target: T,
  source: S,
  fn: (key: StringOf<keyof S>, value: S[StringOf<keyof S>]) => PropertyDescriptor,
  filter: (key: StringOf<keyof S>, value: S[StringOf<keyof S>]) => boolean = () => true) {
  const prevDesc = new Map()
  Object.defineProperties(
    target,
    Object.fromEntries(
      (entries(source)
        .filter(([key]) => typeof key === 'string') as [
          StringOf<keyof S>,
          S[StringOf<keyof S>]
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

export function kebab(s: string) {
  return s.replace(/[a-z](?=[A-Z])|[A-Z]+(?=[A-Z][a-z])/g, '$&-').toLowerCase()
}

export function styleToCss(style: CSSStyleDeclaration) {
  let css = ''
  for (const key in style)
    css += (style[key] != null && (style as any)[key] !== false)
      ? kebab(key) + ':' + style[key] + ';'
      : ''
  return css
}

export function shuffle<T>(arr: T[]): T[] {
  return arr.sort(() => Math.random() - 0.5)
}

export async function asyncSerialMap<T, U>(arr: T[],
  fn: (item: T, index: number, arr: T[]) => Promise<U>): Promise<U[]> {
  const results: U[] = []
  for (const [i, item] of arr.entries()) {
    results.push(await fn(item, i, arr))
  }
  return results
}

export async function asyncSerialReduce<T, U>(arr: T[],
  fn: (prev: U, next: T, index: number, arr: T[]) => Promise<U>,
  prev: U): Promise<U> {
  for (const [i, item] of arr.entries()) {
    prev = await fn(prev, item, i, arr)
  }
  return prev
}

export function wait(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function tick() {
  return Promise.resolve()
}

export function colorHash(string: string, minColorHex = '888') {
  const minColor = parseInt(minColorHex, 16)

  const color = ((
    (checksum(string) | 0) % (4096 - minColor)
  ) + minColor).toString(16).padStart(3, '0')

  return color
}

export function colorOf(id: string, sat = 100, lum = 65) {
  return `hsl(${(Math.round(parseInt(id, 36) / 25) * 25) % 360}, ${sat}%, ${lum}%)`
}

export function ansiColorFor(string: string) {
  const [r, g, b] = colorHash(string).split('').map(x => parseInt(x + x, 16))
  return `\x1B[38;2;${r};${g};${b}m${string}`
}

export function removeFromArray<T>(arr: T[], el: T, quiet = false): T[] | void {
  const index = arr.indexOf(el)
  if (!~index) {
    if (quiet)
      return
    throw new ReferenceError('Item to be removed does not exist in the array.')
  }
  return arr.splice(index, 1)
}

export function chainSync(...args: (() => any)[]) {
  return (() => {
    for (const fn of args)
      fn()
  })
}

export function shallowEqual(a: object, b: object) {
  return [[a, b], [b, a]].every(([a, b]) => entries(a).every(([key, value]) => key in b && b[key] == value))
}

export function shallowEqualArray(a: unknown, b: unknown) {
  if (a === b) return true
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length === b.length) {
    if (a.every((x, i) => x === b[i])) {
      return true
    }
  }
  return false
}

export function getOwnProperty(object: object, name: string) {
  return Object.getOwnPropertyDescriptor(object, name)?.value
}

export function padCenter(str: string | number, length: number) {
  const strLength = getStringLength(str)
  const padLength = Math.floor((length - strLength) / 2)
  return repeatString(' ', length - strLength - padLength) + str
    + repeatString(' ', padLength)
}

export function getStringLength(str: string | number) {
  return stripAnsi(str).length
}

export function padStart(str: string | number, length: number, char = ' ') {
  const strLength = getStringLength(str)
  return repeatString(char, length - strLength) + str
}

export function padEnd(str: string | number, length: number, char = ' ') {
  const strLength = getStringLength(str)
  return str + repeatString(char, length - strLength)
}

export function repeatString(s: string, x: number) {
  return s.repeat(Math.max(0, x))
}

// const padEnd = (str: string, length: number) => {
//   const ansiLength = stripAnsi(str).length
//   return str + ' '.repeat(Math.max(0, length - ansiLength))
// }

export function stripAnsi(str: string | number) {
  return str.toString() // `\x1B[38;2;${r};${g};${b}m${string}`
    // eslint-disable-next-line no-control-regex
    .replace(/\u001b\[38;2;\d+;\d+;\d+m|\u001b\[\d+m/g, '')
}

export function includesAny(str: string, predicates: string[]) {
  return predicates.some(p => str.includes(p))
}

export async function asyncFilter<T>(array: T[],
  fn: (item: T) => Promise<boolean>) {
  return (await Promise.all(
    array.map(async (x) => [x, await fn(x)] as const)
  )).filter(([, truth]) => truth).map(([x]) => x)
}

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

export function filterMap<T, U>(array: T[] | readonly T[],
  fn: (item: T, index: number, array: T[] | readonly T[]) => U | false | null | undefined) {
  return array.map(fn).filter(x => x != null && x !== false) as U[]
}

export function sortCompare(a: number | string, b: number | string) {
  return a < b ? -1 : a > b ? 1 : 0
}

export function sortCompareKeys([a]: [string, any], [b]: [string, any]) {
  return a < b ? -1 : a > b ? 1 : 0
}

export function sortObjectInPlace<T extends Record<string, any>>(data: T) {
  const sorted = Object.fromEntries(
    Object.entries(data).sort(sortCompareKeys)
  )
  for (const key in data)
    delete data[key]
  Object.assign(data, sorted)
  return data
}

export function splitAt(string: string, index: number) {
  return [string.slice(0, index), string.slice(index + 1)] as const
}

export function memoize<P extends unknown[], R>(fn: Fn<P, R>,
  map = Object.create(null)) {
  return function (this: unknown, ...args: P): R {
    const serialized = args.join()
    return map[serialized] ?? (map[serialized] = fn.apply(this, args))
  } as Fn<P, R>
}

export interface Deferred<T> {
  hasSettled: boolean
  promise: Promise<T>
  when: (fn: () => void) => void
  resolve: (value: T) => void
  reject: (error?: Error) => void
  value?: T
  error?: Error
}

export function Deferred<T>() {
  const _onwhen = () => {
    deferred.hasSettled = true
    deferred.resolve = deferred.reject = noop
  }

  const noop = () => { }

  let onwhen = noop

  const deferred = {
    hasSettled: false,
    when: fn => {
      onwhen = () => {
        _onwhen()
        fn()
      }
    },
  } as Deferred<T>

  deferred.promise = new Promise<T>((resolve, reject) => {
    deferred.resolve = arg => {
      onwhen()
      deferred.value = arg
      resolve(arg)
    }
    deferred.reject = error => {
      onwhen()
      deferred.error = error
      reject(error)
    }
  })

  return deferred
}

export function KeyedCache<T, U extends unknown[], V extends string | number>(getter: (key: V, ...args: U) => Promise<T>, maxCacheSize = Infinity) {
  const cache = new Map<V, { deferred: Deferred<T>, accessTime: number }>()

  let accessTime = 0

  const get = Object.assign(async function (key: V, ...args: U): Promise<T> {
    let cacheItem = cache.get(key)

    if (cacheItem == null) {
      const deferred = Deferred<T>()

      accessTime++

      cache.set(key, cacheItem = { deferred, accessTime })

      getter(key, ...args)
        .then(deferred.resolve)
        .catch(deferred.reject)
    }
    else {
      cacheItem.accessTime = accessTime++

      if (cache.size > get.maxCacheSize) {
        const [lruKey] = [...cache].sort(([, a], [, b]) => a.accessTime - b.accessTime)[0]

        cache.delete(lruKey)
      }
    }

    return cacheItem.deferred.promise
  }, {
    cache,
    maxCacheSize
  })

  return get
}

export type Promised<T, U extends unknown[] = unknown[]> = (...args: U) => Promise<T>

export function promisify(fn: any) {
  return function (this: any, ...args: any[]) {
    return new Promise<any>((resolve, reject) => {
      fn.call(this, ...args, (err: any, ...data: any[]) => {
        if (err)
          reject(err)
        else
          resolve(data)
      })
    })
  }
}

export class MapSet<K, V> {
  map = new Map<K, Set<V>>()

  constructor(mapSet?: MapSet<K, V>, shallow?: boolean) {
    if (mapSet) {
      if (shallow) {
        this.map = mapSet.map
      }
      else {
        this.map = new Map([...mapSet.map.entries()]
          .map(([key, set]) => [key, new Set(set)])
        )
      }
    }
  }

  copy() {
    return new MapSet(this)
  }

  shallowCopy() {
    return new MapSet(this, true)
  }

  add(key: K, value: any) {
    if (this.map.has(key)) {
      const set = this.map.get(key)!
      set.add(value)
      return set.size
    } else {
      this.map.set(key, new Set([value]))
      return 1
    }
  }

  create(key: K) {
    this.map.set(key, new Set())
  }

  keys() {
    return this.map.keys()
  }

  values() {
    return [...this.map.values()].flatMap((set) => [...set])
  }

  entries() {
    return [...this.map.entries()].flatMap(([key, set]) => [...set].map((v): [K, V] => [key, v]))
  }

  get(key: K) {
    return this.map.get(key)
  }

  sort(key: K, compareFn?: (a: V, b: V) => number) {
    const set = this.map.get(key)
    if (set) {
      const items = [...set].sort(compareFn)
      this.map.set(key, new Set(items))
    }
  }

  delete(key: K, value: any) {
    return this.map.get(key)?.delete(value) ?? false
  }

  has(key: K, value: any) {
    return this.map.get(key)?.has(value) ?? false
  }

  hasKey(key: K) {
    return this.map.has(key)
  }

  clear() {
    return this.map.clear()
  }

  get size() {
    return this.map.size
  }
}

export class WeakMapSet<K extends object, V> {
  #map = new WeakMap<K, Set<V>>()

  set(key: K, value: any) {
    if (this.#map.has(key)) {
      const set = this.#map.get(key)!
      set.add(value)
      return set.size
    } else {
      this.#map.set(key, new Set([value]))
      return 1
    }
  }

  get(key: K) {
    return this.#map.get(key)
  }

  delete(key: K, value: any) {
    return this.#map.get(key)?.delete(value) ?? false
  }

  has(key: K, value: any) {
    return this.#map.get(key)?.has(value) ?? false
  }
}

export class MapMap<KA, KB, V> {
  #map = new Map<KA, Map<KB, V>>()

  set(keyA: KA, keyB: KB, value: any) {
    if (this.#map.has(keyA)) {
      const map = this.#map.get(keyA)!
      map.set(keyB, value)
      return map.size
    } else {
      this.#map.set(keyA, new Map([[keyB, value]]))
      return 1
    }
  }

  get(keyA: KA, keyB: KB) {
    return this.#map.get(keyA)?.get(keyB)
  }

  delete(keyA: KA, keyB: KB) {
    return this.#map.get(keyA)?.delete(keyB) ?? false
  }

  has(keyA: KA, keyB: KB) {
    return this.#map.has(keyA) && this.#map.get(keyA)!.has(keyB)
  }

  clear() {
    return this.#map.clear()
  }
}

export class MapMapSet<KA, KB, V> {
  #map = new Map<KA, MapSet<KB, V>>()

  add(keyA: KA, keyB: KB, value: any) {
    if (this.#map.has(keyA)) {
      const map = this.#map.get(keyA)!
      map.add(keyB, value)
      return map.size
    } else {
      const map = new MapSet<KB, V>()
      map.add(keyB, value)
      this.#map.set(keyA, map)
      return 1
    }
  }

  get(keyA: KA, keyB: KB) {
    return this.#map.get(keyA)?.get(keyB)
  }

  delete(keyA: KA, keyB: KB, value: any) {
    return this.#map.get(keyA)?.delete(keyB, value) ?? false
  }

  has(keyA: KA, keyB: KB, value: any) {
    return this.#map.has(keyA) && this.#map.get(keyA)!.has(keyB, value)
  }

  clear() {
    return this.#map.clear()
  }
}

export function mutable<T>(array: readonly T[]) {
  return array as T[]
}


export class MapFactory<K, V extends object> extends Map<K, V> {
  get(key: K, ...args: any[]) {
    if (this.has(key)) {
      return super.get(key)!
    } else {
      const value = new this.ctor(key, ...(args.length ? args : this.defaultArgs))
      this.set(key, value)
      return value
    }
  }

  ctor: Class<V>

  constructor(json: { entries: readonly [K, V][], ctor: Class<V> })
  constructor(ctor: Class<V>, defaultData?: Partial<V>)
  constructor(
    ctorOrJson: Class<V> | { entries: readonly [K, V][], ctor: Class<V> },
    public defaultArgs = []
  ) {
    if (typeof ctorOrJson === 'object') {
      super(ctorOrJson.entries)
      this.ctor = ctorOrJson.ctor
    } else {
      super()
      this.ctor = ctorOrJson
    }
  }

  toJSON() {
    return {
      entries: [...this],
      ctor: this.ctor
    }
  }
}

export class WeakMapFactory<K extends object, V extends object> extends WeakMap<K, V> {
  get(key: K, ...args: any[]) {
    if (this.has(key)) {
      return super.get(key)!
    } else {
      const value = new this.ctor(key, ...(args.length ? args : this.defaultArgs))
      this.set(key, value)
      return value
    }
  }

  constructor(
    public ctor: Class<V>,
    public defaultArgs = []
  ) {
    super()
  }
}

export function isClass(fn: any): boolean {
  return fn?.toString().startsWith('class')
}

export function bindAll<T extends object, U extends object>(obj: T, target: T | U = obj): T & U {
  return Object.assign(target,
    Object.fromEntries(
      filterMap(
        entries(
          Object
            .getOwnPropertyDescriptors(
              Object.getPrototypeOf(obj)
            )
        ),
        ([key, desc]) =>
          typeof desc.value === 'function'
          && !isClass(desc.value)
          && [key, desc.value.bind(obj)] as const
      )
    )
  ) as T & U
}

export function once<T extends ((this: any, ...args: any[]) => any) | void>(fn: T): T {
  if (!fn) return fn

  let res: any
  function wrap(this: any, ...args: any[]) {
    const savefn = fn
    // @ts-ignore
    fn = void 0
    res ??= savefn?.apply(this, args)
    return res
  }
  return wrap as T
}

// credits: chat-gpt
export function checksum(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 6) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function debugObjectMethods<T>(obj: T, ignoreKeys: string[] = [], hooks?: {
  before: (key: string, args: any[], stackErr: Error) => void,
  after: (key: string, args: any[], result: any) => void,
}, name = 'anonymous'): T {
  // @ts-ignore
  const isDebug = !!globalThis.DEBUG
  if (!isDebug) return obj

  // @ts-ignore
  const isOwnDebug = globalThis.DEBUG.includes(name)

  class Stack extends Error {
    constructor() {
      super()
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, Stack);
      }
      this.name = 'StackError'
    }
  }

  return Object.assign(obj as any,
    Object.fromEntries(
      Object.entries(obj as any)
        .concat(
          filterMap(
            Object.getOwnPropertyNames(
              // @ts-ignore
              Object.getPrototypeOf(obj.__proto__) ?? {}
            ), (key) =>
            typeof (obj as any)[key] === 'function' && !(obj as any)[key].toString().startsWith('class') && [key, (obj as any)[key]])
        ).filter(([key, fn]) =>
          !ignoreKeys.includes(key) && typeof fn === 'function' && !fn.toString().startsWith('class')
        ).map(([key, fn]: any) => {
          const wrapped = function (this: any, ...args: any[]) {
            // console.groupCollapsed(`\x1b[34m${prefix}:\t${key}(${args.length ? '...' : ''})`)

            // console.warn(key)
            if (isOwnDebug) {
              hooks?.before?.(key, args, new Stack())
            }

            // console.warn('ARGS:\t', args)

            const result = fn.apply(this, args)

            // console.log('\x1b[0m\x1b[1mRESULT:\t', result)

            if (isOwnDebug) {
              hooks?.after?.(key, args, result)
            }

            // console.groupEnd()

            return result
          }

          Object.defineProperty(wrapped, 'name', { value: `${key} (wrap)` })
          Object.defineProperty(fn, 'name', { value: key })
          Object.assign(fn, { key })
          // if (fn) Object.defineProperty(fn, 'key', {
          //   value: key,
          //   enumerable: false
          // })

          return [key, wrapped]
        })
    ))
}

export function attempt(x: () => void, quiet = false) {
  try {
    x()
  } catch (error) {
    if (!quiet) {
      console.warn(error)
    }
  }
}

export function noop() { }

export function modWrap(x: number, N: number) {
  return (x % N + N) % N
}
