export type LogName = string

export type Selector = string[]

export type Match = {
	match: MatchType
	nextSelector: Selector
}

export enum MatchType {
	No = 0,
	Match = 1,
	FullMatch = 2,
}