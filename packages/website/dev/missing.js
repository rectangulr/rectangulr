const proxy = new Proxy({}, {
	get: (_, p) => {
		return {}
	}
})

export default proxy