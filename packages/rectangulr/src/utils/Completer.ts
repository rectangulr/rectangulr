export type Completion = {
	value: string
	textToInsert?: string
}

export interface completionProvider {
	completions: (args: { text: string, caretIndex: number }) => Promise<{ values: Completion[] }[]>
}
