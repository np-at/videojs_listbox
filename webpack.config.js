const path = require('path');


const isProduction = (process.env.NODE_ENV === 'production');

console.log('isProduction', isProduction);
module.exports = {
    devServer: {
        port: 9000,
        static: {
            directory: path.join(__dirname, 'static'),
            publicPath: '/',
        },
    },
    mode: isProduction ? 'production' : 'development',
    entry: './index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    externals: {
        'video.js': 'videojs'

    },
    context: path.resolve(__dirname),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};
