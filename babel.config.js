module.exports = api => {
    const babelPlugins = [
        ['transform-imports', {
            '@material-ui/core': {
                'transform': '@material-ui/core/${member}',
                'preventFullImport': true
            },
            '@material-ui/icons': {
                'transform': '@material-ui/icons/${member}',
                'preventFullImport': true
            }
        }],
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-syntax-dynamic-import'
    ]

    if (!api.env('production') && !api.env('test')) {
        babelPlugins.push('react-hot-loader/babel')
    }

    if (api.env('test')) {
        babelPlugins.push('@babel/plugin-transform-runtime')
    }

    return {
        'presets': [
            ['@babel/preset-env', { modules: api.env('test') && 'auto' }],
            '@babel/preset-react',
            '@babel/preset-typescript'
        ],
        'plugins': babelPlugins
    }
}
