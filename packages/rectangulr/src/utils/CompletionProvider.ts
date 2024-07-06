export type Completion = {
	value: string
	textToInsert?: string
}

export interface CompletionProvider {
	completions: (args: { text: string, caretIndex: number }) => Promise<Completion[]>
}
