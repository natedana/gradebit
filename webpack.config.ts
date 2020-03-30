import webpack from 'webpack'
import path from 'path'
// @ts-ignore
import BundleTracker from 'webpack-bundle-tracker'
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import webpackMerge from 'webpack-merge'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CircularDependencyPlugin from 'circular-dependency-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import ForkTsCheckerPlugin from 'fork-ts-checker-webpack-plugin'

import { version } from './package.json'

interface Env {
    production?: boolean
}

interface PlatformConfig {
    development: webpack.Configuration
    production: webpack.Configuration
}

const outputPath = 'build/web/'

const defaultEnv: Env = {
    production: false
}

const entry = [
    'core-js/stable',
    'regenerator-runtime/runtime',
    './client/src/index.tsx'
]

export const baseConfig = ({ production = false }: Env = {}) => {

    const config: webpack.Configuration = {
        context: __dirname,

        target: 'web',

        output: {
            path: path.join(__dirname, outputPath),
            sourcePrefix: ''
        },

        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendors: {
                        chunks: 'all',
                        test: /[\\/]node_modules[\\/]/,
                        priority: -10,
                        enforce: true
                    },
                    styles: {
                        chunks: 'initial',
                        test: /\.s?css$/,
                        priority: -15,
                        enforce: true
                    }
                }
            }
        },

        performance: {
            hints: false
        },

        plugins: [
            new CircularDependencyPlugin({
                // exclude detection of files based on a RegExp
                exclude: /node_modules/,
                // add errors to webpack instead of warnings
                failOnError: true,
                // set the current working directory for displaying module paths
                cwd: process.cwd()
            }),
            // define variables to be supplied to JS at compile time based on
            // environment or webpack configuration
            // access like `process.env.version`
            new webpack.DefinePlugin({
                'process.env.version': JSON.stringify(version)
                // CESIUM_BASE_URL: JSON.stringify('')
            }),
            new BundleAnalyzerPlugin({
                generateStatsFile: false,
                analyzerMode: 'disabled', // set to 'server' to see UI in browser
                analyzerPort: 8999
            }),
            new BundleTracker({
                path: path.join(__dirname, outputPath)
            }),
            new CaseSensitivePathsPlugin(),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new MiniCssExtractPlugin({
                filename: '[name]-[chunkhash].css',
                chunkFilename: '[name]-[chunkhash].css'
            }),
            new ForkTsCheckerPlugin({
                async: production,
                tsconfig: './tsconfig.prod.json'
            })
        ],

        resolve: {
            extensions: [' ', '.js', '.ts', '.tsx', '.json'],
            plugins: [
                new TsconfigPathsPlugin()
            ]
        },

        module: {
            unknownContextCritical: false,
            rules: [
                {
                    test: /\.s?css$/,
                    use: [
                        production ? MiniCssExtractPlugin.loader : 'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                modules: {
                                    mode: 'global',
                                    localIdentName: '[name]--[local]--[hash:base64]'
                                }
                            }
                        },
                        'sass-loader'
                    ],
                    sideEffects: true
                },
                {
                    test: /\.tsx?$/,
                    use: [
                        'babel-loader',
                        {
                            loader: 'eslint-loader',
                            options: {
                                failOnError: production,
                                failOnWarning: production
                            }
                        }
                    ],
                    exclude: /node_modules/
                },
                {
                    test: /\.(woff|woff2)$/,
                    loader: 'url-loader',
                    options: {
                        prefix: 'font/',
                        limit: 10000
                    }
                },
                {
                    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/octet-stream'
                    }
                },
                {
                    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'file-loader'
                },
                {
                    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'image/svg+xml'
                    }
                },
                {
                    test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
                    loader: 'url-loader',
                    options: {
                        name: 'images/[name].[ext]',
                        limit: 10000
                    }
                },
                {
                    test: /\.json$/,
                    loader: 'url-loader',
                    type: 'javascript/dynamic',
                    options: {
                        name: 'data/[name].[ext]',
                        limit: 10000
                    },
                    exclude: /node_modules/
                },
                {
                    test: /\.md$/,
                    use: 'raw-loader'
                }
            ]
        },

        watchOptions: {
            poll: true,
            ignored: /node_modules/
        }
    }

    return config
}

const devConfig = () => {
    const devServerHost = 'localhost'
    const devServerPort = 3000

    const config: webpack.Configuration = {
        entry: [
            'react-hot-loader/patch',
            ...entry
        ],
        output: {
            publicPath: 'http://' + devServerHost + ':' + devServerPort + '/' + outputPath,
            filename: '[name].js'
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin()
        ],
        // @ts-ignore
        devServer: {
            host: devServerHost,
            port: devServerPort,
            historyApiFallback: true,
            hot: true,
            headers: { 'Access-Control-Allow-Origin': '*' },
            watchOptions: {
                ignored: /node_modules/
            }
        }
    }

    return config
}

const config: PlatformConfig = {
    development: devConfig(),
    production: {
        entry,
        output: {
            publicPath: '/static/',
            filename: '[name]-[chunkhash].js'
        }
    }
}

export default (env: Env) => {
    const webpackEnv = Object.assign({}, defaultEnv, env)

    return webpackMerge(
        baseConfig(webpackEnv),
        config[webpackEnv.production ? 'production' : 'development']
    )
}
