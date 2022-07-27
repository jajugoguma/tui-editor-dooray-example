const path = require('path');

module.exports = {
	module: {
		rules: [
			{
				exclude: /node_modules/,
			},
		],
	},
	devServer: {
		host: 'localhost',
		static: path.resolve(__dirname, 'src/demo'),
		compress: true,
		port: 8888,
		open: true,
	},
};
