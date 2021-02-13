/* eslint-disable node/no-unpublished-require */
const webpack = require('webpack');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

// Reference Webpack
// See https://github.com/AnomalyInnovations/serverless-bundle

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  // Generate sourcemaps for proper error messages
  devtool: 'source-map',
  // Since 'aws-sdk' is not compatible with webpack,
  // we exclude all node dependencies
  externals: [
    nodeExternals({
      allowlist: [
        // '@babel/runtime/regenerator',
        // '@babel/runtime/helpers/asyncToGenerator',
        '@babel/runtime',
        'ramda',
        // 'faunadb',
      ],
    }),
  ],
  plugins: [],
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  optimization: {
    // We no not want to minimize our code.
    minimize: false,
  },
  performance: {
    // Turn off size warnings for entry points
    hints: false,
  },
  resolve: {
    // symlinks: true,
    // alias: {
    //   '@src': path.resolve(__dirname, 'src'),
    // },
    extensions: ['*', '.js', '.mjs'], // <-- Here, it works
  },
  // Run babel on all .js files and skip those in node_modules
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: __dirname,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: { node: '12' },
                    useBuiltIns: 'usage',
                    corejs: 3,
                  },
                ],
              ],
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-optional-chaining',
                'babel-plugin-source-map-support',
              ],
              /**
               * 'unambiguous' source type
               * To allow using CommonJS 'module.exports'
               * TODO: Migrate everything in the API to ES Modules
               * Client devices might need node recompiled to node 12
               * to support the webpack output (prob not though)
               * */
              sourceType: 'unambiguous',
            },
          },
        ],
      },
    ],
  },
};
