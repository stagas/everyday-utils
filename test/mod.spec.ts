import { chunk, shallowEqual } from '../src/everyday-utils'

describe('chunk(array, n)', () => {
  it('chunks an array', () => {
    expect(chunk([], 2)).toEqual([])
    expect(chunk([], 0)).toEqual([])
    expect(chunk([1], 0)).toEqual([])
    expect(chunk([1], 1)).toEqual([[1]])
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]])
    expect(chunk([1], 2)).toEqual([[1]])
    expect(chunk([1, 2], 2)).toEqual([[1, 2]])
    expect(chunk([1, 2, 3], 2)).toEqual([[1, 2], [3]])
    expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]])
  })
})

describe('shallowEqual(a, b)', () => {
  it('compares two objects', () => {
    expect(shallowEqual({ x: true, y: 123 }, { x: true, y: 123 })).toBe(true)
    expect(shallowEqual({ x: true, y: 123 }, { x: true, y: 123, z: 1 })).toBe(false)
    expect(shallowEqual({ x: true, y: 123, z: 1 }, { x: true, y: 123 })).toBe(false)

    expect(shallowEqual({ x: false, y: 123 }, { x: true, y: 123 })).toBe(false)
    expect(shallowEqual({ x: true, y: 123 }, { x: true, y: 456 })).toBe(false)

    expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true)
    expect(shallowEqual([1], [1])).toBe(true)

    expect(shallowEqual({ a: -0 }, { a: +0 })).toBe(true)
    expect(shallowEqual([-0], [+0])).toBe(true)

    expect(shallowEqual({ a: -0 }, { a: +0 })).toBe(true)
    expect(shallowEqual([-0], [+0])).toBe(true)
    expect(shallowEqual([1], ['1'])).toBe(true)
  })
})
