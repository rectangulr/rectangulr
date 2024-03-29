function createContext(str: string) {
	return {
		str,
		index: 0,
		length: str.length,
	}
}

const ctx = createContext("string string")
const { begin, end } = parse(ctx, '<')