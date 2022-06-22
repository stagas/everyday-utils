import { chunk } from '../src/everyday-utils'

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
