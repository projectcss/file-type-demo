const HtmlWebpackPlugin = require('html-webpack-plugin');
const pkgdirSync = require('pkg-dir');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: ['./index.tsx'],
    resolve: {
        extensions: ['...', '.ts', '.tsx']
    },
    output: {
        publicPath: 'auto',
        clean: true
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?/,
                use: 'ts-loader'
            }
        ]
    },
    plugins: [
            // 处理file-type用到的node模块
    new webpack.NormalModuleReplacementPlugin(/node:/, resource => {
        const mod = resource.request.replace(/^node:/, '');
        switch (mod) {
            case 'buffer':
                resource.request = 'buffer';
                break;
            case 'stream':
                resource.request = 'readable-stream';
                break;
            default:
                throw new Error(`Not found ${mod}`);
        }
    }),
        new HtmlWebpackPlugin({
            template: path.resolve(pkgdirSync.sync(), './index.html'),
            alwaysWriteToDisk: true,
            scriptLoading: 'blocking'
        }),
    ]
};