import { LogPointService } from "../../../logs/LogPointService"
import { assert } from "../../../utils/Assert"
import { Rect2 } from "../dom/Rect2"
import { AnsiCode } from "./AnsiCodes"

export type Cell = {
	dirty: boolean
	char: string
	fg: string | null
	bg: string | null
}

export class Frame {
	cells: Cell[][] = []
	dirty = false
	size = { width: 0, height: 0 }
	lp?: LogPointService = undefined

	constructor(size: { width: number, height: number }) {
		this.setSize(size)
	}

	/**
	 * Set the size of the frame
	 */
	setSize(size: { width: number, height: number }): Frame {
		this.size.width = size.width
		this.size.height = size.height

		if (this.cells === undefined) {
			this.cells = []
		}
		this.cells.length = this.size.height
		for (let y = 0; y < this.size.height; y++) {
			// new line
			if (this.cells[y] === undefined) {
				this.cells[y] = []
			}
			this.cells[y].length = this.size.width
			for (let x = 0; x < this.size.width; x++) {
				// new cell
				if (this.cells[y][x] === undefined) {
					this.cells[y][x] = {
						char: ' ',
						fg: null,
						bg: null,
						dirty: true,
					}
				}
			}
		}

		return this
	}

	/**
	 * Updates a cell in the frame
	 */
	updateCell(update: { props: CellUpdate, x: number, y: number }): boolean {
		const u = update
		assert(u.x >= 0 && u.y >= 0)
		if (u.x >= this.size.width || u.y >= this.size.height) {
			return false
		}
		const cell = this.cells[u.y][u.x]
		if (!(isCellEqual(cell, u.props))) {
			// assert(cell.dirty == false)
			Object.assign(cell, u.props)
		}
		cell.dirty = true
		this.dirty = true
		return true
	}

	/**
	 * Updates a cell in the frame with bounds
	 * Throws if the cell is out of bounds
	 */
	updateCellWithBounds(update: { props: CellUpdate, x: number, y: number, bounds: Rect2 }) {
		const u = update
		assert(u.x >= 0)
		assert(u.y >= 0)
		assert(u.x < u.bounds.width)
		assert(u.y < u.bounds.height)

		this.updateCell({ ...update, x: u.bounds.x + u.x, y: u.bounds.y + u.y })
	}

	/**
	 * Render the frame to an array of ansi codes
	 * @see ansiCodesToString to get string to be sent to the terminal
	 */
	renderAnsiCodes(renderMode: 'full' | 'diff'): Array<AnsiCode> {
		let ansiCodes: Array<AnsiCode> = []
		let lastCell: { cell: Cell, x: number, y: number } | undefined = undefined


		if (renderMode == 'full' || (renderMode == 'diff' && this.dirty)) {
			for (let y = 0; y < this.cells.length; y++) {
				for (let x = 0; x < this.cells[y].length; x++) {
					const cell = this.cells[y][x]
					if (renderMode == 'full' || (renderMode == 'diff' && cell.dirty)) {

						if (lastCell === undefined || (lastCell.x != x - 1 || lastCell.y != y)) {
							ansiCodes.push({ type: 'moveTo', x: x, y: y })
						}

						// change foreground
						if (lastCell === undefined || lastCell.cell.fg != cell.fg) {
							ansiCodes.push({ type: 'fg', color: cell.fg })
						}

						// change background
						if (lastCell === undefined || lastCell.cell.bg != cell.bg) {
							ansiCodes.push({ type: 'bg', color: cell.bg })
						}

						ansiCodes.push({ type: 'char', char: cell.char })

						cell.dirty = false
						lastCell = { cell: cell, x: x, y: y }
					}
				}
			}
		}
		lastCell = undefined
		this.dirty = false

		return ansiCodes
	}

	renderToPlainText(): string {
		this.lp?.logPoint('Frame.renderToPlainText')
		let plainText = ''
		for (let y = 0; y < this.size.height; y++) {
			for (let x = 0; x < this.size.width; x++) {
				const cell = this.cells[y][x]

				plainText += cell.char

				if (x == this.size.width - 1) {
					plainText += '\n'
				}
			}
		}
		return plainText
	}
}

type CellUpdate = Omit<Partial<Cell>, 'dirty'>

export function isCellEqual(cell: Cell, partial: Partial<Cell>) {
	if ('char' in partial && cell.char !== partial.char) {
		return false
	}
	if ('bg' in partial && cell.bg !== partial.bg) {
		return false
	}
	if ('fg' in partial && cell.fg !== partial.bg) {
		return false
	}
	return true
}