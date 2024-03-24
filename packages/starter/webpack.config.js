// CUSTOMIZE YOUR .JS BUNDLE

module.exports = {
	target: 'node',

	optimization: {
		runtimeChunk: false,
		splitChunks: false,
	},

	// node: {
	// 	// global: true,
	// 	// __filename: true,
	// 	// __dirname: true,
	// },

	// devtool: 'source-map',

	// // All of these are only available in Nodejs. We can't bundle them.
	// externals: {
	// 	'pg-native': "require('pg-native')",
	// 	'pg-structure': "require('pg-structure')",
	// 	'node-fetch': "require('node-fetch')",
	// 	'debug': "require('debug')",
	// 	'puppeteer': "require('puppeteer')"
	// },

	// resolve: {
	// 	// Some npm packages want to `require` .json files.
	// 	extensions: ['.json'],

	// 	// So webpack stops using package.json .browser, and instead .main and .module
	// 	mainFields: ['module', 'main'],
	// 	aliasFields: []
	// }
}



// export default (config, options) => {

// 	debugger

// 	return config
// }
