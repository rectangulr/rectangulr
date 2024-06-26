// CUSTOMIZE YOUR .JS BUNDLE

export default {

	target: 'node',

	optimization: {
		runtimeChunk: false,
		splitChunks: false,
	},

	node: {
		global: true,
		__filename: true,
		__dirname: true,
	},

	module: {
		rules: [
			{
				include: /node_modules\/rectangulr/,
				test: /\.js$/,
				enforce: "pre",
				use: ["source-map-loader"],
			}
		],
	},

	devtool: 'source-map',

	resolve: {
		// Some npm packages want to `require` .json files.
		extensions: ['.json'],
	},

	watchOptions: {
		ignored: /node_modules/
	},

	output: {
		filename: 'main.cjs'
	}
}



// export default (config, options) => {

// 	debugger

// 	return config
// }
