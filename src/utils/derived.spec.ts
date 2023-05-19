import { isSignal, signal } from '../angular-terminal/signals'
import { derived } from './reactivity'

describe('derived signals - ', () => {
  it('test', () => {
    const s = signal(1)
    expect(s()).toEqual(1)
  })

  it('derived', () => {
    const $list = signal([1, 2, 3])

    const $item = derived(
      () => $list()[0],
      value =>
        $list.mutate(list => {
          list[0] = value
        })
    )

    expect(isSignal($item)).toEqual(true)

    expect($item()).toEqual(1)
    expect($list()).toEqual([1, 2, 3])

    $item.set(2)
    expect($item()).toEqual(2)
    expect($list()).toEqual([2, 2, 3])
  })

  it('derived chained', () => {
    const $matrix = signal([
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ])

    const $list = derived(
      () => $matrix()[0],
      value =>
        $matrix.mutate(matrix => {
          matrix[0] = value
        })
    )

    const $item = derived(
      () => $list()[0],
      value =>
        $list.mutate(list => {
          list[0] = value
        })
    )

    expect(isSignal($matrix)).toEqual(true)
    expect(isSignal($list)).toEqual(true)

    expect($item()).toEqual(1)
    expect($list()).toEqual([1, 2, 3])
    expect($matrix()).toEqual([
      [1, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ])

    $item.set(2)

    expect($item()).toEqual(2)
    expect($list()).toEqual([2, 2, 3])
    expect($matrix()).toEqual([
      [2, 2, 3],
      [1, 2, 3],
      [1, 2, 3],
    ])
  })
})
