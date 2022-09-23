const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


module.exports = {
	entry: './src/index.ts',
	module: {
		exprContextCritical: false,
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader'],
			},
			{
				test: /\.html$/i,
				loader: 'html-loader',
				options: {
					esModule: true
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: 'index.html',
			favicon: 'favicon.png',
		}),
		new MiniCssExtractPlugin({
			linkType: 'text/css',
		}),
	],
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.css', '.html'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	}
};

