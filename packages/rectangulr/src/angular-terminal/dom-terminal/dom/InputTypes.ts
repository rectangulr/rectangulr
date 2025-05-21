import z from 'zod'


export type DataInput = {
	type: 'data'
	buffer: any
}
export const DataInputType = z.object({
	type: z.literal('data')
})

export type MouseInput = {
	type: 'mouse'
	name: string
	start: boolean
	end: boolean
	x: number
	y: number
}
export const MouseInputType = z.object({
	type: z.literal('mouse'),
	name: z.string().nullable(),
	start: z.boolean(),
	end: z.boolean(),
	x: z.number(),
	y: z.number(),
})
type KeyInput = {
	type: 'key'
	name: string
	alt: boolean
	ctrl: boolean
	meta: boolean
	shift: boolean
}
export const KeyInputType = z.object({
	type: z.literal('key'),
	name: z.string(),
	alt: z.boolean(),
	ctrl: z.boolean(),
	meta: z.boolean(),
	shift: z.boolean(),
})
type RawInput = {
	type: 'raw'
	buffer: Uint8Array
}
export const RawInputType = z.object({
	type: z.literal('raw')
})

export type Input = KeyInput | MouseInput | DataInput | RawInput
