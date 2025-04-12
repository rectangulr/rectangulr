import { Frame, isCellEqual } from "./Frame"


describe('Frame - ', () => {
  it('sets buffer size', () => {
    const frame = new Frame({ width: 100, height: 40 })
    expect(frame.cells.length).toEqual(40)
    expect(frame.cells[0].length).toEqual(100)
  })

  it('sets cell', () => {
    const frame = new Frame({ width: 100, height: 40 })

    frame.updateCell({ props: { char: 'a', fg: '#ffffff', bg: '#000000' }, x: 10, y: 10 })

    expect(frame.cells[10][10]).toEqual({ char: 'a', fg: '#ffffff', bg: '#000000', dirty: true })
    expect(frame.dirty).toEqual(true)
  })

  it('rendering sets everything to dirty=false', () => {
    const frame = new Frame({ width: 100, height: 40 })

    frame.updateCell({ props: { char: 'a', fg: '#ffffff', bg: '#000000' }, x: 10, y: 10 })
    frame.renderAnsiCodes('full') // flush dirty

    expect(frame.cells[10][10].dirty).toEqual(false)
    expect(frame.dirty).toEqual(false)
  })

  it('renderAnsiCodes 1 diff', () => {
    const frame = new Frame({ width: 100, height: 40 })
    frame.renderAnsiCodes('full') // flush dirty

    frame.updateCell({ props: { char: 'a', fg: '#ffffff', bg: '#000000' }, x: 10, y: 10 })

    const res = frame.renderAnsiCodes('diff')
    expect(res).toEqual([
      { type: 'moveTo', x: 10, y: 10 },
      { type: 'fg', color: '#ffffff' },
      { type: 'bg', color: '#000000' },
      { type: 'char', char: 'a' }
    ])
  })

  it('renderAnsiCodes 2 consecutive diffs ', () => {
    const frame = new Frame({ width: 100, height: 40 })
    frame.renderAnsiCodes('full') // flush dirty
    frame.updateCell({ props: { char: 'a', fg: '#ffffff', bg: '#000000' }, x: 10, y: 10 })
    frame.updateCell({ props: { char: 'b', fg: '#ffffff', bg: '#000000' }, x: 10, y: 11 })

    const res = frame.renderAnsiCodes('diff')
    expect(res).toEqual([
      { type: 'moveTo', x: 10, y: 10 },
      { type: 'fg', color: '#ffffff' },
      { type: 'bg', color: '#000000' },
      { type: 'char', char: 'a' },
      { type: 'moveTo', x: 10, y: 11 },
      { type: 'char', char: 'b' }
    ])
  })

  it('renderAnsiCodes 2 distinct diffs ', () => {
    const frame = new Frame({ width: 100, height: 40 })
    frame.renderAnsiCodes('full') // flush dirty
    frame.updateCell({ props: { char: 'a', fg: '#ffffff', bg: '#000000' }, x: 10, y: 10 })
    frame.updateCell({ props: { char: 'b', fg: '#ff0000', bg: '#000000' }, x: 20, y: 20 })

    const res = frame.renderAnsiCodes('diff')
    expect(res).toEqual([
      { type: 'moveTo', x: 10, y: 10 },
      { type: 'fg', color: '#ffffff' },
      { type: 'bg', color: '#000000' },
      { type: 'char', char: 'a' },
      { type: 'moveTo', x: 20, y: 20 },
      { type: 'fg', color: '#ff0000' },
      { type: 'char', char: 'b' }
    ])
  })

  it('renderAnsiCodes full mode renders all cells regardless of dirty state', () => {
    const frame = new Frame({ width: 2, height: 2 })
    frame.renderAnsiCodes('full') // flush dirty
    frame.updateCell({ props: { char: 'a', fg: '#fff', bg: '#000' }, x: 0, y: 0 })

    const res = frame.renderAnsiCodes('full') // flush dirty
    expect(res).toEqual([
      { type: 'moveTo', x: 0, y: 0 },
      { type: 'fg', color: '#fff' },
      { type: 'bg', color: '#000' },
      { type: 'char', char: 'a' },
      { type: 'fg', color: null },
      { type: 'bg', color: null },
      { type: 'char', char: ' ' },
      { type: 'moveTo', x: 0, y: 1 },
      { type: 'char', char: ' ' },
      { type: 'char', char: ' ' }
    ])
  })

  it('does not render codes in diff mode when nothing is dirty', () => {
    const frame = new Frame({ width: 2, height: 2 })
    frame.renderAnsiCodes('full') // flush dirty
    frame.updateCell({ props: { char: 'a', fg: '#fff', bg: '#000' }, x: 0, y: 0 })
    frame.renderAnsiCodes('diff')

    const res = frame.renderAnsiCodes('diff')
    expect(res).toEqual([])
  })

  it('throws error when setting cell outside bounds', () => {
    const frame = new Frame({ width: 10, height: 10 })
    frame.renderAnsiCodes('full')

    expect(frame.updateCell({ props: { char: 'x' }, x: 20, y: 5 })).toEqual(false)
    expect(frame.updateCell({ props: { char: 'x' }, x: 5, y: 20 })).toEqual(false)
  })

  it('isCellEqual', () => {
    expect(isCellEqual({
      bg: '#000000',
      char: 'a',
      fg: '#ffffff',
      dirty: false
    }, { bg: '#000000' })).toEqual(true)
  })

  describe('updateCellWithBounds', () => {
    it('updates cell with bounds', () => {
      const frame = new Frame({ width: 10, height: 10 })
      frame.renderAnsiCodes('full') // flush dirty
      const bounds = { x: 5, y: 5, width: 5, height: 5 }

      frame.updateCellWithBounds({ props: { char: 'x' }, x: 0, y: 0, bounds })
      expect(frame.cells[5][5]).toEqual({ char: 'x', fg: null, bg: null, dirty: true })
    })

    it('throw on outside bounds', () => {
      const frame = new Frame({ width: 10, height: 10 })
      frame.renderAnsiCodes('full') // flush dirty
      const bounds = { x: 5, y: 5, width: 5, height: 5 }

      expect(() => frame.updateCellWithBounds({ props: { char: 'x' }, x: 6, y: 0, bounds })).toThrow()
      expect(() => frame.updateCellWithBounds({ props: { char: 'x' }, x: -1, y: 0, bounds })).toThrow()
    })

    it('resize up', () => {
      const frame = new Frame({ width: 10, height: 10 })
      frame.renderAnsiCodes('full') // flush dirty
      frame.updateCell({ props: { char: 'x' }, x: 5, y: 5 })
      frame.setSize({ width: 20, height: 20 })

      expect(frame.cells.length).toEqual(20)
      expect(frame.cells[0].length).toEqual(20)
      expect(frame.cells[5][5].char).toEqual('x')
    })

    it('resize down', () => {
      const frame = new Frame({ width: 20, height: 20 })
      frame.updateCell({ props: { char: 'x' }, x: 15, y: 15 })
      frame.setSize({ width: 10, height: 10 })

      expect(frame.cells.length).toEqual(10)
      expect(frame.cells[0].length).toEqual(10)
      expect(frame.cells[5][5].char).toEqual(' ')
    })
  })

})
