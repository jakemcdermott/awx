process.env.CHROME_BIN = require('puppeteer').executablePath();

const path = require('path');

const SRC_PATH = path.resolve(__dirname, '../../client/src');
const NODE_MODULES = path.resolve(__dirname, '../../node_modules');

const webpackConfig = require('./webpack.unit');

module.exports = config => {
    config.set({
        basePath: '',
        singleRun: true,
        autoWatch: false,
        colors: true,
        frameworks: ['jasmine'],
        browsers: ['ChromeHeadless'],
        reporters: ['progress', 'junit'],
        files: [
            path.join(SRC_PATH, 'vendor.js'),
            path.join(SRC_PATH, 'app.js'),
            path.join(SRC_PATH, '**/*.html'),
            'index.js'
        ],
        plugins: [
            'karma-webpack',
            'karma-jasmine',
            'karma-junit-reporter',
            'karma-chrome-launcher',
            'karma-html2js-preprocessor'
        ],
        preprocessors: {
            [path.join(SRC_PATH, 'vendor.js')]: 'webpack',
            [path.join(SRC_PATH, 'app.js')]: 'webpack',
            [path.join(SRC_PATH, '**/*.html')]: 'html2js',
            'index.js': 'webpack'
        },
        webpack: webpackConfig,
        webpackMiddleware: {
            noInfo: 'errors-only'
        },
        junitReporter: {
            outputDir: 'reports',
            outputFile: 'results.unit.xml',
            useBrowserName: false
        }
    });
};
